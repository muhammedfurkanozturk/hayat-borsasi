import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskFrequency = "daily" | "weekly" | "monthly";

export interface DbTask {
  id: string;
  category_id: string;
  title: string;
  weight: number;
  frequency: TaskFrequency;
}

export async function fetchTasks(supabase: SupabaseClient): Promise<DbTask[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, category_id, title, weight, frequency")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertTask(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  title: string,
  weight: number,
  frequency: TaskFrequency
): Promise<DbTask> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({ user_id: userId, category_id: categoryId, title, weight, frequency })
    .select("id, category_id, title, weight, frequency")
    .single();
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
