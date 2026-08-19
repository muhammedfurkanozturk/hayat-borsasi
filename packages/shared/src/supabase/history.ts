import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbHistoryEntry {
  date: string;
  daily_task_logs: { task_id: string; completed: boolean }[];
  daily_subtask_logs: { subtask_id: string; completed: boolean }[];
}

// Son N gün için kullanıcının gün gün görev/alt görev işaretleme geçmişini
// tek sorguda (PostgREST embedded join) çeker. Skor Trendi grafiği ve
// kategori kutucuklarındaki yıllık katkı oranı bunun üzerine hesaplanır.
export async function fetchDailyHistory(
  supabase: SupabaseClient,
  userId: string,
  sinceDate: string
): Promise<DbHistoryEntry[]> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("date, daily_task_logs(task_id, completed), daily_subtask_logs(subtask_id, completed)")
    .eq("user_id", userId)
    .gte("date", sinceDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbHistoryEntry[];
}
