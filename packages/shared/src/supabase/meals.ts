import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbMeal {
  id: string;
  name: string;
  sort_order: number;
}

const DEFAULT_MEAL_NAMES = ["Kahvaltı", "Öğle Yemeği", "Akşam Yemeği"];

export async function fetchMeals(supabase: SupabaseClient, categoryId: string): Promise<DbMeal[]> {
  const { data, error } = await supabase
    .from("meals")
    .select("id, name, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertMeal(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  name: string,
  sortOrder: number
): Promise<DbMeal> {
  const { data, error } = await supabase
    .from("meals")
    .insert({ user_id: userId, category_id: categoryId, name, sort_order: sortOrder })
    .select("id, name, sort_order")
    .single();
  if (error) throw error;
  return data;
}

// Bir kategoriye ilk kez girildiğinde (henüz hiç öğün yoksa) varsayılan 3
// öğünü tek seferde oluşturur — sadece bir öneri, kullanıcı sonradan
// yeniden adlandırabilir/silebilir/ekleyebilir (bkz. CLAUDE.md bölüm 1).
export async function insertDefaultMeals(supabase: SupabaseClient, userId: string, categoryId: string): Promise<DbMeal[]> {
  const rows = DEFAULT_MEAL_NAMES.map((name, index) => ({
    user_id: userId,
    category_id: categoryId,
    name,
    sort_order: index,
  }));
  const { data, error } = await supabase.from("meals").insert(rows).select("id, name, sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function updateMealName(supabase: SupabaseClient, mealId: string, name: string) {
  const { error } = await supabase.from("meals").update({ name }).eq("id", mealId);
  if (error) throw error;
}

export async function deleteMeal(supabase: SupabaseClient, mealId: string) {
  const { error } = await supabase.from("meals").delete().eq("id", mealId);
  if (error) throw error;
}
