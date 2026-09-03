import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAiReport } from "@/lib/ai/claude";
import { average, calculateScore, type WeightedTask } from "@/lib/scoring";

type CategorizedTask = WeightedTask & { categoryId: string };
import { parseStructuredReport } from "@hayat-borsasi/shared";

// "eksikler" envanteri madde 7 — sadece günlük AI rapor arşivleme vardı
// (archiveDailyReportsFor), haftalık/aylık HİÇ otomatik arşivlenmiyordu —
// RaporClient.tsx'teki "Anlık özet sadece ekranda gösterilir, arşive kayıt
// gece otomatik olarak yapılacak" yorumu daha önce hiç gerçekleşmemişti.
// **Bilinçli mimari karar:** Vercel Hobby planının cron sayısı sınırlı
// olduğu için (proje zaten 2 cron kullanıyor: daily-report +
// check-price-alerts) AYRI bir haftalık/aylık cron eklemek yerine, bu
// dosyadaki fonksiyonlar mevcut GÜNLÜK cron'un (route.ts) İÇİNDEN, sadece
// arşivlenen gün haftanın/ayın son günüyse çağrılıyor — yeni bir cron
// slotu gerekmiyor.

interface TaskRow {
  id: string;
  category_id: string;
  weight: number;
}

interface SubtaskRow {
  id: string;
  task_id: string;
}

interface DailyEntryRow {
  date: string;
  daily_task_logs: { task_id: string; completed: boolean }[];
  daily_subtask_logs: { subtask_id: string; completed: boolean }[];
}

export interface ArchiveResult {
  processed: number;
  skipped: number;
  errors: string[];
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

function weighForDay(
  tasks: TaskRow[],
  subtasksByTask: Map<string, SubtaskRow[]>,
  day: DailyEntryRow | undefined
): CategorizedTask[] {
  const taskLogById = new Map((day?.daily_task_logs ?? []).map((l) => [l.task_id, l.completed]));
  const completedSubtaskIds = new Set(
    (day?.daily_subtask_logs ?? []).filter((l) => l.completed).map((l) => l.subtask_id)
  );
  return tasks.map((t) => {
    const taskSubtasks = subtasksByTask.get(t.id) ?? [];
    return {
      weight: t.weight,
      completed: taskLogById.get(t.id) ?? false,
      categoryId: t.category_id,
      subtaskTotal: taskSubtasks.length,
      subtaskCompleted: taskSubtasks.filter((s) => completedSubtaskIds.has(s.id)).length,
    };
  });
}

// Belirtilen [periodStart, periodEnd] aralığı için tüm kullanıcıların
// haftalık/aylık AI raporunu üretip ai_reports'a arşivler —
// archiveDailyReportsFor'un çoklu-gün versiyonu: her günün skorunu güncel
// görev tanımlarıyla yeniden hesaplayıp dönem boyunca ORTALAMASINI alıyor
// (Dashboard/RaporClient'ın "Aylık"ta zaten kullandığı AYNI yaklaşım).
async function archivePeriodReportsFor(
  admin: SupabaseClient,
  periodType: "weekly" | "monthly",
  periodLabel: "Haftalık" | "Aylık",
  periodStart: string,
  periodEnd: string
): Promise<ArchiveResult> {
  const result: ArchiveResult = { processed: 0, skipped: 0, errors: [] };

  const { data: profiles, error: profilesError } = await admin.from("profiles").select("id");
  if (profilesError) throw profilesError;

  for (const profile of profiles ?? []) {
    const userId = profile.id as string;
    try {
      const { data: existingReport } = await admin
        .from("ai_reports")
        .select("id")
        .eq("user_id", userId)
        .eq("period_type", periodType)
        .eq("period_start", periodStart)
        .maybeSingle();
      if (existingReport) {
        result.skipped++;
        continue;
      }

      const [{ data: categories }, { data: tasks }, { data: subtasks }, { data: entries }] = await Promise.all([
        admin.from("categories").select("id, name").eq("user_id", userId),
        admin.from("tasks").select("id, category_id, weight").eq("user_id", userId).eq("is_active", true),
        admin.from("subtasks").select("id, task_id").eq("user_id", userId).eq("is_active", true),
        admin
          .from("daily_entries")
          .select("date, daily_task_logs(task_id, completed), daily_subtask_logs(subtask_id, completed)")
          .eq("user_id", userId)
          .gte("date", periodStart)
          .lte("date", periodEnd),
      ]);

      const taskRows: TaskRow[] = tasks ?? [];
      const dayRows: DailyEntryRow[] = (entries ?? []) as DailyEntryRow[];
      if (taskRows.length === 0 || dayRows.length === 0) {
        result.skipped++;
        continue;
      }

      const subtasksByTask = buildSubtaskMap(subtasks ?? []);
      const dayById = new Map(dayRows.map((d) => [d.date, d]));

      const dailyOverallScores: number[] = [];
      const categoryDailyScores = new Map<string, number[]>();
      for (const c of categories ?? []) categoryDailyScores.set(c.id as string, []);

      for (const day of dayRows) {
        const weighted = weighForDay(taskRows, subtasksByTask, dayById.get(day.date));
        dailyOverallScores.push(calculateScore(weighted));
        for (const c of categories ?? []) {
          const list = categoryDailyScores.get(c.id as string)!;
          list.push(calculateScore(weighted.filter((t) => t.categoryId === c.id)));
        }
      }

      const overallScore = average(dailyOverallScores);
      const categorySummaries = (categories ?? []).map((c) => ({
        name: c.name as string,
        score: average(categoryDailyScores.get(c.id as string) ?? []),
      }));

      // completedWeight/totalWeight — dönemin SON GÜNÜNÜN gerçek durumu
      // (archiveDailyReportsFor'un "bugün" için yaptığının aynısı, sadece
      // dönemin son gününe uygulandı).
      const lastDayWeighted = weighForDay(taskRows, subtasksByTask, dayById.get(periodEnd));
      const completedWeight = lastDayWeighted.filter((t) => t.completed).reduce((sum, t) => sum + t.weight, 0);
      const totalWeight = lastDayWeighted.reduce((sum, t) => sum + t.weight, 0);

      const content = await generateAiReport({
        period: periodLabel,
        overallScore,
        overallDelta: 0,
        categories: categorySummaries,
        completedWeight,
        totalWeight,
        dailyNote: "",
      });

      if (!parseStructuredReport(content)) {
        console.warn(`AI Rapor (${userId}, ${periodType}, ${periodStart}) beklenen JSON şemasına uymuyor.`);
      }

      const { error: insertError } = await admin.from("ai_reports").insert({
        user_id: userId,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
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

// Pazartesi-Pazar haftası — currentWeekStartIso (packages/shared/src/supabase/reviews.ts)
// ile AYNI Pazartesi-başlangıçlı mantık, UTC'de (bu dosyadaki `d` zaten
// UTC gece yarısı olarak kuruluyor, daily-archive.ts'teki previousDateIso
// ile AYNI kural — yerel/UTC karışmasın diye).
function weekStartIso(date: Date): string {
  const dayIndex = date.getUTCDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + mondayOffset);
  return monday.toISOString().slice(0, 10);
}

// Gece cron'undan (route.ts) çağrılıyor — `date` az önce biten günün
// tarihi. O gün Pazar'sa o haftayı, ayın son günüyse o ayı arşivler; hiçbiri
// değilse hiçbir şey yapmaz (no-op, yeni bir cron slotu gerektirmiyor).
export async function archiveWeeklyAndMonthlyIfPeriodEnded(
  admin: SupabaseClient,
  date: string
): Promise<{ weekly: ArchiveResult | null; monthly: ArchiveResult | null }> {
  const d = new Date(`${date}T00:00:00Z`);
  let weekly: ArchiveResult | null = null;
  let monthly: ArchiveResult | null = null;

  if (d.getUTCDay() === 0) {
    // Pazar (UTC gün indeksi 0) — o haftanın Pazartesi'si.
    const monday = weekStartIso(d);
    weekly = await archivePeriodReportsFor(admin, "weekly", "Haftalık", monday, date);
  }

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  if (d.getUTCDate() === daysInMonth) {
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    monthly = await archivePeriodReportsFor(admin, "monthly", "Aylık", monthStart, date);
  }

  return { weekly, monthly };
}
