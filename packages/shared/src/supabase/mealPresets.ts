import type { SupabaseClient } from "@supabase/supabase-js";

// "Sık Yapılan Öğünler" (2026-08-28, Bölüm 2e) — kullanıcının bir öğünün o
// anki içeriğini (birden çok saved_foods parçası) isimli bir şablon olarak
// kaydedip tek tıkla başka bir güne/öğüne uygulayabilmesi için. workout_
// template_items/roadmap_nodes ile aynı desen: join'li RLS yerine her satır
// kendi user_id'sini taşıyor.
export interface DbMealPreset {
  id: string;
  category_id: string;
  name: string;
}

export interface DbMealPresetItem {
  id: string;
  preset_id: string;
  saved_food_id: string;
}

export async function fetchMealPresets(supabase: SupabaseClient, categoryId: string): Promise<DbMealPreset[]> {
  const { data, error } = await supabase
    .from("meal_presets")
    .select("id, category_id, name")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Şablon içerikleri (saved_food_id listesi) tek bir sorguda hepsi birden
// çekiliyor (kişisel kullanım ölçeğinde veri hacmi küçük) — presetId'ye göre
// client tarafında gruplanıyor, N+1 sorgu yok.
export async function fetchMealPresetItems(supabase: SupabaseClient): Promise<DbMealPresetItem[]> {
  const { data, error } = await supabase.from("meal_preset_items").select("id, preset_id, saved_food_id");
  if (error) throw error;
  return data ?? [];
}

export async function insertMealPreset(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  name: string,
  savedFoodIds: string[]
): Promise<{ preset: DbMealPreset; items: DbMealPresetItem[] }> {
  const { data: preset, error: presetError } = await supabase
    .from("meal_presets")
    .insert({ user_id: userId, category_id: categoryId, name })
    .select("id, category_id, name")
    .single();
  if (presetError) throw presetError;

  const { data: items, error: itemsError } = await supabase
    .from("meal_preset_items")
    .insert(savedFoodIds.map((savedFoodId) => ({ user_id: userId, preset_id: preset.id, saved_food_id: savedFoodId })))
    .select("id, preset_id, saved_food_id");
  if (itemsError) throw itemsError;

  return { preset, items: items ?? [] };
}

export async function deleteMealPreset(supabase: SupabaseClient, presetId: string) {
  const { error } = await supabase.from("meal_presets").delete().eq("id", presetId);
  if (error) throw error;
}
