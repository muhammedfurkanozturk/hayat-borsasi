import type { SupabaseClient } from "@supabase/supabase-js";

export type TravelVisitLevel = "country" | "province" | "district";

export interface DbTravelVisit {
  id: string;
  level: TravelVisitLevel;
  ref_code: string;
  visited_at: string | null;
  note: string | null;
  photo_url: string | null;
}

export interface DbTravelPlace {
  id: string;
  parent_level: TravelVisitLevel;
  parent_ref_code: string;
  name: string;
  icon_key: string;
  visited_at: string | null;
  note: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface DbTravelBucketProgress {
  id: string;
  theme_key: string;
  item_key: string;
  completed_at: string;
}

const VISIT_COLUMNS = "id, level, ref_code, visited_at, note, photo_url";
const PLACE_COLUMNS = "id, parent_level, parent_ref_code, name, icon_key, visited_at, note, photo_url, created_at";
const BUCKET_COLUMNS = "id, theme_key, item_key, completed_at";

export async function fetchTravelVisits(supabase: SupabaseClient, categoryId: string): Promise<DbTravelVisit[]> {
  const { data, error } = await supabase
    .from("travel_visits")
    .select(VISIT_COLUMNS)
    .eq("category_id", categoryId);
  if (error) throw error;
  return data ?? [];
}

// Bir ülke/il/ilçeyi ziyan edildi/edilmedi olarak değiştirir — zaten
// işaretliyse siler (toggle), değilse ekler. Scratch-map'in tek tıkla
// dolup boşalması bu davranışa dayanıyor.
export async function toggleTravelVisit(
  supabase: SupabaseClient,
  categoryId: string,
  level: TravelVisitLevel,
  refCode: string,
  existingId: string | null
): Promise<void> {
  if (existingId) {
    const { error } = await supabase.from("travel_visits").delete().eq("id", existingId);
    if (error) throw error;
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı");
  const { error } = await supabase.from("travel_visits").insert({
    user_id: user.id,
    category_id: categoryId,
    level,
    ref_code: refCode,
    visited_at: new Date().toISOString().slice(0, 10),
  });
  // Aynı anda iki hızlı dokunuş (örn. çift tıklama) aynı yeri iki kez eklemeye
  // çalışabilir — ikincisi unique constraint'e (kullanıcı+kategori+level+ref_code)
  // çarpar. İstenen son durum (ziyaret var) zaten ilk istekle sağlandığı için
  // bunu hataya değil no-op'a çeviriyoruz (bkz. CLAUDE.md 7.1, getOrCreateEntryForDate
  // ile aynı desen).
  if (error && error.code !== "23505") throw error;
}

export async function updateTravelVisitDetails(
  supabase: SupabaseClient,
  visitId: string,
  fields: { note?: string | null; photo_url?: string | null }
): Promise<void> {
  const { error } = await supabase.from("travel_visits").update(fields).eq("id", visitId);
  if (error) throw error;
}

export async function fetchTravelPlaces(supabase: SupabaseClient, categoryId: string): Promise<DbTravelPlace[]> {
  const { data, error } = await supabase
    .from("travel_places")
    .select(PLACE_COLUMNS)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertTravelPlace(
  supabase: SupabaseClient,
  categoryId: string,
  place: { parent_level: TravelVisitLevel; parent_ref_code: string; name: string; icon_key: string; note?: string | null }
): Promise<DbTravelPlace> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı");
  const { data, error } = await supabase
    .from("travel_places")
    .insert({
      user_id: user.id,
      category_id: categoryId,
      parent_level: place.parent_level,
      parent_ref_code: place.parent_ref_code,
      name: place.name,
      icon_key: place.icon_key,
      note: place.note ?? null,
      visited_at: new Date().toISOString().slice(0, 10),
    })
    .select(PLACE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateTravelPlace(
  supabase: SupabaseClient,
  placeId: string,
  fields: Partial<Pick<DbTravelPlace, "name" | "icon_key" | "note" | "photo_url">>
): Promise<void> {
  const { error } = await supabase.from("travel_places").update(fields).eq("id", placeId);
  if (error) throw error;
}

export async function deleteTravelPlace(supabase: SupabaseClient, placeId: string): Promise<void> {
  const { error } = await supabase.from("travel_places").delete().eq("id", placeId);
  if (error) throw error;
}

export async function fetchTravelBucketProgress(
  supabase: SupabaseClient,
  categoryId: string
): Promise<DbTravelBucketProgress[]> {
  const { data, error } = await supabase
    .from("travel_bucket_progress")
    .select(BUCKET_COLUMNS)
    .eq("category_id", categoryId);
  if (error) throw error;
  return data ?? [];
}

export async function toggleTravelBucketItem(
  supabase: SupabaseClient,
  categoryId: string,
  themeKey: string,
  itemKey: string,
  existingId: string | null
): Promise<void> {
  if (existingId) {
    const { error } = await supabase.from("travel_bucket_progress").delete().eq("id", existingId);
    if (error) throw error;
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Oturum bulunamadı");
  const { error } = await supabase.from("travel_bucket_progress").insert({
    user_id: user.id,
    category_id: categoryId,
    theme_key: themeKey,
    item_key: itemKey,
  });
  // bkz. toggleTravelVisit'teki aynı 23505 (unique constraint) notu.
  if (error && error.code !== "23505") throw error;
}
