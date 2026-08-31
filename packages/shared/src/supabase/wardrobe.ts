import type { SupabaseClient } from "@supabase/supabase-js";

export const CLOTHING_CATEGORIES = ["ust", "alt", "elbise", "ayakkabi", "dis_giyim", "aksesuar"] as const;
export type ClothingCategory = (typeof CLOTHING_CATEGORIES)[number];
export const CLOTHING_CATEGORY_LABELS: Record<ClothingCategory, string> = {
  ust: "Üst",
  alt: "Alt",
  elbise: "Elbise",
  ayakkabi: "Ayakkabı",
  dis_giyim: "Dış Giyim",
  aksesuar: "Aksesuar",
};

export const CLOTHING_SEASONS = ["yaz", "kis", "ara_mevsim", "tum_mevsim"] as const;
export type ClothingSeason = (typeof CLOTHING_SEASONS)[number];
export const CLOTHING_SEASON_LABELS: Record<ClothingSeason, string> = {
  yaz: "Yaz",
  kis: "Kış",
  ara_mevsim: "Ara Mevsim",
  tum_mevsim: "Tüm Mevsim",
};

export const CLOTHING_FORMALITIES = ["gunluk", "spor", "is", "ozel"] as const;
export type ClothingFormality = (typeof CLOTHING_FORMALITIES)[number];
export const CLOTHING_FORMALITY_LABELS: Record<ClothingFormality, string> = {
  gunluk: "Günlük",
  spor: "Spor",
  is: "İş",
  ozel: "Özel",
};

export interface DbClothingItem {
  id: string;
  photo_path: string;
  photo_mime: string;
  ai_label: string;
  category: ClothingCategory | null;
  color: string | null;
  season: ClothingSeason | null;
  formality: ClothingFormality | null;
  price_try: number | null;
  created_at: string;
}

const CLOTHING_ITEM_COLUMNS = "id, photo_path, photo_mime, ai_label, category, color, season, formality, price_try, created_at";

export async function fetchClothingItems(supabase: SupabaseClient, categoryId: string): Promise<DbClothingItem[]> {
  const { data, error } = await supabase
    .from("clothing_items")
    .select(CLOTHING_ITEM_COLUMNS)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertClothingItem(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  input: {
    photoPath: string;
    photoMime: string;
    aiLabel: string;
    category?: ClothingCategory | null;
    color?: string | null;
    season?: ClothingSeason | null;
    formality?: ClothingFormality | null;
  }
): Promise<DbClothingItem> {
  const { data, error } = await supabase
    .from("clothing_items")
    .insert({
      user_id: userId,
      category_id: categoryId,
      photo_path: input.photoPath,
      photo_mime: input.photoMime,
      ai_label: input.aiLabel,
      category: input.category ?? null,
      color: input.color ?? null,
      season: input.season ?? null,
      formality: input.formality ?? null,
    })
    .select(CLOTHING_ITEM_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export interface ClothingItemUpdate {
  aiLabel?: string;
  category?: ClothingCategory | null;
  color?: string | null;
  season?: ClothingSeason | null;
  formality?: ClothingFormality | null;
  priceTry?: number | null;
}

// SELION.AI'deki (piyasa araştırması) "Review and correct any detail" fikri
// — AI'ın önerdiği etiketler kullanıcı tarafından her zaman düzeltilebilir.
export async function updateClothingItem(supabase: SupabaseClient, itemId: string, updates: ClothingItemUpdate): Promise<DbClothingItem> {
  const payload: Record<string, unknown> = {};
  if (updates.aiLabel !== undefined) payload.ai_label = updates.aiLabel;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.season !== undefined) payload.season = updates.season;
  if (updates.formality !== undefined) payload.formality = updates.formality;
  if (updates.priceTry !== undefined) payload.price_try = updates.priceTry;

  const { data, error } = await supabase.from("clothing_items").update(payload).eq("id", itemId).select(CLOTHING_ITEM_COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function deleteClothingItem(supabase: SupabaseClient, itemId: string) {
  const { error } = await supabase.from("clothing_items").delete().eq("id", itemId);
  if (error) throw error;
}

export interface DbOutfit {
  id: string;
  name: string;
  ai_score: number | null;
  ai_comment: string | null;
  created_at: string;
  item_ids: string[];
}

// outfits + outfit_items'ı tek sorguda, PostgREST embed ile birlikte çeker.
export async function fetchOutfits(supabase: SupabaseClient, categoryId: string): Promise<DbOutfit[]> {
  const { data, error } = await supabase
    .from("outfits")
    .select("id, name, ai_score, ai_comment, created_at, outfit_items(clothing_item_id)")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    ai_score: row.ai_score as number | null,
    ai_comment: row.ai_comment as string | null,
    created_at: row.created_at as string,
    item_ids: (row.outfit_items as unknown as { clothing_item_id: string }[]).map((i) => i.clothing_item_id),
  }));
}

export async function insertOutfit(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  input: { name: string; aiScore: number; aiComment: string; itemIds: string[] }
): Promise<DbOutfit> {
  const { data: outfit, error } = await supabase
    .from("outfits")
    .insert({ user_id: userId, category_id: categoryId, name: input.name, ai_score: input.aiScore, ai_comment: input.aiComment })
    .select("id, name, ai_score, ai_comment, created_at")
    .single();
  if (error) throw error;

  const links = input.itemIds.map((clothingItemId) => ({
    outfit_id: outfit.id,
    clothing_item_id: clothingItemId,
    user_id: userId,
  }));
  const { error: linkError } = await supabase.from("outfit_items").insert(links);
  if (linkError) throw linkError;

  return { ...outfit, item_ids: input.itemIds };
}

export async function deleteOutfit(supabase: SupabaseClient, outfitId: string) {
  const { error } = await supabase.from("outfits").delete().eq("id", outfitId);
  if (error) throw error;
}

export interface DbOutfitWear {
  id: string;
  outfit_id: string;
  date: string;
}

// Indyx'teki (piyasa araştırması) giyilme takvimi/cost-per-wear fikri —
// bir kombinin her "giyildi" işaretlemesi ayrı bir satır, aynı gün birden
// fazla kez işaretlenebilir (basit tutuldu, tekilleştirme yok).
export async function fetchOutfitWears(supabase: SupabaseClient, outfitIds: string[]): Promise<DbOutfitWear[]> {
  if (outfitIds.length === 0) return [];
  const { data, error } = await supabase
    .from("outfit_wears")
    .select("id, outfit_id, date")
    .in("outfit_id", outfitIds)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertOutfitWear(supabase: SupabaseClient, userId: string, outfitId: string, date: string): Promise<DbOutfitWear> {
  const { data, error } = await supabase
    .from("outfit_wears")
    .insert({ user_id: userId, outfit_id: outfitId, date })
    .select("id, outfit_id, date")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOutfitWear(supabase: SupabaseClient, wearId: string) {
  const { error } = await supabase.from("outfit_wears").delete().eq("id", wearId);
  if (error) throw error;
}
