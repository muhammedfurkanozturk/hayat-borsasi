import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { analyzeMealPhoto } from "@/lib/ai/meal-analysis";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function isAllowedMediaType(value: unknown): value is AllowedMediaType {
  return typeof value === "string" && (ALLOWED_MEDIA_TYPES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = (await request.json()) as { imageBase64?: string; mediaType?: string };
  if (!body.imageBase64 || !isAllowedMediaType(body.mediaType)) {
    return NextResponse.json({ error: "Geçerli bir fotoğraf gönderilmedi." }, { status: 400 });
  }

  try {
    const result = await analyzeMealPhoto(body.imageBase64, body.mediaType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Yemek analizi hatası:", error);

    let message = "Analiz başarısız oldu, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        message = "Analiz başarısız oldu. ANTHROPIC_API_KEY .env.local dosyasında tanımlı ve geçerli mi kontrol et.";
      } else if (error.status === 429) {
        message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      } else if (error.status === 529) {
        message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
