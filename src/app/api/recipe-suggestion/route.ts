import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { suggestRecipe, type RecipeSuggestionMode } from "@/lib/ai/recipe-suggestion";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const VALID_MODES: RecipeSuggestionMode[] = ["saved", "surprise", "ingredients"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = (await request.json()) as { mode?: unknown; recentMealDescriptions?: unknown; ingredients?: unknown };
  const mode: RecipeSuggestionMode = VALID_MODES.includes(body.mode as RecipeSuggestionMode)
    ? (body.mode as RecipeSuggestionMode)
    : "saved";
  const recentMealDescriptions = Array.isArray(body.recentMealDescriptions)
    ? body.recentMealDescriptions.filter((d): d is string => typeof d === "string").slice(0, 30)
    : [];
  const ingredients = typeof body.ingredients === "string" ? body.ingredients.slice(0, 500) : "";

  try {
    const result = await suggestRecipe({ mode, recentMealDescriptions, ingredients });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Tarif önerisi hatası:", error);

    let message = error instanceof Error ? error.message : "Tarif önerisi alınamadı, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
