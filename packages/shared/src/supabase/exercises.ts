import type { SupabaseClient } from "@supabase/supabase-js";
import type { MuscleGroup } from "../exerciseLibrary";

export interface DbExercise {
  id: string;
  name: string;
  sort_order: number;
  primary_muscle?: MuscleGroup | null;
}

const DEFAULT_EXERCISE_NAMES = ["Bench Press", "Squat", "Deadlift", "Omuz Press", "Barfiks", "Mekik"];

const COLUMNS = "id, name, sort_order";
// 2026-08-29 (Kas Haritası): primary_muscle migration'ı (20260901090000)
// henüz uygulanmamış olabilir — diğer defansif alanlarla (sort_order,
// quantity vb.) aynı desen, önce bu sütunla dener, olmazsa düşer.
const COLUMNS_WITH_MUSCLE = "id, name, sort_order, primary_muscle";

export async function fetchExercises(supabase: SupabaseClient, categoryId: string): Promise<DbExercise[]> {
  try {
    const { data, error } = await supabase
      .from("exercises")
      .select(COLUMNS_WITH_MUSCLE)
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch {
    const { data, error } = await supabase
      .from("exercises")
      .select(COLUMNS)
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
}

export async function insertExercise(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  name: string,
  sortOrder: number
): Promise<DbExercise> {
  const { data, error } = await supabase
    .from("exercises")
    .insert({ user_id: userId, category_id: categoryId, name, sort_order: sortOrder })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// Bir kategoriye ilk kez girildiğinde (henüz hiç hareket yoksa) birkaç
// yaygın hareketi öneri olarak ekler — meals'daki "insertDefaultMeals" ile
// aynı desen, tamamen silinebilir/değiştirilebilir (dayatma yok).
export async function insertDefaultExercises(supabase: SupabaseClient, userId: string, categoryId: string): Promise<DbExercise[]> {
  const rows = DEFAULT_EXERCISE_NAMES.map((name, index) => ({
    user_id: userId,
    category_id: categoryId,
    name,
    sort_order: index,
  }));
  const { data, error } = await supabase.from("exercises").insert(rows).select(COLUMNS);
  if (error) throw error;
  return data ?? [];
}

export async function deleteExercise(supabase: SupabaseClient, exerciseId: string) {
  const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
  if (error) throw error;
}

// Kullanıcı kendi hareketini (opsiyonel olarak) bir kas grubuna etiketler
// — Kas Haritası'ndaki hacim ısı-haritası bunu kullanıyor. Migration
// uygulanmamışsa sessizce başarısız olur, çağıran yer bunu yutup ana akışı
// kilitlemez (bkz. MuscleMapPanel.tsx).
export async function updateExerciseMuscle(supabase: SupabaseClient, exerciseId: string, muscle: MuscleGroup | null) {
  const { error } = await supabase.from("exercises").update({ primary_muscle: muscle }).eq("id", exerciseId);
  if (error) throw error;
}
