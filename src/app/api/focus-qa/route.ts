import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { answerFocusQuestion, type FocusSessionSummary } from "@/lib/ai/focus-qa";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

function isSessionSummary(value: unknown): value is FocusSessionSummary {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.subject === null || typeof v.subject === "string") &&
    typeof v.durationMinutes === "number" &&
    typeof v.completedAt === "string"
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = (await request.json()) as { question?: unknown; sessions?: unknown };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const sessions = Array.isArray(body.sessions) ? body.sessions.filter(isSessionSummary).slice(0, 200) : [];

  if (!question) {
    return NextResponse.json({ error: "Bir soru yaz." }, { status: 400 });
  }

  try {
    const answer = await answerFocusQuestion(question, sessions);
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Odaklanma soru-cevap hatası:", error);

    let message = "Cevap alınamadı, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
