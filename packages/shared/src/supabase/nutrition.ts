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
  meal_id: string | null;
  photo_path: string | null;
  portion_text: string | null;
  saved_food_id: string | null;
  // 2026-08-28: `quantity` migration'ı (20260828120000) henüz herkeste
  // uygulanmamış olabilir — bu yüzden ana MEAL_LOG_COLUMNS'a EKLENMEDİ
  // (eklenseydi migration uygulanmadan tüm Öğün Kaydı yüklemesi kırılırdı).
  // Sadece insertMealLogFromSavedFood'un miktar-birleştirme yolunda,
  // try/catch korumalı olarak dolduruluyor — migration uygulanmamışsa
  // undefined kalır, UI rozet göstermez (eski, ayrı-kart davranışına düşer).
  quantity?: number;
}

// 2026-08-26: "Kaydedilen Yemekler" artık kalıcı bir kütüphane (saved_foods)
// — bir öğüne sürüklemek meal_logs'a YENİ bir kopya ekler, kütüphanedeki
// orijinali hiç değiştirmez/silmez. Bkz. migration 20260826110000.
export interface DbSavedFood {
  id: string;
  description: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  ai_summary: string | null;
  photo_path: string | null;
  portion_text: string | null;
}

const MEAL_LOG_COLUMNS =
  "id, date, description, calories, protein_g, carbs_g, fat_g, ai_summary, meal_id, photo_path, portion_text, saved_food_id";
// `quantity` sütunu 20260828120000 migration'ına ait, herkeste uygulanmış
// olmayabilir — önce bununla dener, sütun yoksa (migration henüz
// çalıştırılmadıysa) eski listeye düşer. Bu sayede migration uygulanınca
// miktar rozeti sayfa yenilense de kalıcı görünür, uygulanmadıysa ana Öğün
// Kaydı yüklemesi hiç kırılmaz.
const MEAL_LOG_COLUMNS_WITH_QUANTITY = `${MEAL_LOG_COLUMNS}, quantity`;
const SAVED_FOOD_COLUMNS =
  "id, description, calories, protein_g, carbs_g, fat_g, ai_summary, photo_path, portion_text";

export async function fetchMealLogs(supabase: SupabaseClient, categoryId: string, sinceDate: string): Promise<DbMealLog[]> {
  try {
    const { data, error } = await supabase
      .from("meal_logs")
      .select(MEAL_LOG_COLUMNS_WITH_QUANTITY)
      .eq("category_id", categoryId)
      .gte("date", sinceDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    const { data, error } = await supabase
      .from("meal_logs")
      .select(MEAL_LOG_COLUMNS)
      .eq("category_id", categoryId)
      .gte("date", sinceDate)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
}

export async function fetchMealLogsForDate(supabase: SupabaseClient, categoryId: string, date: string): Promise<DbMealLog[]> {
  try {
    const { data, error } = await supabase
      .from("meal_logs")
      .select(MEAL_LOG_COLUMNS_WITH_QUANTITY)
      .eq("category_id", categoryId)
      .eq("date", date)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return fetchMealLogsForDateLegacy(supabase, categoryId, date);
  }
}

async function fetchMealLogsForDateLegacy(supabase: SupabaseClient, categoryId: string, date: string): Promise<DbMealLog[]> {
  const { data, error } = await supabase
    .from("meal_logs")
    .select(MEAL_LOG_COLUMNS)
    .eq("category_id", categoryId)
    .eq("date", date)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface FoodInput {
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  aiSummary: string | null;
  photoPath: string | null;
  portionText: string | null;
}

export async function updateMealLogMeal(supabase: SupabaseClient, mealLogId: string, mealId: string) {
  const { error } = await supabase.from("meal_logs").update({ meal_id: mealId }).eq("id", mealLogId);
  if (error) throw error;
}

export async function deleteMealLog(supabase: SupabaseClient, mealLogId: string) {
  const { error } = await supabase.from("meal_logs").delete().eq("id", mealLogId);
  if (error) throw error;
}

export interface NutritionValuesPatch {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

// Kullanıcı, AI/veritabanı tahminini elle düzeltebilsin diye (2026-08-28,
// örn. "260 kcal görünüyor ama gerçeği 265") — sadece o kullanıcının kendi
// kaydını günceller, genel saved_foods/USDA/OFF verisini etkilemez.
export async function updateMealLog(
  supabase: SupabaseClient,
  mealLogId: string,
  patch: NutritionValuesPatch
): Promise<DbMealLog> {
  const { data, error } = await supabase
    .from("meal_logs")
    .update({ calories: patch.calories, protein_g: patch.proteinG, carbs_g: patch.carbsG, fat_g: patch.fatG })
    .eq("id", mealLogId)
    .select(MEAL_LOG_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSavedFood(
  supabase: SupabaseClient,
  savedFoodId: string,
  patch: NutritionValuesPatch
): Promise<DbSavedFood> {
  const { data, error } = await supabase
    .from("saved_foods")
    .update({ calories: patch.calories, protein_g: patch.proteinG, carbs_g: patch.carbsG, fat_g: patch.fatG })
    .eq("id", savedFoodId)
    .select(SAVED_FOOD_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Kaydedilen Yemekler (saved_foods) — kalıcı kütüphane. Fotoğraf analizi/
// elle ekleme/barkod hepsi BURAYA düşer (eski davranışta "atanmamış
// meal_logs" olarak düşüyordu). Bir öğüne sürüklemek insertMealLogFromSaved
// ile meal_logs'a bağımsız bir KOPYA ekler, buradaki kayıt hiç değişmez.
// ---------------------------------------------------------------------------

export async function fetchSavedFoods(supabase: SupabaseClient, categoryId: string): Promise<DbSavedFood[]> {
  const { data, error } = await supabase
    .from("saved_foods")
    .select(SAVED_FOOD_COLUMNS)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertSavedFood(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  input: FoodInput
): Promise<DbSavedFood> {
  const { data, error } = await supabase
    .from("saved_foods")
    .insert({
      user_id: userId,
      category_id: categoryId,
      description: input.description,
      calories: input.calories,
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
      ai_summary: input.aiSummary,
      photo_path: input.photoPath,
      portion_text: input.portionText,
    })
    .select(SAVED_FOOD_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavedFood(supabase: SupabaseClient, savedFoodId: string) {
  const { error } = await supabase.from("saved_foods").delete().eq("id", savedFoodId);
  if (error) throw error;
}

// Kütüphaneden bir öğüne sürükleme — saved_foods'taki değerlerin bağımsız
// bir KOPYASINI meal_logs'a ekliyor, kaynak saved_foods satırı hiç
// değişmiyor (bu yüzden aynı yemek başka bir öğüne/güne tekrar tekrar
// sürüklenebiliyor).
//
// 2026-08-28 (kullanıcı bulgusu — aynı yemek iki kez sürüklenince yan yana
// iki kart oluşuyordu): önce o gün o öğünde aynı saved_food_id'den zaten bir
// kopya var mı diye bakılıyor, varsa yeni satır eklemek yerine `quantity`
// artırılıyor. Bu kontrol/artırma `quantity` migration'ı uygulanmamışsa
// (sütun yoksa) sessizce başarısız olup eski davranışa (ayrı yeni satır)
// düşüyor — ana sürükle-bırak akışını KİLİTLEMİYOR.
export async function insertMealLogFromSavedFood(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  savedFood: DbSavedFood,
  mealId: string,
  date: string
): Promise<DbMealLog> {
  try {
    const { data: existing, error: existingError } = await supabase
      .from("meal_logs")
      .select("id, quantity")
      .eq("saved_food_id", savedFood.id)
      .eq("meal_id", mealId)
      .eq("date", date)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("meal_logs")
        .update({ quantity: (existing.quantity ?? 1) + 1 })
        .eq("id", existing.id)
        .select(`${MEAL_LOG_COLUMNS}, quantity`)
        .single();
      if (updateError) throw updateError;
      return updated;
    }
  } catch {
    // quantity sütunu/migration'ı henüz yok — aşağıdaki eski davranışa
    // (her zaman yeni satır) düş.
  }

  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      user_id: userId,
      category_id: categoryId,
      saved_food_id: savedFood.id,
      meal_id: mealId,
      date,
      description: savedFood.description,
      calories: savedFood.calories,
      protein_g: savedFood.protein_g,
      carbs_g: savedFood.carbs_g,
      fat_g: savedFood.fat_g,
      ai_summary: savedFood.ai_summary,
      photo_path: savedFood.photo_path,
      portion_text: savedFood.portion_text,
    })
    .select(MEAL_LOG_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}
