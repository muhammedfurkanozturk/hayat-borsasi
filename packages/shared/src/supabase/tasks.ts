import type { SupabaseClient } from "@supabase/supabase-js";
import type { HabitCostPeriod } from "../habits";

export type TaskFrequency = "daily" | "weekly" | "monthly";

export interface DbTask {
  id: string;
  category_id: string;
  title: string;
  weight: number;
  frequency: TaskFrequency;
  is_habit_break: boolean;
  habit_cost_amount: number | null;
  habit_cost_period: HabitCostPeriod | null;
  created_at: string;
  // 2026-08-28: sort_order migration'ı (20260828130000) henüz herkeste
  // uygulanmamış olabilir — TASK_COLUMNS'a EKLENMEDİ (eklenseydi migration
  // uygulanmadan tüm görev yüklemesi kırılırdı, bkz. CLAUDE.md). fetchTasks/
  // insertTask önce bununla dener, sütun yoksa eski (created_at sıralı)
  // davranışa düşer — sort_order o zaman undefined kalır.
  sort_order?: number;
}

const TASK_COLUMNS = "id, category_id, title, weight, frequency, is_habit_break, habit_cost_amount, habit_cost_period, created_at";
const TASK_COLUMNS_WITH_SORT_ORDER = `${TASK_COLUMNS}, sort_order`;

export async function fetchTasks(supabase: SupabaseClient): Promise<DbTask[]> {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select(TASK_COLUMNS_WITH_SORT_ORDER)
      .eq("is_active", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    const { data, error } = await supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
}

// Kategori sayfasındaki "Görevler" listesinde yukarı/aşağı butonlarıyla
// elle sıralama — iki komşu görevin sort_order'ını takas ediyor. sort_order
// migration'ı uygulanmamışsa çağıran taraf (app-data-context.tsx) bu
// fonksiyonu hiç çağırmıyor (task.sortOrder null kontrolüyle).
export async function swapTaskSortOrder(
  supabase: SupabaseClient,
  taskAId: string,
  taskASortOrder: number,
  taskBId: string,
  taskBSortOrder: number
) {
  const { error: errorA } = await supabase.from("tasks").update({ sort_order: taskBSortOrder }).eq("id", taskAId);
  if (errorA) throw errorA;
  const { error: errorB } = await supabase.from("tasks").update({ sort_order: taskASortOrder }).eq("id", taskBId);
  if (errorB) throw errorB;
}

// Quitzilla'daki (piyasa araştırması) para/zaman tasarrufu hesaplayıcısı
// için — is_habit_break=true satırlarda anlamlı, diğer görevlerde null kalır.
export async function updateHabitCost(
  supabase: SupabaseClient,
  taskId: string,
  costAmount: number | null,
  costPeriod: HabitCostPeriod | null
) {
  const { error } = await supabase
    .from("tasks")
    .update({ habit_cost_amount: costAmount, habit_cost_period: costPeriod })
    .eq("id", taskId);
  if (error) throw error;
}

export async function insertTask(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  title: string,
  weight: number,
  frequency: TaskFrequency,
  isHabitBreak = false,
  sortOrder?: number
): Promise<DbTask> {
  const basePayload = { user_id: userId, category_id: categoryId, title, weight, frequency, is_habit_break: isHabitBreak };
  if (sortOrder !== undefined) {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...basePayload, sort_order: sortOrder })
        .select(TASK_COLUMNS_WITH_SORT_ORDER)
        .single();
      if (error) throw error;
      return data;
    } catch {
      // sort_order sütunu henüz yok (migration uygulanmamış) — aşağıdaki
      // eski davranışa düş.
    }
  }
  const { data, error } = await supabase.from("tasks").insert(basePayload).select(TASK_COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function deleteTaskById(supabase: SupabaseClient, taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function updateTaskFrequency(
  supabase: SupabaseClient,
  taskId: string,
  frequency: TaskFrequency
) {
  const { error } = await supabase.from("tasks").update({ frequency }).eq("id", taskId);
  if (error) throw error;
}

// 2026-08-26 (kullanıcı bulgusu): ağırlık oluşturma anında ayarlanabiliyordu
// ama güncelleme fonksiyonu hiç yoktu — updateTaskFrequency'nin eşleniği.
// Geçmiş günlerin skoru daily_history'de o günkü hesaplanmış haliyle
// donduğu için (calculateScore her zaman GÜNCEL weight'i kullanır, geçmiş
// kayıtları yeniden hesaplamaz) burada ayrıca bir "geçmişi koru" mantığı
// gerekmiyor — mimari zaten böyle çalışıyor.
export async function updateTaskWeight(supabase: SupabaseClient, taskId: string, weight: number) {
  const { error } = await supabase.from("tasks").update({ weight }).eq("id", taskId);
  if (error) throw error;
}
