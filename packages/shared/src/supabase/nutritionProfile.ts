import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLevel, BiologicalSex, CalorieGoal } from "../nutritionGoals";

export interface DbNutritionProfile {
  id: string;
  water_goal_ml: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: BiologicalSex | null;
  goal: CalorieGoal | null;
  // 2026-08-28: activity_level migration'ı (20260828140000) henüz herkeste
  // uygulanmamış olabilir — COLUMNS'a EKLENMEDİ (eklenseydi migration
  // uygulanmadan tüm profil yüklemesi kırılırdı). fetchNutritionProfile
  // önce bununla dener, sütun yoksa eski listeye düşer.
  activity_level?: ActivityLevel | null;
}

const COLUMNS = "id, water_goal_ml, weight_kg, height_cm, age, sex, goal";
const COLUMNS_WITH_ACTIVITY = `${COLUMNS}, activity_level`;

export async function fetchNutritionProfile(
  supabase: SupabaseClient,
  categoryId: string
): Promise<DbNutritionProfile | null> {
  try {
    const { data, error } = await supabase
      .from("nutrition_profiles")
      .select(COLUMNS_WITH_ACTIVITY)
      .eq("category_id", categoryId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch {
    const { data, error } = await supabase
      .from("nutrition_profiles")
      .select(COLUMNS)
      .eq("category_id", categoryId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}

// Su hedefi ve kalori profili aynı satırda yaşıyor — ikisi de bu tek
// upsert'le (kategori başına bir profil, category_id unique) güncellenebilir,
// hangi alanlar gönderilirse sadece onlar değişir.
export async function upsertNutritionProfile(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  fields: Partial<
    Pick<DbNutritionProfile, "water_goal_ml" | "weight_kg" | "height_cm" | "age" | "sex" | "goal" | "activity_level">
  >
): Promise<DbNutritionProfile> {
  const { activity_level, ...restFields } = fields;
  if (activity_level !== undefined) {
    try {
      const { data, error } = await supabase
        .from("nutrition_profiles")
        .upsert(
          { user_id: userId, category_id: categoryId, ...fields, updated_at: new Date().toISOString() },
          { onConflict: "category_id" }
        )
        .select(COLUMNS_WITH_ACTIVITY)
        .single();
      if (error) throw error;
      return data;
    } catch {
      // activity_level sütunu henüz yok (migration uygulanmamış) — o alan
      // olmadan devam et, geri kalan alanlar (kilo/boy/yaş/hedef vb.) yine
      // de kaydedilsin.
    }
  }
  const { data, error } = await supabase
    .from("nutrition_profiles")
    .upsert(
      { user_id: userId, category_id: categoryId, ...restFields, updated_at: new Date().toISOString() },
      { onConflict: "category_id" }
    )
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
