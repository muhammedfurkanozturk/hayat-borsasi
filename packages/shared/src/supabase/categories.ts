import type { SupabaseClient } from "@supabase/supabase-js";
import type { CategoryModuleType } from "../onboardingTemplates";
import { ICON_KEYS, type IconKey } from "../types";

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  module_type: CategoryModuleType;
  // "eksikler" envanteri madde 9 — okunur kategori URL'leri
  // (20260903110000_category_slug.sql). Migration henüz uygulanmamışsa
  // (kolon yok) `null` — link kurulumu bu durumda id'ye düşüyor (bkz.
  // CategoryTile.tsx/Sidebar.tsx), UUID linkler yine çalışmaya devam ediyor.
  slug: string | null;
}

const CATEGORY_COLUMNS = "id, name, icon, sort_order, module_type";
const CATEGORY_COLUMNS_WITH_SLUG = `${CATEGORY_COLUMNS}, slug`;

export function toIconKey(value: string): IconKey {
  return (ICON_KEYS as readonly string[]).includes(value) ? (value as IconKey) : "star";
}

// Türkçe karakterleri elle çevirip Latin harf/rakam/tire dışındakileri
// tireye indirgiyor — categories_user_slug_unique migration'ındaki SQL
// çevirisiyle AYNI kural (geriye dönük backfill'le tutarlı kalsın diye).
export function slugifyCategoryName(name: string): string {
  const map: Record<string, string> = {
    ç: "c",
    Ç: "c",
    ğ: "g",
    Ğ: "g",
    ı: "i",
    İ: "i",
    ö: "o",
    Ö: "o",
    ş: "s",
    Ş: "s",
    ü: "u",
    Ü: "u",
  };
  const base = name
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "kategori";
}

function normalizeCategory(row: Omit<DbCategory, "slug"> & { slug?: string | null }): DbCategory {
  return { ...row, slug: row.slug ?? null };
}

export async function fetchCategories(supabase: SupabaseClient): Promise<DbCategory[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select(CATEGORY_COLUMNS_WITH_SLUG)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(normalizeCategory);
  } catch {
    const { data, error } = await supabase
      .from("categories")
      .select(CATEGORY_COLUMNS)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(normalizeCategory);
  }
}

// Aynı kullanıcının mevcut slug'larıyla çakışmayan bir slug üretir — 23505
// (unique_violation) ile karşılaşılırsa çağıran taraf artan bir sonek
// deneyerek tekrar dener (bkz. insertCategory).
function nextSlugAttempt(base: string, attempt: number): string {
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
}

export async function insertCategory(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  icon: IconKey,
  sortOrder: number
): Promise<DbCategory> {
  const base = slugifyCategoryName(name);
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = nextSlugAttempt(base, attempt);
    const { data, error } = await supabase
      .from("categories")
      .insert({ user_id: userId, name, icon, sort_order: sortOrder, slug })
      .select(CATEGORY_COLUMNS_WITH_SLUG)
      .single();
    if (!error) return normalizeCategory(data);
    // 42703 = "kolon yok" (migration uygulanmamış) — slug'sız tekrar dene,
    // bu durumda bir daha denemeye gerek yok.
    if (error.code === "42703") break;
    // 23505 = unique_violation — aynı slug zaten var, bir sonraki soneği dene.
    if (error.code !== "23505") throw error;
  }
  const { data, error } = await supabase
    .from("categories")
    .insert({ user_id: userId, name, icon, sort_order: sortOrder })
    .select(CATEGORY_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeCategory(data);
}

// Onboarding'de seçilen şablonları tek istekte kategoriye çevirir.
export async function insertCategoriesFromTemplates(
  supabase: SupabaseClient,
  userId: string,
  templates: { name: string; icon: IconKey; moduleType: CategoryModuleType }[],
  startSortOrder: number
): Promise<DbCategory[]> {
  if (templates.length === 0) return [];

  // Şablon isimleri sabit/farklı olduğu için parti-içi çakışma normalde
  // olmaz, yine de savunmacı: aynı base slug'a düşenlere sırayla sonek.
  const seenInBatch = new Map<string, number>();
  const rowsWithSlug = templates.map((t, index) => {
    const base = slugifyCategoryName(t.name);
    const count = seenInBatch.get(base) ?? 0;
    seenInBatch.set(base, count + 1);
    return {
      user_id: userId,
      name: t.name,
      icon: t.icon,
      sort_order: startSortOrder + index,
      module_type: t.moduleType,
      slug: count === 0 ? base : `${base}-${count + 1}`,
    };
  });

  const { data, error } = await supabase.from("categories").insert(rowsWithSlug).select(CATEGORY_COLUMNS_WITH_SLUG);
  if (!error) return (data ?? []).map(normalizeCategory);
  // 42703 (kolon yok) veya 23505 (kullanıcının zaten aynı slug'lı eski bir
  // kategorisi var) — slug'sız tekrar dene, id ile çalışmaya devam eder.
  if (error.code !== "42703" && error.code !== "23505") throw error;

  const rows = templates.map((t, index) => ({
    user_id: userId,
    name: t.name,
    icon: t.icon,
    sort_order: startSortOrder + index,
    module_type: t.moduleType,
  }));
  const { data: fallbackData, error: fallbackError } = await supabase
    .from("categories")
    .insert(rows)
    .select(CATEGORY_COLUMNS);
  if (fallbackError) throw fallbackError;
  return (fallbackData ?? []).map(normalizeCategory);
}

export async function updateCategoryName(supabase: SupabaseClient, categoryId: string, name: string) {
  const base = slugifyCategoryName(name);
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = nextSlugAttempt(base, attempt);
    const { error } = await supabase.from("categories").update({ name, slug }).eq("id", categoryId);
    if (!error) return;
    if (error.code === "42703") break;
    if (error.code !== "23505") throw error;
  }
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
