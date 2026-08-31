import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbStyleProfile {
  id: string;
  skin_tone: string | null;
  body_type: string | null;
}

const COLUMNS = "id, skin_tone, body_type";

// style_profiles migration'ı (20260901110000) henüz uygulanmamış olabilir —
// tablo hiç yoksa bu fonksiyon hata fırlatır, çağıran taraf (StyleAdvicePanel)
// bunu yutup profili "boş/opsiyonel" kabul eder, AI Stilist akışını kilitlemez.
export async function fetchStyleProfile(supabase: SupabaseClient, categoryId: string): Promise<DbStyleProfile | null> {
  const { data, error } = await supabase.from("style_profiles").select(COLUMNS).eq("category_id", categoryId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertStyleProfile(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  fields: { skin_tone: string | null; body_type: string | null }
): Promise<DbStyleProfile> {
  const { data, error } = await supabase
    .from("style_profiles")
    .upsert(
      { user_id: userId, category_id: categoryId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: "category_id" }
    )
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
