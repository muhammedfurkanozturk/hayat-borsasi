import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateHabitInsight, type RelapseEntry } from "@/lib/ai/habit-insight";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

function isRelapseEntry(value: unknown): value is RelapseEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.date === "string" && (v.note === null || typeof v.note === "string");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = (await request.json()) as { habitTitle?: unknown; relapses?: unknown };
  const habitTitle = typeof body.habitTitle === "string" ? body.habitTitle : "";
  const relapses = Array.isArray(body.relapses) ? body.relapses.filter(isRelapseEntry).slice(0, 60) : [];

  if (!habitTitle) {
    return NextResponse.json({ error: "Alışkanlık adı gerekli." }, { status: 400 });
  }

  try {
    const result = await generateHabitInsight(habitTitle, relapses);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Alışkanlık içgörüsü hatası:", error);

    let message = "İçgörü alınamadı, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
