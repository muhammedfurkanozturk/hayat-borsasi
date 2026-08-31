import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbWorkoutTemplate {
  id: string;
  name: string;
  sort_order: number;
}

export interface DbWorkoutTemplateItem {
  id: string;
  template_id: string;
  exercise_name: string;
  sort_order: number;
}

export async function fetchWorkoutTemplates(supabase: SupabaseClient, categoryId: string): Promise<DbWorkoutTemplate[]> {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("id, name, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// category_id doğrudan workout_template_items'ta yok (subtasks tablosuyla
// aynı desen — template_id üzerinden dolaylı), bu yüzden önce o kategorinin
// şablon id'leri alınıp items onlara göre filtreleniyor.
export async function fetchWorkoutTemplateItems(supabase: SupabaseClient, templateIds: string[]): Promise<DbWorkoutTemplateItem[]> {
  if (templateIds.length === 0) return [];
  const { data, error } = await supabase
    .from("workout_template_items")
    .select("id, template_id, exercise_name, sort_order")
    .in("template_id", templateIds)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertWorkoutTemplate(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  name: string,
  exerciseNames: string[],
  sortOrder: number
): Promise<{ template: DbWorkoutTemplate; items: DbWorkoutTemplateItem[] }> {
  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: userId, category_id: categoryId, name, sort_order: sortOrder })
    .select("id, name, sort_order")
    .single();
  if (templateError) throw templateError;

  const itemRows = exerciseNames.map((exerciseName, index) => ({
    user_id: userId,
    template_id: template.id,
    exercise_name: exerciseName,
    sort_order: index,
  }));
  const { data: items, error: itemsError } = await supabase
    .from("workout_template_items")
    .insert(itemRows)
    .select("id, template_id, exercise_name, sort_order");
  if (itemsError) throw itemsError;

  return { template, items: items ?? [] };
}

export async function deleteWorkoutTemplate(supabase: SupabaseClient, templateId: string) {
  const { error } = await supabase.from("workout_templates").delete().eq("id", templateId);
  if (error) throw error;
}
