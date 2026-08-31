import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbFastingSession {
  id: string;
  start_at: string;
  end_at: string | null;
  target_hours: number;
}

// Bitmemiş (end_at null) en güncel oturum — kategori sayfası her açıldığında
// devam eden bir oruç var mı diye bunu çağırıyor.
export async function fetchActiveFastingSession(supabase: SupabaseClient, categoryId: string): Promise<DbFastingSession | null> {
  const { data, error } = await supabase
    .from("fasting_sessions")
    .select("id, start_at, end_at, target_hours")
    .eq("category_id", categoryId)
    .is("end_at", null)
    .order("start_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function startFasting(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  targetHours: number
): Promise<DbFastingSession> {
  const { data, error } = await supabase
    .from("fasting_sessions")
    .insert({ user_id: userId, category_id: categoryId, target_hours: targetHours })
    .select("id, start_at, end_at, target_hours")
    .single();
  if (error) throw error;
  return data;
}

export async function stopFasting(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("fasting_sessions").update({ end_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
