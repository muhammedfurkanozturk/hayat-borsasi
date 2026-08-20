import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryModuleType } from "../onboardingTemplates";
import { ICON_KEYS, type IconKey } from "../types";

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  module_type: CategoryModuleType;
}

export function toIconKey(value: string): IconKey {
  return (ICON_KEYS as readonly string[]).includes(value) ? (value as IconKey) : "star";
}

export async function fetchCategories(supabase: SupabaseClient): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, sort_order, module_type")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertCategory(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  icon: IconKey,
  sortOrder: number
): Promise<DbCategory> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name, icon, sort_order: sortOrder })
    .select("id, name, icon, sort_order, module_type")
    .single();
  if (error) throw error;
  return data;
}

// Onboarding'de seçilen şablonları tek istekte kategoriye çevirir.
export async function insertCategoriesFromTemplates(
  supabase: SupabaseClient,
  userId: string,
  templates: { name: string; icon: IconKey; moduleType: CategoryModuleType }[],
  startSortOrder: number
): Promise<DbCategory[]> {
  if (templates.length === 0) return [];
  const rows = templates.map((t, index) => ({
    user_id: userId,
    name: t.name,
    icon: t.icon,
    sort_order: startSortOrder + index,
    module_type: t.moduleType,
  }));
  const { data, error } = await supabase
    .from("categories")
    .insert(rows)
    .select("id, name, icon, sort_order, module_type");
  if (error) throw error;
  return data ?? [];
}

export async function updateCategoryName(supabase: SupabaseClient, categoryId: string, name: string) {
  const { error } = await supabase.from("categories").update({ name }).eq("id", categoryId);
  if (error) throw error;
}

export async function updateCategoryIcon(supabase: SupabaseClient, categoryId: string, icon: IconKey) {
  const { error } = await supabase.from("categories").update({ icon }).eq("id", categoryId);
  if (error) throw error;
}

export async function deleteCategoryById(supabase: SupabaseClient, categoryId: string) {
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) throw error;
}

// Kategorileri silmek, tasks/daily_task_logs'a olan cascade ilişkisi
// sayesinde o kategoriye bağlı tüm görevleri ve günlük işaretlemeleri de
// otomatik temizler.
export async function deleteAllCategoriesForUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from("categories").delete().eq("user_id", userId);
  if (error) throw error;
}
