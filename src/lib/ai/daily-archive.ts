import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAiReport } from "@/lib/ai/claude";
import { calculateScore, type WeightedTask } from "@/lib/scoring";
import { parseStructuredReport } from "@hayat-borsasi/shared";

interface TaskRow {
  id: string;
  category_id: string;
  weight: number;
}

interface SubtaskRow {
  id: string;
  task_id: string;
}

type ScoredTask = WeightedTask & { id: string; categoryId: string };

function previousDateIso(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function buildSubtaskMap(subtasks: SubtaskRow[]): Map<string, SubtaskRow[]> {
  const map = new Map<string, SubtaskRow[]>();
  for (const s of subtasks) {
    const list = map.get(s.task_id) ?? [];
    list.push(s);
    map.set(s.task_id, list);
  }
  return map;
}

async function buildScoredTasks(
  admin: SupabaseClient,
  dailyEntryId: string,
  tasks: TaskRow[],
  subtasksByTask: Map<string, SubtaskRow[]>
): Promise<ScoredTask[]> {
  const [{ data: taskLogs }, { data: subtaskLogs }] = await Promise.all([
    admin.from("daily_task_logs").select("task_id, completed").eq("daily_entry_id", dailyEntryId),
    admin.from("daily_subtask_logs").select("subtask_id, completed").eq("daily_entry_id", dailyEntryId),
  ]);

  const completedByTask = new Map<string, boolean>((taskLogs ?? []).map((l) => [l.task_id, l.completed]));
  const completedSubtaskIds = new Set<string>(
    (subtaskLogs ?? []).filter((l) => l.completed).map((l) => l.subtask_id)
  );

  return tasks.map((t) => {
    const taskSubtasks = subtasksByTask.get(t.id) ?? [];
    return {
      id: t.id,
      categoryId: t.category_id,
      weight: t.weight,
      completed: completedByTask.get(t.id) ?? false,
      subtaskTotal: taskSubtasks.length,
      subtaskCompleted: taskSubtasks.filter((s) => completedSubtaskIds.has(s.id)).length,
    };
  });
}

// Bir önceki günün skorunu hesaplar — bugünkü görev/alt görev tanımlarını
// (weight, subtask sayısı) o günün loglarıyla birleştirir. Dashboard'daki
// previousDailyScore mantığıyla aynı: geçmişteki görev listesi değişse bile
// güncel tanım üzerinden yaklaşık bir kıyas üretir.
async function computePreviousScore(
  admin: SupabaseClient,
  userId: string,
  previousDate: string,
  tasks: TaskRow[],
  subtasksByTask: Map<string, SubtaskRow[]>
): Promise<number> {
  const { data: entry } = await admin
    .from("daily_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("date", previousDate)
    .maybeSingle();
  if (!entry) return 0;

  const scored = await buildScoredTasks(admin, entry.id, tasks, subtasksByTask);
  return calculateScore(scored);
}

export interface ArchiveResult {
  processed: number;
  skipped: number;
  errors: string[];
}

// Belirtilen tarih için tüm kullanıcıların gerçek günlük AI raporunu üretir
// ve ai_reports'a kaydeder. Gece cron job'ı tarafından çağrılır — service
// role ile RLS bypass edilerek tüm kullanıcılar tek seferde işlenir.
export async function archiveDailyReportsFor(admin: SupabaseClient, date: string): Promise<ArchiveResult> {
  const previousDate = previousDateIso(date);
  const result: ArchiveResult = { processed: 0, skipped: 0, errors: [] };

  const { data: profiles, error: profilesError } = await admin.from("profiles").select("id");
  if (profilesError) throw profilesError;

  for (const profile of profiles ?? []) {
    const userId = profile.id as string;
    try {
      const { data: entry } = await admin
        .from("daily_entries")
        .select("id, note_text")
        .eq("user_id", userId)
        .eq("date", date)
        .maybeSingle();

      if (!entry) {
        result.skipped++;
        continue;
      }

      const { data: existingReport } = await admin
        .from("ai_reports")
        .select("id")
        .eq("user_id", userId)
        .eq("period_type", "daily")
        .eq("period_start", date)
        .maybeSingle();

      if (existingReport) {
        result.skipped++;
        continue;
      }

      const [{ data: categories }, { data: tasks }, { data: subtasks }] = await Promise.all([
        admin.from("categories").select("id, name").eq("user_id", userId),
        admin.from("tasks").select("id, category_id, weight").eq("user_id", userId).eq("is_active", true),
        admin.from("subtasks").select("id, task_id").eq("user_id", userId).eq("is_active", true),
      ]);

      const taskRows: TaskRow[] = tasks ?? [];
      if (taskRows.length === 0) {
        result.skipped++;
        continue;
      }

      const subtasksByTask = buildSubtaskMap(subtasks ?? []);
      const scoredTasks = await buildScoredTasks(admin, entry.id, taskRows, subtasksByTask);

      const overallScore = calculateScore(scoredTasks);
      const previousScore = await computePreviousScore(admin, userId, previousDate, taskRows, subtasksByTask);
      const overallDelta = overallScore - previousScore;

      const categorySummaries = (categories ?? []).map((c) => ({
        name: c.name as string,
        score: calculateScore(scoredTasks.filter((t) => t.categoryId === c.id)),
      }));

      const completedWeight = scoredTasks
        .filter((t) => t.completed)
        .reduce((sum, t) => sum + t.weight, 0);
      const totalWeight = scoredTasks.reduce((sum, t) => sum + t.weight, 0);

      const content = await generateAiReport({
        period: "Günlük",
        overallScore,
        overallDelta,
        categories: categorySummaries,
        completedWeight,
        totalWeight,
        dailyNote: (entry.note_text as string) ?? "",
      });

      if (!parseStructuredReport(content)) {
        console.warn(`AI Rapor (${userId}, ${date}) beklenen JSON şemasına uymuyor, düz metin olarak arşivlenecek.`);
      }

      const { error: insertError } = await admin.from("ai_reports").insert({
        user_id: userId,
        period_type: "daily",
        period_start: date,
        period_end: date,
        content_text: content,
      });
      if (insertError) throw insertError;

      result.processed++;
    } catch (err) {
      result.errors.push(`${userId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
