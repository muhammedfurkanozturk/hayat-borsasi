"use client";

import { useEffect, useState } from "react";
import {
  deleteMealLog,
  deleteMeal,
  deleteMealPreset,
  deleteSavedFood,
  deleteSavedRecipe,
  deleteWaterLog,
  fetchActiveFastingSession,
  fetchMealLogs,
  fetchMealLogsForDate,
  fetchMealPresetItems,
  fetchMealPresets,
  fetchMeals,
  fetchNutritionProfile,
  fetchSavedFoods,
  fetchSavedRecipes,
  fetchWaterLogs,
  insertDefaultMeals,
  insertMeal,
  insertMealLogFromSavedFood,
  insertMealPreset,
  insertSavedFood,
  insertWaterLog,
  startFasting,
  stopFasting,
  todayIso,
  updateMealLog,
  updateMealLogMeal,
  updateMealName,
  updateSavedFood,
  upsertNutritionProfile,
  type DbFastingSession,
  type DbMeal,
  type DbMealLog,
  type DbMealPreset,
  type DbMealPresetItem,
  type DbNutritionProfile,
  type DbSavedFood,
  type DbSavedRecipe,
  type DbWaterLog,
  type NutritionValuesPatch,
} from "@hayat-borsasi/shared";
import { PlusIcon } from "@/components/icons";
import { CategoryChecklist } from "@/components/kategori/CategoryChecklist";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/lib/supabase/app-data-context";
import { BarcodeScanButton } from "./meal-planner/BarcodeScanButton";
import { FastingTimer } from "./meal-planner/FastingTimer";
import { FoodSearchInput } from "./meal-planner/FoodSearchInput";
import { MealPlannerBoard } from "./meal-planner/MealPlannerBoard";
import { MealDetailModal } from "./meal-planner/MealDetailModal";
import { MealPresetsPanel } from "./meal-planner/MealPresetsPanel";
import { NutritionTabBar, type NutritionTab } from "./meal-planner/NutritionTabBar";
import { CalorieTrackingPanel } from "./meal-planner/CalorieTrackingPanel";
import type { CalorieGoalFormValues } from "./meal-planner/CalorieGoalSetup";
import { NutritionRing } from "./meal-planner/NutritionRing";
import { NutritionStreakBadge } from "./meal-planner/NutritionStreakBadge";
import { PendingFoodEditor, type EditableFoodValues } from "./meal-planner/PendingFoodEditor";
import { RecipeSuggestion } from "./meal-planner/RecipeSuggestion";
import { SavedRecipesList } from "./meal-planner/SavedRecipesList";
import { WaterTracker } from "./meal-planner/WaterTracker";

const TREND_WINDOW_DAYS = 35;

const BUCKET = "meal-photos";
const SIGNED_URL_TTL_SECONDS = 3600;

function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, data] = result.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      resolve({ data, mediaType });
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

interface PendingAnalysis {
  file: File | null;
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  portion: string | null;
  summary: string;
}


export function MealLogPanel({
  categoryId,
  tasks,
  onDeleteTask,
}: {
  categoryId: string;
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
}) {
  const [tab, setTab] = useState<NutritionTab>("checklist");
  const [meals, setMeals] = useState<DbMeal[]>([]);
  // 2026-08-26: "Kaydedilen Yemekler" artık ayrı, kalıcı bir kütüphane
  // (savedFoods) — foods artık SADECE bugün bir öğüne sürüklenmiş KOPYALARI
  // tutuyor (hepsi meal_id'li). Bkz. packages/shared/src/supabase/nutrition.ts.
  const [savedFoods, setSavedFoods] = useState<DbSavedFood[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<DbSavedRecipe[]>([]);
  const [foods, setFoods] = useState<DbMealLog[]>([]);
  const [history, setHistory] = useState<DbMealLog[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<DbMealLog | DbSavedFood | null>(null);

  const [waterLogs, setWaterLogs] = useState<DbWaterLog[]>([]);
  const [waterHistory, setWaterHistory] = useState<DbWaterLog[]>([]);
  const [addingWater, setAddingWater] = useState(false);
  const [nutritionProfile, setNutritionProfile] = useState<DbNutritionProfile | null>(null);
  const [waterGoalError, setWaterGoalError] = useState<string | null>(null);
  const [savingCalorieGoal, setSavingCalorieGoal] = useState(false);
  const [calorieGoalError, setCalorieGoalError] = useState<string | null>(null);
  const [fastingSession, setFastingSession] = useState<DbFastingSession | null>(null);
  const [startingFast, setStartingFast] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const [confirmSaving, setConfirmSaving] = useState(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);

  const [newMealOpen, setNewMealOpen] = useState(false);
  const [newMealName, setNewMealName] = useState("");

  const [mealPresets, setMealPresets] = useState<DbMealPreset[]>([]);
  const [mealPresetItems, setMealPresetItems] = useState<DbMealPresetItem[]>([]);

  async function loadPhotoUrls(supabase: ReturnType<typeof createClient>, rows: { id: string; photo_path: string | null }[]) {
    const withPhoto = rows.filter((r) => r.photo_path);
    if (withPhoto.length === 0) return;
    const entries = await Promise.all(
      withPhoto.map(async (r) => {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(r.photo_path!, SIGNED_URL_TTL_SECONDS);
        return [r.id, data?.signedUrl ?? ""] as const;
      })
    );
    setPhotoUrls((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let mealRows = await fetchMeals(supabase, categoryId);
    if (mealRows.length === 0 && user) {
      mealRows = await insertDefaultMeals(supabase, user.id, categoryId);
    }
    setMeals(mealRows);

    const savedFoodRows = await fetchSavedFoods(supabase, categoryId);
    setSavedFoods(savedFoodRows);
    await loadPhotoUrls(supabase, savedFoodRows);

    try {
      setSavedRecipes(await fetchSavedRecipes(supabase, categoryId));
    } catch (err) {
      // saved_recipes migration henüz uygulanmamış olabilir — ana Öğün
      // Kaydı akışını kilitlemesin.
      console.error("Tarifler yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    try {
      setMealPresets(await fetchMealPresets(supabase, categoryId));
      setMealPresetItems(await fetchMealPresetItems(supabase));
    } catch (err) {
      // meal_presets/meal_preset_items migration'ı (20260828120000) henüz
      // uygulanmamış olabilir — ana Öğün Kaydı akışını kilitlemesin.
      console.error("Sık yapılan öğünler yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    const foodRows = await fetchMealLogsForDate(supabase, categoryId, todayIso());
    setFoods(foodRows);
    await loadPhotoUrls(supabase, foodRows);

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - TREND_WINDOW_DAYS);
    const historyRows = await fetchMealLogs(supabase, categoryId, sinceDate.toISOString().slice(0, 10));
    setHistory(historyRows);

    // Su takibi/oruç, ilgili migration henüz uygulanmadıysa (water_logs/
    // fasting_sessions tabloları yoksa) hata fırlatabilir — bu, öğün/öğün
    // planlayıcı gibi ana özelliği kilitlemesin diye ayrı try/catch'te.
    try {
      const waterSinceDate = new Date();
      waterSinceDate.setDate(waterSinceDate.getDate() - TREND_WINDOW_DAYS);
      const waterRows = await fetchWaterLogs(supabase, categoryId, waterSinceDate.toISOString().slice(0, 10));
      setWaterHistory(waterRows);
      setWaterLogs(waterRows.filter((w) => w.date === todayIso()));
    } catch (err) {
      console.error("Su takibi yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    try {
      const activeFast = await fetchActiveFastingSession(supabase, categoryId);
      setFastingSession(activeFast);
    } catch (err) {
      console.error("Oruç durumu yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    // nutrition_profiles, ilgili migration henüz uygulanmadıysa hata
    // fırlatabilir — su/kalori sekmeleri bu durumda ilk-kullanım (hedef
    // sorma) haline sessizce düşer.
    try {
      setNutritionProfile(await fetchNutritionProfile(supabase, categoryId));
    } catch (err) {
      console.error("Beslenme profili yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      const { data, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/meal-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: data, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analiz başarısız oldu.");
      setPending({
        file,
        description: json.description ?? "",
        calories: json.calories ?? null,
        proteinG: json.proteinG ?? null,
        carbsG: json.carbsG ?? null,
        fatG: json.fatG ?? null,
        portion: json.portion ?? null,
        summary: json.summary ?? "",
      });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analiz başarısız oldu.");
    }
    setAnalyzing(false);
  }

  // 2026-08-26: analiz/elle ekleme/barkod artık kalıcı kütüphaneye
  // (saved_foods) düşüyor — eskiden "atanmamış meal_logs" olarak düşüyordu.
  // 2026-08-27: artık ham AI/arama sonucu değil, kullanıcının
  // PendingFoodEditor'de düzenlediği NİHAİ değerler kaydediliyor (kullanıcı
  // bulgusu — AI'ın tahmini, ör. yumurta adedi, yanlış olabilir).
  async function handleConfirmYes(edited: EditableFoodValues) {
    if (!pending) return;
    setConfirmSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      let photoPath: string | null = null;
      if (pending.file) {
        const path = `${user.id}/${crypto.randomUUID()}-${pending.file.name}`;
        const upload = await supabase.storage.from(BUCKET).upload(path, pending.file);
        if (!upload.error) photoPath = path;
      }
      const created = await insertSavedFood(supabase, user.id, categoryId, {
        description: edited.description,
        calories: edited.calories,
        proteinG: edited.proteinG,
        carbsG: edited.carbsG,
        fatG: edited.fatG,
        aiSummary: pending.summary || null,
        photoPath,
        portionText: edited.portion,
      });
      setSavedFoods((prev) => [created, ...prev]);
      await loadPhotoUrls(supabase, [created]);
    }
    setPending(null);
    setConfirmSaving(false);
  }

  function handleConfirmNo() {
    setPending(null);
  }

  // Aranabilir veritabanında (USDA/Open Food Facts) bulunamayan bir şey
  // yazılırsa (ör. ev yemeği) — eski davranış, sadece ad, besin değeri yok.
  async function handleManualAdd(description: string) {
    setManualSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertSavedFood(supabase, user.id, categoryId, {
        description,
        calories: null,
        proteinG: null,
        carbsG: null,
        fatG: null,
        aiSummary: null,
        photoPath: null,
        portionText: null,
      });
      setSavedFoods((prev) => [created, ...prev]);
    }
    setManualSaving(false);
  }

  // 2026-08-27: Elle Ekle artık USDA/Open Food Facts'te arama yapıyor
  // (FoodSearchInput.tsx) — bir sonuç seçilince, fotoğraf analizi/barkodla
  // aynı "onayla" akışına (pending) düşüyor, kullanıcı kaydetmeden önce
  // görebiliyor.
  function handleSelectSearchResult(result: {
    description: string;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    portion: string | null;
  }) {
    setPending({
      file: null,
      description: result.description,
      calories: result.calories,
      proteinG: result.proteinG,
      carbsG: result.carbsG,
      fatG: result.fatG,
      portion: result.portion,
      summary: "",
    });
  }

  // Kütüphaneden bir öğüne sürükleme — meal_logs'a bağımsız bir KOPYA
  // ekliyor, savedFoods hiç değişmiyor (aynı yemek başka bir öğüne/güne
  // tekrar tekrar sürüklenebilsin diye).
  async function handleAssignFromLibrary(savedFoodId: string, mealId: string) {
    const savedFood = savedFoods.find((f) => f.id === savedFoodId);
    if (!savedFood) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const created = await insertMealLogFromSavedFood(supabase, user.id, categoryId, savedFood, mealId, todayIso());
    // insertMealLogFromSavedFood aynı yemek o öğünde/günde zaten varsa YENİ
    // satır yerine var olan satırın quantity'sini artırıp onu döndürebiliyor
    // — bu durumda state'e prepend değil, var olan satırı güncelleme yapılmalı.
    const upsertLog = (prev: DbMealLog[]) =>
      prev.some((f) => f.id === created.id) ? prev.map((f) => (f.id === created.id ? created : f)) : [created, ...prev];
    setFoods(upsertLog);
    setHistory(upsertLog);
    if (savedFood.photo_path && photoUrls[savedFoodId]) {
      setPhotoUrls((prev) => ({ ...prev, [created.id]: prev[savedFoodId] }));
    }
  }

  // İki gerçek öğün arasında taşıma (kütüphaneyle ilgisi yok) — bu hâlâ
  // gerçek bir taşıma, o günkü kaydın hangi öğüne ait olduğunu düzeltiyor.
  async function handleMoveLogEntry(mealLogId: string, mealId: string) {
    setFoods((prev) => prev.map((f) => (f.id === mealLogId ? { ...f, meal_id: mealId } : f)));
    const supabase = createClient();
    await updateMealLogMeal(supabase, mealLogId, mealId);
  }

  // Bir öğünden "havuza" (kütüphane alanına) geri sürüklemek — kütüphanedeki
  // orijinal zaten duruyor, burada yapılacak tek şey o günkü KOPYAYI silmek.
  async function handleRemoveFromMeal(mealLogId: string) {
    setFoods((prev) => prev.filter((f) => f.id !== mealLogId));
    const supabase = createClient();
    await deleteMealLog(supabase, mealLogId);
  }


  // Bir öğündeki günlük KOPYAYI siler — kütüphanedeki orijinal (saved_foods)
  // etkilenmez. photo_path saved_foods ile paylaşıldığı için (aynı Storage
  // dosyasına işaret ediyor) burada storage.remove ÇAĞRILMIYOR — silinirse
  // kütüphanedeki/diğer günlerdeki kopyaların fotoğrafı da kırılırdı.
  async function handleDeleteMealLog(food: DbMealLog) {
    const supabase = createClient();
    await deleteMealLog(supabase, food.id);
    setFoods((prev) => prev.filter((f) => f.id !== food.id));
    setHistory((prev) => prev.filter((f) => f.id !== food.id));
    setSelectedFood((prev) => (prev && "date" in prev && prev.id === food.id ? null : prev));
  }

  // Kütüphaneden kalıcı olarak siler — o ana kadar farklı günlere/öğünlere
  // sürüklenmiş KOPYALAR (meal_logs) kendi besin değerlerini zaten
  // taşıdıkları için etkilenmeden kalır, sadece saved_food_id null olur.
  async function handleDeleteSavedFood(food: DbSavedFood) {
    const supabase = createClient();
    await deleteSavedFood(supabase, food.id);
    setSavedFoods((prev) => prev.filter((f) => f.id !== food.id));
    setSelectedFood((prev) => (prev && !("date" in prev) && prev.id === food.id ? null : prev));
  }

  // Kaydedilen bir yemeğin/öğün kopyasının besin değerlerini elle düzeltme
  // (2026-08-28, kullanıcı bulgusu — AI/veritabanı tahmini bazen az sapıyor).
  // Sadece bu satırı günceller; kütüphaneden/veritabanından türeyen diğer
  // kopyalar veya genel USDA/OFF verisi etkilenmez.
  async function handleUpdateFood(food: DbMealLog | DbSavedFood, patch: NutritionValuesPatch) {
    const supabase = createClient();
    if ("date" in food) {
      const updated = await updateMealLog(supabase, food.id, patch);
      setFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setHistory((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setSelectedFood(updated);
    } else {
      const updated = await updateSavedFood(supabase, food.id, patch);
      setSavedFoods((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setSelectedFood(updated);
    }
  }

  async function handleDeleteRecipe(recipe: DbSavedRecipe) {
    const supabase = createClient();
    await deleteSavedRecipe(supabase, recipe.id);
    setSavedRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
  }

  async function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!newMealName.trim()) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertMeal(supabase, user.id, categoryId, newMealName.trim(), meals.length);
      setMeals((prev) => [...prev, created]);
    }
    setNewMealName("");
    setNewMealOpen(false);
  }

  async function handleRenameMeal(mealId: string, name: string) {
    setMeals((prev) => prev.map((m) => (m.id === mealId ? { ...m, name } : m)));
    const supabase = createClient();
    await updateMealName(supabase, mealId, name);
  }

  async function handleDeleteMeal(mealId: string) {
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
    setFoods((prev) => prev.map((f) => (f.meal_id === mealId ? { ...f, meal_id: null } : f)));
    const supabase = createClient();
    await deleteMeal(supabase, mealId);
  }

  // Bir öğünün o anki içeriğini (kütüphaneden gelen, saved_food_id'si olan
  // parçalar) isimli bir "Sık Yapılan Öğün" şablonu olarak kaydeder.
  async function handleSaveMealAsPreset(mealId: string, name: string) {
    const savedFoodIds = Array.from(
      new Set(foods.filter((f) => f.meal_id === mealId && f.saved_food_id).map((f) => f.saved_food_id as string))
    );
    if (savedFoodIds.length === 0) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const { preset, items } = await insertMealPreset(supabase, user.id, categoryId, name, savedFoodIds);
      setMealPresets((prev) => [preset, ...prev]);
      setMealPresetItems((prev) => [...prev, ...items]);
    } catch (err) {
      console.error("Sık yapılan öğün kaydedilemedi (migration uygulanmamış olabilir):", err);
    }
  }

  // Bir şablonu bugün seçilen öğüne uygular — her parça, kütüphanede hâlâ
  // varsa (silinmemişse) handleAssignFromLibrary ile aynı yola (insertMealLog
  // FromSavedFood, miktar-birleştirmeli) tek tek eklenir.
  async function handleApplyPreset(presetId: string, mealId: string) {
    const savedFoodIds = mealPresetItems.filter((i) => i.preset_id === presetId).map((i) => i.saved_food_id);
    for (const savedFoodId of savedFoodIds) {
      await handleAssignFromLibrary(savedFoodId, mealId);
    }
  }

  async function handleDeletePreset(presetId: string) {
    setMealPresets((prev) => prev.filter((p) => p.id !== presetId));
    setMealPresetItems((prev) => prev.filter((i) => i.preset_id !== presetId));
    const supabase = createClient();
    await deleteMealPreset(supabase, presetId);
  }

  async function handleAddWater(amountMl: number) {
    setAddingWater(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertWaterLog(supabase, user.id, categoryId, todayIso(), amountMl);
      setWaterLogs((prev) => [...prev, created]);
      setWaterHistory((prev) => [...prev, created]);
    }
    setAddingWater(false);
  }

  async function handleRemoveLastWater() {
    const last = waterLogs[waterLogs.length - 1];
    if (!last) return;
    setWaterLogs((prev) => prev.slice(0, -1));
    setWaterHistory((prev) => {
      const idx = prev.findIndex((w) => w.id === last.id);
      if (idx === -1) return prev;
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
    });
    const supabase = createClient();
    await deleteWaterLog(supabase, last.id);
  }

  async function handleSaveCalorieGoal(values: CalorieGoalFormValues): Promise<boolean> {
    setSavingCalorieGoal(true);
    setCalorieGoalError(null);
    let success = false;
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const updated = await upsertNutritionProfile(supabase, user.id, categoryId, {
        weight_kg: values.weightKg,
        height_cm: values.heightCm,
        age: values.age,
        sex: values.sex,
        goal: values.goal,
        activity_level: values.activityLevel,
      });
      setNutritionProfile(updated);
      success = true;
    } catch (err) {
      // nutrition_profiles migration henüz uygulanmamış olabilir.
      console.error("Kalori hedefi kaydedilemedi (migration uygulanmamış olabilir):", err);
      setCalorieGoalError("Hedef kaydedilemedi.");
    }
    setSavingCalorieGoal(false);
    return success;
  }

  async function handleSetWaterGoal(goalMl: number) {
    setWaterGoalError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const updated = await upsertNutritionProfile(supabase, user.id, categoryId, { water_goal_ml: goalMl });
      setNutritionProfile(updated);
    } catch (err) {
      // nutrition_profiles migration henüz uygulanmamış olabilir.
      console.error("Su hedefi kaydedilemedi (migration uygulanmamış olabilir):", err);
      setWaterGoalError("Hedef kaydedilemedi.");
    }
  }

  async function handleStartFasting(targetHours: number) {
    setStartingFast(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await startFasting(supabase, user.id, categoryId, targetHours);
      setFastingSession(created);
    }
    setStartingFast(false);
  }

  async function handleStopFasting() {
    if (!fastingSession) return;
    const supabase = createClient();
    await stopFasting(supabase, fastingSession.id);
    setFastingSession(null);
  }

  function handleBarcodeResult(product: {
    description: string;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    portion: string | null;
  }) {
    setPending({
      file: null,
      description: product.description,
      calories: product.calories,
      proteinG: product.proteinG,
      carbsG: product.carbsG,
      fatG: product.fatG,
      portion: product.portion,
      summary: "",
    });
  }

  const todayTotals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories ?? 0),
      protein: acc.protein + (f.protein_g ?? 0),
      carbs: acc.carbs + (f.carbs_g ?? 0),
      fat: acc.fat + (f.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const loggedDates = Array.from(new Set(history.map((h) => h.date)));
  const recentDescriptions = history
    .slice(0, 15)
    .map((h) => h.description)
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <NutritionTabBar value={tab} onChange={setTab} />

      {tab === "checklist" && (
        <CategoryChecklist categoryId={categoryId} tasks={tasks} onDeleteTask={onDeleteTask} />
      )}

      {tab === "log" && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">Öğün Kaydı</h2>
              <p className="text-xs text-muted">
                Fotoğraf analiz edilir; onaylarsan fotoğraf ve sonucu birlikte kaydedilir.
              </p>
            </div>
            {!loading && <NutritionRing calories={todayTotals.calories} proteinG={todayTotals.protein} carbsG={todayTotals.carbs} fatG={todayTotals.fat} />}
          </div>

          {!loading && <NutritionStreakBadge loggedDates={loggedDates} />}

          {!pending && (
            <div className="flex flex-col gap-3 rounded-lg border-2 border-muted/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="btn flex h-10 w-fit cursor-pointer items-center gap-2 rounded-lg bg-accent-soft px-4 text-sm font-medium text-accent hover:bg-accent/25">
                  {analyzing ? "Analiz ediliyor..." : "Yemek Fotoğrafı Yükle ve Analiz Et"}
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} disabled={analyzing} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => setManualOpen((v) => !v)}
                  className="btn h-10 rounded-lg border-2 border-muted/30 px-4 text-sm text-muted hover:text-foreground"
                >
                  Elle Ekle
                </button>
                <BarcodeScanButton onResult={handleBarcodeResult} />
              </div>

              {analyzeError && <p className="text-xs text-negative">{analyzeError}</p>}

              {manualOpen && (
                <FoodSearchInput
                  onSelectResult={handleSelectSearchResult}
                  onFreeTextAdd={handleManualAdd}
                  saving={manualSaving}
                />
              )}
            </div>
          )}

          {pending && (
            <div className="rounded-lg border-2 border-accent/40 bg-accent-soft/30 p-4">
              <PendingFoodEditor
                initial={{
                  description: pending.description,
                  portion: pending.portion,
                  calories: pending.calories,
                  proteinG: pending.proteinG,
                  carbsG: pending.carbsG,
                  fatG: pending.fatG,
                }}
                summary={pending.summary}
                onConfirm={handleConfirmYes}
                onCancel={handleConfirmNo}
                saving={confirmSaving}
              />
            </div>
          )}

          {!loading && (
            <>
              <MealPlannerBoard
                meals={meals}
                savedFoods={savedFoods}
                foods={foods}
                photoUrls={photoUrls}
                onAssignFromLibrary={handleAssignFromLibrary}
                onMoveLogEntry={handleMoveLogEntry}
                onRemoveFromMeal={handleRemoveFromMeal}
                onOpenDetail={setSelectedFood}
                onDeleteSavedFood={handleDeleteSavedFood}
                onDeleteMealLog={handleDeleteMealLog}
                onRenameMeal={handleRenameMeal}
                onDeleteMeal={handleDeleteMeal}
                onSaveMealAsPreset={handleSaveMealAsPreset}
              />

              <MealPresetsPanel
                presets={mealPresets}
                items={mealPresetItems}
                meals={meals}
                onApply={handleApplyPreset}
                onDelete={handleDeletePreset}
              />

              {newMealOpen ? (
                <form onSubmit={handleAddMeal} className="flex gap-2">
                  <input
                    autoFocus
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    placeholder="örn. Ara Öğün"
                    className="h-9 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
                  />
                  <button
                    type="submit"
                    className="btn h-9 shrink-0 rounded-lg bg-accent-soft px-4 text-xs font-medium text-accent hover:bg-accent/25"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMealOpen(false);
                      setNewMealName("");
                    }}
                    className="btn h-9 shrink-0 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground"
                  >
                    İptal Et
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setNewMealOpen(true)}
                  className="btn flex w-fit items-center gap-1.5 rounded-lg border-2 border-dashed border-muted/30 px-3 py-1.5 text-xs text-muted hover:text-foreground"
                >
                  <PlusIcon width={12} height={12} />
                  Öğün Ekle
                </button>
              )}
            </>
          )}

          <MealDetailModal
            food={selectedFood}
            photoUrl={selectedFood ? photoUrls[selectedFood.id] : undefined}
            onClose={() => setSelectedFood(null)}
            onDelete={(food) => ("date" in food ? handleDeleteMealLog(food) : handleDeleteSavedFood(food))}
            onUpdate={handleUpdateFood}
          />
        </div>
      )}

      {tab === "water" && !loading && (
        <WaterTracker
          logs={waterLogs}
          history={waterHistory}
          goalMl={nutritionProfile?.water_goal_ml ?? null}
          onAdd={handleAddWater}
          onRemoveLast={handleRemoveLastWater}
          onSetGoal={handleSetWaterGoal}
          adding={addingWater}
          error={waterGoalError}
        />
      )}

      {tab === "fasting" && !loading && (
        <FastingTimer session={fastingSession} onStart={handleStartFasting} onStop={handleStopFasting} starting={startingFast} />
      )}

      {tab === "calorie" && !loading && (
        <CalorieTrackingPanel
          profile={nutritionProfile}
          logs={history}
          onSaveGoal={handleSaveCalorieGoal}
          saving={savingCalorieGoal}
          error={calorieGoalError}
        />
      )}

      {tab === "recipes" && !loading && (
        <>
          <RecipeSuggestion
            categoryId={categoryId}
            recentDescriptions={recentDescriptions}
            onSaved={async () => {
              const supabase = createClient();
              setSavedRecipes(await fetchSavedRecipes(supabase, categoryId));
            }}
          />
          <SavedRecipesList recipes={savedRecipes} onDelete={handleDeleteRecipe} />
        </>
      )}
    </div>
  );
}
