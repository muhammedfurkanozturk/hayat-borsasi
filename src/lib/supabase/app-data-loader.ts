// "eksikler" envanteri madde 9 — AppDataProvider'ın client-side veri çekme
// gecikmesi ("kısa yükleniyor anı", bkz. CLAUDE.md'nin uzun süredir
// ertelenmiş notu). Bu dosya BİLEREK "use client" DEĞİL — app-data-context.tsx'in
// (client component) mount-effect'inde ÇAĞIRDIĞI AYNI hesaplama mantığı,
// burada saf/izomorfik bir fonksiyona çıkarıldı ki HEM server component'ten
// (cookie tabanlı server client'la, `(app)/layout.tsx`) HEM client'tan
// (browser client'la, mutation sonrası `refresh()`) aynı kod çağrılabilsin
// — iki yerde ayrı ayrı bakımı gereken bir kopya oluşmasın diye.
//
// **Bilinçli kapsam kararı:** Bu TAM bir "server components mimarisine
// geçiş" DEĞİL (yüzlerce component'i etkileyen, günler süren bir rewrite
// olurdu) — sadece İLK YÜKLEME verisi artık server'da (kullanıcı sayfayı
// ilk açtığında/yenilediğinde) hazırlanıp AppDataProvider'a "initialData"
// olarak veriliyor, boş başlayıp mount-effect'te client'ta yeniden
// çekilmiyor. Mutation'lar (görev ekle/sil/toggle vb.) HÂLÂ client
// tarafında, aynı optimistic-update deseniyle çalışıyor — bu dosya sadece
// "ilk anlık görüntüyü nereden alıyoruz" sorusunu değiştiriyor.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IconKey } from "@/components/icons";
import { calculateScore } from "@/lib/scoring";
import type { CategoryModuleType, DailyScorePoint, HabitCostPeriod } from "@hayat-borsasi/shared";
import { fetchCategories, toIconKey } from "./categories";
import { daysAgoIso, fetchTaskLogs, fetchYesterdayTaskLogs, getOrCreateTodayEntry } from "./daily";
import { fetchDailyHistory } from "./history";
import { fetchSubtaskLogs, fetchSubtasks, fetchYesterdaySubtaskLogs } from "./subtasks";
import { fetchTasks, type TaskFrequency } from "./tasks";

export interface Category {
  id: string;
  name: string;
  icon: IconKey;
  moduleType: CategoryModuleType;
  slug: string | null;
}

export interface Task {
  id: string;
  categoryId: string;
  title: string;
  weight: number;
  frequency: TaskFrequency;
  completed: boolean;
  completedAt: string | null;
  subtaskTotal: number;
  subtaskCompleted: number;
  isHabitBreak: boolean;
  habitCostAmount: number | null;
  habitCostPeriod: HabitCostPeriod | null;
  createdAt: string;
  sortOrder: number | null;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
}

export interface InitialAppData {
  dailyEntryId: string;
  dailyNote: string;
  categories: Category[];
  tasks: Task[];
  subtasks: Subtask[];
  previousDailyScore: number;
  dailyHistory: DailyScorePoint[];
}

export async function loadInitialAppData(supabase: SupabaseClient, userId: string): Promise<InitialAppData> {
  const [dbCategories, dbTasks, dbSubtasks, entry] = await Promise.all([
    fetchCategories(supabase),
    fetchTasks(supabase),
    fetchSubtasks(supabase),
    getOrCreateTodayEntry(supabase, userId),
  ]);

  const [logs, subtaskLogs, yesterdayLogs, yesterdaySubtaskLogs, historyEntries] = await Promise.all([
    fetchTaskLogs(supabase, entry.id),
    fetchSubtaskLogs(supabase, entry.id),
    fetchYesterdayTaskLogs(supabase, userId),
    fetchYesterdaySubtaskLogs(supabase, userId),
    fetchDailyHistory(supabase, userId, daysAgoIso(365)),
  ]);
  const logByTaskId = new Map(logs.map((log) => [log.task_id, log]));
  const subtaskLogById = new Map(subtaskLogs.map((log) => [log.subtask_id, log]));
  const yesterdayLogByTaskId = new Map(yesterdayLogs.map((log) => [log.task_id, log]));
  const yesterdaySubtaskLogById = new Map(yesterdaySubtaskLogs.map((log) => [log.subtask_id, log]));

  const subtasksByTaskId = new Map<string, typeof dbSubtasks>();
  for (const s of dbSubtasks) {
    const arr = subtasksByTaskId.get(s.task_id) ?? [];
    arr.push(s);
    subtasksByTaskId.set(s.task_id, arr);
  }

  const subtasks: Subtask[] = dbSubtasks.map((s) => ({
    id: s.id,
    taskId: s.task_id,
    title: s.title,
    completed: subtaskLogById.get(s.id)?.completed ?? false,
  }));

  const tasks: Task[] = dbTasks.map((t) => {
    const log = logByTaskId.get(t.id);
    const taskSubtasks = subtasksByTaskId.get(t.id) ?? [];
    const subtaskCompleted = taskSubtasks.filter((s) => subtaskLogById.get(s.id)?.completed).length;
    return {
      id: t.id,
      categoryId: t.category_id,
      title: t.title,
      weight: t.weight,
      frequency: t.frequency,
      completed: log?.completed ?? false,
      completedAt: log?.completed_at ?? null,
      subtaskTotal: taskSubtasks.length,
      subtaskCompleted,
      isHabitBreak: t.is_habit_break,
      habitCostAmount: t.habit_cost_amount,
      habitCostPeriod: t.habit_cost_period,
      createdAt: t.created_at,
      sortOrder: t.sort_order ?? null,
    };
  });

  // Aynı görev ağırlıklarını, dünkü işaretlenme durumuyla eşleştirip
  // "önceki güne göre değişim" (delta) için bir kıyas noktası çıkarıyoruz.
  const yesterdayWeighted = dbTasks.map((t) => {
    const taskSubtasks = subtasksByTaskId.get(t.id) ?? [];
    const subtaskCompleted = taskSubtasks.filter((s) => yesterdaySubtaskLogById.get(s.id)?.completed).length;
    return {
      weight: t.weight,
      completed: yesterdayLogByTaskId.get(t.id)?.completed ?? false,
      categoryId: t.category_id,
      subtaskTotal: taskSubtasks.length,
      subtaskCompleted,
    };
  });

  // Geçmişteki her gün için, o günün işaretlenme kayıtlarını güncel görev/
  // kategori tanımlarıyla eşleştirip o günün skorunu çıkarıyoruz (bugünkü
  // satır da dahil, ama bugünkü canlı değeri kullanan bileşenler bunu kendi
  // anlık hesaplamalarıyla ezip günceller — bkz. Dashboard/ScoreChart).
  const dailyHistory: DailyScorePoint[] = historyEntries.map((day) => {
    const dayTaskLogById = new Map(day.daily_task_logs.map((l) => [l.task_id, l.completed]));
    const dayCompletedSubtaskIds = new Set(
      day.daily_subtask_logs.filter((l) => l.completed).map((l) => l.subtask_id)
    );

    const dayWeighted = dbTasks.map((t) => {
      const taskSubtasks = subtasksByTaskId.get(t.id) ?? [];
      return {
        weight: t.weight,
        completed: dayTaskLogById.get(t.id) ?? false,
        categoryId: t.category_id,
        subtaskTotal: taskSubtasks.length,
        subtaskCompleted: taskSubtasks.filter((s) => dayCompletedSubtaskIds.has(s.id)).length,
      };
    });

    const categoryScores: Record<string, number> = {};
    for (const category of dbCategories) {
      categoryScores[category.id] = calculateScore(dayWeighted.filter((t) => t.categoryId === category.id));
    }

    return { date: day.date, overallScore: calculateScore(dayWeighted), categoryScores };
  });

  return {
    dailyEntryId: entry.id,
    dailyNote: entry.note_text,
    categories: dbCategories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: toIconKey(c.icon),
      moduleType: c.module_type,
      slug: c.slug,
    })),
    tasks,
    subtasks,
    previousDailyScore: calculateScore(yesterdayWeighted),
    dailyHistory,
  };
}
