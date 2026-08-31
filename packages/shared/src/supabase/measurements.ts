import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbBodyMeasurement {
  id: string;
  date: string;
  weight_kg: number;
}

export async function fetchBodyMeasurements(
  supabase: SupabaseClient,
  categoryId: string,
  sinceDate: string
): Promise<DbBodyMeasurement[]> {
  const { data, error } = await supabase
    .from("body_measurements")
    .select("id, date, weight_kg")
    .eq("category_id", categoryId)
    .gte("date", sinceDate)
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertBodyMeasurement(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  date: string,
  weightKg: number
): Promise<DbBodyMeasurement> {
  const { data, error } = await supabase
    .from("body_measurements")
    .insert({ user_id: userId, category_id: categoryId, date, weight_kg: weightKg })
    .select("id, date, weight_kg")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBodyMeasurement(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("body_measurements").delete().eq("id", id);
  if (error) throw error;
}
