import type { SupabaseClient } from "@supabase/supabase-js";
import type { Recipe, RecipeCourse, RecipeDiet, RecipeDifficulty, RecipeIngredient, RecipeInspiration } from "../recipe";

export interface DbSavedRecipe {
  id: string;
  tarif_adi: string;
  hazirlik_suresi: string;
  pisirme_suresi: string;
  porsiyon: string;
  malzemeler: RecipeIngredient[];
  adimlar: string[];
  sunum_onerisi: string;
  created_at: string;
  zorluk?: RecipeDifficulty | null;
  ogun_turu?: RecipeCourse | null;
  ilham?: RecipeInspiration | null;
  diyetler?: RecipeDiet[] | null;
  varyasyon_onerisi?: string | null;
}

const COLUMNS = "id, tarif_adi, hazirlik_suresi, pisirme_suresi, porsiyon, malzemeler, adimlar, sunum_onerisi, created_at";
// 2026-08-29 (KitchenAid filtreleme metadatası): migration
// (20260901100000) henüz uygulanmamış olabilir — diğer defansif alanlarla
// aynı desen, önce bu sütunlarla dener, olmazsa düşer.
const COLUMNS_WITH_METADATA = `${COLUMNS}, zorluk, ogun_turu, ilham, diyetler, varyasyon_onerisi`;

export async function fetchSavedRecipes(supabase: SupabaseClient, categoryId: string): Promise<DbSavedRecipe[]> {
  try {
    const { data, error } = await supabase
      .from("saved_recipes")
      .select(COLUMNS_WITH_METADATA)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    const { data, error } = await supabase
      .from("saved_recipes")
      .select(COLUMNS)
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
}

export async function insertSavedRecipe(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  recipe: Recipe
): Promise<DbSavedRecipe> {
  const basePayload = {
    user_id: userId,
    category_id: categoryId,
    tarif_adi: recipe.tarif_adi,
    hazirlik_suresi: recipe.hazirlik_suresi,
    pisirme_suresi: recipe.pisirme_suresi,
    porsiyon: recipe.porsiyon,
    malzemeler: recipe.malzemeler,
    adimlar: recipe.adimlar,
    sunum_onerisi: recipe.sunum_onerisi,
  };

  try {
    const { data, error } = await supabase
      .from("saved_recipes")
      .insert({
        ...basePayload,
        zorluk: recipe.zorluk ?? null,
        ogun_turu: recipe.ogun_turu ?? null,
        ilham: recipe.ilham ?? null,
        diyetler: recipe.diyetler ?? [],
        varyasyon_onerisi: recipe.varyasyon_onerisi ?? "",
      })
      .select(COLUMNS_WITH_METADATA)
      .single();
    if (error) throw error;
    return data;
  } catch {
    const { data, error } = await supabase.from("saved_recipes").insert(basePayload).select(COLUMNS).single();
    if (error) throw error;
    return data;
  }
}

export async function deleteSavedRecipe(supabase: SupabaseClient, recipeId: string) {
  const { error } = await supabase.from("saved_recipes").delete().eq("id", recipeId);
  if (error) throw error;
}
