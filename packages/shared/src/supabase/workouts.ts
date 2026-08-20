import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbWorkoutSet {
  id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight_kg: number | null;
  date: string;
}

export async function fetchWorkoutSets(
  supabase: SupabaseClient,
  categoryId: string,
  sinceDate: string
): Promise<DbWorkoutSet[]> {
  const { data, error } = await supabase
    .from("workout_sets")
    .select("id, exercise_name, set_number, reps, weight_kg, date")
    .eq("category_id", categoryId)
    .gte("date", sinceDate)
    .order("date", { ascending: false })
    .order("set_number", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertWorkoutSet(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  input: { exerciseName: string; setNumber: number; reps: number; weightKg: number | null; date: string }
): Promise<DbWorkoutSet> {
  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      user_id: userId,
      category_id: categoryId,
      exercise_name: input.exerciseName,
      set_number: input.setNumber,
      reps: input.reps,
      weight_kg: input.weightKg,
      date: input.date,
    })
    .select("id, exercise_name, set_number, reps, weight_kg, date")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkoutSet(supabase: SupabaseClient, setId: string) {
  const { error } = await supabase.from("workout_sets").delete().eq("id", setId);
  if (error) throw error;
}
