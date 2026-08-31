import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbFocusSession {
  id: string;
  duration_minutes: number;
  completed_at: string;
  subject_id: string | null;
  distracted_seconds: number | null;
}

const FOCUS_SESSION_COLUMNS = "id, duration_minutes, completed_at, subject_id, distracted_seconds";

export async function insertFocusSession(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  durationMinutes: number,
  input?: { subjectId?: string | null; distractedSeconds?: number | null }
): Promise<DbFocusSession> {
  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: userId,
      category_id: categoryId,
      duration_minutes: durationMinutes,
      subject_id: input?.subjectId ?? null,
      distracted_seconds: input?.distractedSeconds ?? null,
    })
    .select(FOCUS_SESSION_COLUMNS)
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
    .select(FOCUS_SESSION_COLUMNS)
    .eq("category_id", categoryId)
    .gte("completed_at", sinceIso)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface DbFocusSubject {
  id: string;
  name: string;
  sort_order: number;
}

// Prodpod'daki (piyasa araştırması) ders/konu bazlı seans takibi — meals/
// exercises ile aynı desen, kullanıcının kendi kütüphanesi.
export async function fetchFocusSubjects(supabase: SupabaseClient, categoryId: string): Promise<DbFocusSubject[]> {
  const { data, error } = await supabase
    .from("focus_subjects")
    .select("id, name, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertFocusSubject(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  name: string,
  sortOrder: number
): Promise<DbFocusSubject> {
  const { data, error } = await supabase
    .from("focus_subjects")
    .insert({ user_id: userId, category_id: categoryId, name, sort_order: sortOrder })
    .select("id, name, sort_order")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFocusSubject(supabase: SupabaseClient, subjectId: string) {
  const { error } = await supabase.from("focus_subjects").delete().eq("id", subjectId);
  if (error) throw error;
}
