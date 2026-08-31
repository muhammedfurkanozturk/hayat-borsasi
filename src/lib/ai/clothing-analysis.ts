import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CLOTHING_CATEGORIES, CLOTHING_FORMALITIES, CLOTHING_SEASONS } from "@hayat-borsasi/shared";
import type { ClothingCategory, ClothingFormality, ClothingSeason } from "@hayat-borsasi/shared";

const client = new Anthropic();

export interface ClothingAnalysisResult {
  label: string;
  category: ClothingCategory | null;
  color: string | null;
  season: ClothingSeason | null;
  formality: ClothingFormality | null;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

// SELION.AI'nin (piyasa araştırması) çıkardığı tam alan listesinden (kategori/
// alt kategori, renk, materyal, desen, mevsim, sıcaklık, resmiyet, kesim,
// katman rolü) bize en çok değer katacak 4 alan seçildi: kategori, renk,
// mevsim, resmiyet — filtrede/kombin puanlamasında doğrudan kullanılabilir.
export async function analyzeClothingPhoto(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<ClothingAnalysisResult> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 300,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: `Sen bir stil asistanısın. Sana gösterilen tek bir giysi/aksesuar parçasının fotoğrafını incele. SADECE şu JSON formatında döndür, başka hiçbir metin ekleme:
{
  "label": "kısa (2-4 kelime) Türkçe etiket, örn. 'Mavi Kot Pantolon'",
  "category": "şu listeden BİRİ: ${CLOTHING_CATEGORIES.join(", ")} (üst/alt/elbise/ayakkabı/dış giyim/aksesuar)",
  "color": "kısa Türkçe baskın renk, örn. 'Lacivert'",
  "season": "şu listeden BİRİ: ${CLOTHING_SEASONS.join(", ")} (yaz/kış/ara mevsim/tüm mevsim)",
  "formality": "şu listeden BİRİ: ${CLOTHING_FORMALITIES.join(", ")} (günlük/spor/iş/özel)"
}
Emin olamadığın bir alan için null kullan, uydurma.`,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
          { type: "text", text: "Bu parçayı etiketle." },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(textBlock.text.trim());
  } catch {
    throw new Error("Claude yanıtı beklenen JSON formatında değildi.");
  }

  return {
    label: typeof parsed.label === "string" ? parsed.label : "Parça",
    category: isOneOf(parsed.category, CLOTHING_CATEGORIES) ? parsed.category : null,
    color: typeof parsed.color === "string" ? parsed.color : null,
    season: isOneOf(parsed.season, CLOTHING_SEASONS) ? parsed.season : null,
    formality: isOneOf(parsed.formality, CLOTHING_FORMALITIES) ? parsed.formality : null,
  };
}
