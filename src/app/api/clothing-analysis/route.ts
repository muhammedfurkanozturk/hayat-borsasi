import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { analyzeClothingPhoto } from "@/lib/ai/clothing-analysis";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// Mobil (Stil & Giyim) uygulamanın çerezi yok — /api/rapor'daki AYNI
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

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function isAllowedMediaType(value: unknown): value is AllowedMediaType {
  return typeof value === "string" && (ALLOWED_MEDIA_TYPES as readonly string[]).includes(value);
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

  const body = (await request.json()) as { imageBase64?: string; mediaType?: string };
  if (!body.imageBase64 || !isAllowedMediaType(body.mediaType)) {
    return NextResponse.json({ error: "Geçerli bir fotoğraf gönderilmedi." }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const result = await analyzeClothingPhoto(body.imageBase64, body.mediaType);
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("Giysi analizi hatası:", error);
    let message = "Analiz başarısız oldu, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
