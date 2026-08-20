import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbFocusSession {
  id: string;
  duration_minutes: number;
  completed_at: string;
}

export async function insertFocusSession(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  durationMinutes: number
): Promise<DbFocusSession> {
  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({ user_id: userId, category_id: categoryId, duration_minutes: durationMinutes })
    .select("id, duration_minutes, completed_at")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchFocusSessionsSince(
  supabase: SupabaseClient,
  categoryId: string,
  sinceIso: string
): Promise<DbFocusSession[]> {
  const { data, error } = await supabase
    .from("focus_sessions")
    .select("id, duration_minutes, completed_at")
    .eq("category_id", categoryId)
    .gte("completed_at", sinceIso)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
