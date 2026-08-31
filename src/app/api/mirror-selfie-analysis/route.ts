import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { analyzeMirrorSelfie } from "@/lib/ai/mirror-selfie-analysis";
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
    const items = await analyzeMirrorSelfie(body.imageBase64, body.mediaType);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Ayna selfisi analizi hatası:", error);
    let message = error instanceof Error ? error.message : "Analiz başarısız oldu, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
