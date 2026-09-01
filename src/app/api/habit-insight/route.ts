import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateHabitInsight, type RelapseEntry } from "@/lib/ai/habit-insight";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Mobil (Kötü Alışkanlıklar) uygulamanın çerezi yok — /api/rapor'daki AYNI
// Bearer token + CORS deseni burada da uygulandı (bkz. o dosyadaki yorum).
function createBearerClient(token: string) {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

function isRelapseEntry(value: unknown): value is RelapseEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.date === "string" && (v.note === null || typeof v.note === "string");
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;

  const supabase = bearerToken ? createBearerClient(bearerToken) : await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(bearerToken ?? undefined);
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401, headers: CORS_HEADERS });
  }

  const body = (await request.json()) as { habitTitle?: unknown; relapses?: unknown };
  const habitTitle = typeof body.habitTitle === "string" ? body.habitTitle : "";
  const relapses = Array.isArray(body.relapses) ? body.relapses.filter(isRelapseEntry).slice(0, 60) : [];

  if (!habitTitle) {
    return NextResponse.json({ error: "Alışkanlık adı gerekli." }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const result = await generateHabitInsight(habitTitle, relapses);
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Alışkanlık içgörüsü hatası:", error);

    let message = "İçgörü alınamadı, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }

    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
