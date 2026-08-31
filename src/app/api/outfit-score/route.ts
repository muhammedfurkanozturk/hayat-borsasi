import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { scoreOutfit, type OutfitScoreItem } from "@/lib/ai/outfit-score";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const BUCKET = "clothing-photos";
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

  const body = (await request.json()) as {
    items?: { photoPath: string; photoMime: string; label: string }[];
  };
  if (!body.items || body.items.length < 2) {
    return NextResponse.json({ error: "En az 2 parça gerekiyor." }, { status: 400 });
  }

  try {
    const items: OutfitScoreItem[] = await Promise.all(
      body.items.map(async (item) => {
        const { data, error } = await supabase.storage.from(BUCKET).download(item.photoPath);
        if (error || !data) throw new Error("Fotoğraf okunamadı.");
        const buffer = Buffer.from(await data.arrayBuffer());
        const mediaType = isAllowedMediaType(item.photoMime) ? item.photoMime : "image/jpeg";
        return { base64Image: buffer.toString("base64"), mediaType, label: item.label };
      })
    );

    const result = await scoreOutfit(items);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Kombin puanlama hatası:", error);
    let message = "Puanlama başarısız oldu, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
