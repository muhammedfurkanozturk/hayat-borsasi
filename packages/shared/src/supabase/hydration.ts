import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbWaterLog {
  id: string;
  date: string;
  amount_ml: number;
}

const GLASS_ML = 250;

export async function fetchWaterLogs(supabase: SupabaseClient, categoryId: string, sinceDate: string): Promise<DbWaterLog[]> {
  const { data, error } = await supabase
    .from("water_logs")
    .select("id, date, amount_ml")
    .eq("category_id", categoryId)
    .gte("date", sinceDate)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertWaterLog(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  date: string,
  amountMl: number = GLASS_ML
): Promise<DbWaterLog> {
  const { data, error } = await supabase
    .from("water_logs")
    .insert({ user_id: userId, category_id: categoryId, date, amount_ml: amountMl })
    .select("id, date, amount_ml")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWaterLog(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("water_logs").delete().eq("id", id);
  if (error) throw error;
}
