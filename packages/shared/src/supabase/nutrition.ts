import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbMealLog {
  id: string;
  date: string;
  description: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  ai_summary: string | null;
}

export async function fetchMealLogs(supabase: SupabaseClient, categoryId: string, sinceDate: string): Promise<DbMealLog[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select("id, date, description, calories, protein_g, carbs_g, fat_g, ai_summary")
    .eq("category_id", categoryId)
    .gte("date", sinceDate)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface MealLogInput {
  date: string;
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  aiSummary: string | null;
}

export async function insertMealLog(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  input: MealLogInput
): Promise<DbMealLog> {
  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      user_id: userId,
      category_id: categoryId,
      date: input.date,
      description: input.description,
      calories: input.calories,
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
      ai_summary: input.aiSummary,
    })
    .select("id, date, description, calories, protein_g, carbs_g, fat_g, ai_summary")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMealLog(supabase: SupabaseClient, mealLogId: string) {
  const { error } = await supabase.from("meal_logs").delete().eq("id", mealLogId);
  if (error) throw error;
}
