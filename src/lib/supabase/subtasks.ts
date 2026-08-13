import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchEntryForDate, yesterdayIso } from "./daily";

export interface DbSubtask {
  id: string;
  task_id: string;
  title: string;
  sort_order: number;
}

export interface DbSubtaskLog {
  subtask_id: string;
  completed: boolean;
}

export async function fetchSubtasks(supabase: SupabaseClient): Promise<DbSubtask[]> {
  const { data, error } = await supabase
    .from("subtasks")
    .select("id, task_id, title, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertSubtask(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  title: string,
  sortOrder: number
): Promise<DbSubtask> {
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ user_id: userId, task_id: taskId, title, sort_order: sortOrder })
    .select("id, task_id, title, sort_order")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubtaskById(supabase: SupabaseClient, subtaskId: string) {
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
  if (error) throw error;
}

export async function fetchSubtaskLogs(
  supabase: SupabaseClient,
  dailyEntryId: string
): Promise<DbSubtaskLog[]> {
  const { data, error } = await supabase
    .from("daily_subtask_logs")
    .select("subtask_id, completed")
    .eq("daily_entry_id", dailyEntryId);
  if (error) throw error;
  return data ?? [];
}

export async function fetchYesterdaySubtaskLogs(
  supabase: SupabaseClient,
  userId: string
): Promise<DbSubtaskLog[]> {
  const entry = await fetchEntryForDate(supabase, userId, yesterdayIso());
  if (!entry) return [];
  return fetchSubtaskLogs(supabase, entry.id);
}

export async function toggleSubtaskLog(
  supabase: SupabaseClient,
  dailyEntryId: string,
  subtaskId: string,
  currentlyCompleted: boolean
): Promise<DbSubtaskLog> {
  const { data, error } = await supabase
    .from("daily_subtask_logs")
    .upsert(
      { daily_entry_id: dailyEntryId, subtask_id: subtaskId, completed: !currentlyCompleted },
      { onConflict: "daily_entry_id,subtask_id" }
    )
    .select("subtask_id, completed")
    .single();
  if (error) throw error;
  return data;
}
