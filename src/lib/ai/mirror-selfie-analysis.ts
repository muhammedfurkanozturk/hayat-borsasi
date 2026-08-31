import "server-only";
import { CLOTHING_CATEGORIES, CLOTHING_FORMALITIES, CLOTHING_SEASONS } from "@hayat-borsasi/shared";
import type { ClothingCategory, ClothingFormality, ClothingSeason } from "@hayat-borsasi/shared";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface DetectedClothingItem {
  label: string;
  category: ClothingCategory | null;
  color: string | null;
  season: ClothingSeason | null;
  formality: ClothingFormality | null;
  // 0-1 arası normalize edilmiş, fotoğrafın SOL-ÜST köşesine göre bölge —
  // bkz. clothing-analysis.ts'teki tek-parça analiz. DÜRÜSTLÜK NOTU: bir
  // dil modelinin piksel-hassasiyetinde konum tahmini KESİN DEĞİL, sadece
  // yaklaşık bir bölge — istemci tarafı (WardrobePanel) bunu geniş bir
  // marjla kırpıyor, tamamen yanlışsa kullanıcı elle tek-tek yükleme
  // akışına her zaman dönebilir.
  box: { x: number; y: number; width: number; height: number };
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function clamp01(n: unknown, fallback: number): number {
  const num = typeof n === "number" ? n : fallback;
  return Math.max(0, Math.min(1, num));
}

// Acloset'in "Smart Detector" (piyasa araştırması) özelliğinden ilham —
// bir ayna selfie'sindeki HER giysi parçasını ayrı ayrı tespit ediyor.
// Arka plan kaldırma AYRI, istemci-tarafında (@imgly/background-removal,
// tamamen tarayıcıda çalışıyor) yapılıyor — bu fonksiyon sadece tespit +
// yaklaşık konum döndürüyor.
export async function analyzeMirrorSelfie(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<DetectedClothingItem[]> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1200,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: `Sen bir stil asistanısın. Sana bir kişinin AYNA SELFİSİ (üzerinde birden fazla giysi/aksesuar parçasıyla) gösterilecek. Fotoğraftaki her AYRI giysi/aksesuar parçasını (üst, alt, ayakkabı, dış giyim, aksesuar — vücut/yüz parçası değil) tespit et. SADECE şu JSON formatında bir DİZİ döndür, başka hiçbir metin ekleme:
[
  {
    "label": "kısa (2-4 kelime) Türkçe etiket, örn. 'Beyaz Tişört'",
    "category": "şu listeden BİRİ: ${CLOTHING_CATEGORIES.join(", ")}",
    "color": "kısa Türkçe baskın renk",
    "season": "şu listeden BİRİ: ${CLOTHING_SEASONS.join(", ")}",
    "formality": "şu listeden BİRİ: ${CLOTHING_FORMALITIES.join(", ")}",
    "box": {"x": 0.0-1.0, "y": 0.0-1.0, "width": 0.0-1.0, "height": 0.0-1.0}
  }
]
"box" fotoğrafın SOL-ÜST köşesine göre bu parçanın kapladığı YAKLAŞIK dikdörtgen bölge (0=sol/üst kenar, 1=sağ/alt kenar) — kesin olmak zorunda değil, kabaca doğru bir tahmin yeterli. Emin olamadığın alanlar için null kullan, uydurma. En fazla 6 parça döndür, çok küçük/belirsiz detayları atla.`,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
          { type: "text", text: "Bu ayna selfisindeki her giysi/aksesuar parçasını ayrı ayrı tespit et." },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    throw new Error("Fotoğraf analiz edilemedi, tekrar dener misin?");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Fotoğraf analiz edilemedi, tekrar dener misin?");
  }

  const items: DetectedClothingItem[] = parsed
    .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
    .map((p) => {
      const box = typeof p.box === "object" && p.box !== null ? (p.box as Record<string, unknown>) : {};
      return {
        label: typeof p.label === "string" && p.label.trim() ? p.label : "Parça",
        category: isOneOf(p.category, CLOTHING_CATEGORIES) ? p.category : null,
        color: typeof p.color === "string" ? p.color : null,
        season: isOneOf(p.season, CLOTHING_SEASONS) ? p.season : null,
        formality: isOneOf(p.formality, CLOTHING_FORMALITIES) ? p.formality : null,
        box: {
          x: clamp01(box.x, 0),
          y: clamp01(box.y, 0),
          width: clamp01(box.width, 1),
          height: clamp01(box.height, 1),
        },
      };
    })
    .slice(0, 6);

  if (items.length === 0) {
    throw new Error("Fotoğrafta bir giysi parçası tespit edilemedi.");
  }
  return items;
}
