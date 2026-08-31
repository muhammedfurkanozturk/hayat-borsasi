import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  CLOTHING_CATEGORY_LABELS,
  CLOTHING_FORMALITY_LABELS,
  CLOTHING_SEASON_LABELS,
  type ClothingCategory,
  type ClothingFormality,
  type ClothingSeason,
} from "@hayat-borsasi/shared";

const client = new Anthropic();

export interface WardrobeItemSummary {
  id: string;
  label: string;
  category: ClothingCategory | null;
  color: string | null;
  season: ClothingSeason | null;
  formality: ClothingFormality | null;
}

export interface StyleAdviceInput {
  wardrobeItems: WardrobeItemSummary[];
  weather: { tempC: number; label: string } | null;
  occasion?: string;
  skinTone?: string | null;
  bodyType?: string | null;
}

export interface StyleAdviceResult {
  itemIds: string[];
  reasoning: string;
  score: number;
}

function describeItem(item: WardrobeItemSummary): string {
  const parts = [item.label];
  if (item.category) parts.push(CLOTHING_CATEGORY_LABELS[item.category]);
  if (item.color) parts.push(item.color);
  if (item.season) parts.push(CLOTHING_SEASON_LABELS[item.season]);
  if (item.formality) parts.push(CLOTHING_FORMALITY_LABELS[item.formality]);
  return `[id:${item.id}] ${parts.join(", ")}`;
}

// Acloset'ten (piyasa araştırması) ilham alınan "AI Stilist" — mevcut
// "kombin puanla" akışının TERSİ: kullanıcı parça seçmiyor, AI mevcut
// gardıroptan (hava durumu + opsiyonel etkinlik/ten tonu/vücut tipiyle)
// bir kombin ÖNERİYOR. Claude egzersiz kütüphanesindeki gibi SADECE verilen
// gardırop id'lerinden seçmeye zorlanıyor, uydurma parça riski önleniyor.
export async function suggestOutfit(input: StyleAdviceInput): Promise<StyleAdviceResult> {
  if (input.wardrobeItems.length < 2) {
    throw new Error("Gardırobunda yeterli parça yok — AI Stilist için en az birkaç parça ekle.");
  }

  const weatherLine = input.weather
    ? `Hava durumu: ${Math.round(input.weather.tempC)}°C, ${input.weather.label}.`
    : "Hava durumu bilgisi yok, mevsim etiketlerine göre genel bir öneri yap.";
  const occasionLine = input.occasion?.trim() ? `Ortam/etkinlik: ${input.occasion.trim()}.` : "Belirli bir ortam belirtilmedi, günlük giyim varsay.";
  const profileLine =
    input.skinTone || input.bodyType
      ? `Kullanıcı bilgisi (opsiyonel, sadece ipucu — asla önerinin tek belirleyicisi olmasın): ${[input.skinTone && `ten tonu: ${input.skinTone}`, input.bodyType && `vücut tipi: ${input.bodyType}`].filter(Boolean).join(", ")}.`
      : "";

  const system =
    `Sen bir kişisel stil danışmanısın. Kullanıcının gardırobundaki parçalardan (SADECE bunlardan, id'leri birebir kullan) bugün için TEK bir kombin öner. ` +
    `${weatherLine} ${occasionLine} ${profileLine} ` +
    `Gardırop: ${input.wardrobeItems.map(describeItem).join(" | ")}. ` +
    `Mantıklı bir kombin kur (genelde üst+alt VEYA elbise, uygunsa ayakkabı/dış giyim/aksesuar ekle) — hava soğuksa dış giyim ekle, sıcaksa ekleme. ` +
    `SADECE şu JSON formatında döndür: {"itemIds": ["id1", "id2"], "reasoning": "2-3 cümlelik Türkçe gerekçe (hava/ortama neden uygun)", "score": 8}. ` +
    `score 1-10 arası, bu kombinin isteğe ne kadar iyi uyduğuna dair kendi güvenin. ` +
    `Yanıtın SADECE JSON olsun, kod bloğu işaretleyicisi kullanma, açıklama ekleme.`;

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 800,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: "Bana bugün için bir kombin öner." }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    throw new Error("Öneri üretilirken bir sorun oluştu, tekrar dener misin?");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Öneri üretilirken bir sorun oluştu, tekrar dener misin?");
  }
  const record = parsed as Record<string, unknown>;
  const validIds = new Set(input.wardrobeItems.map((i) => i.id));
  const itemIds = Array.isArray(record.itemIds) ? record.itemIds.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
  if (itemIds.length === 0) {
    throw new Error("Öneri üretilirken bir sorun oluştu, tekrar dener misin?");
  }

  return {
    itemIds,
    reasoning: typeof record.reasoning === "string" ? record.reasoning : "",
    score: typeof record.score === "number" ? Math.min(10, Math.max(1, Math.round(record.score))) : 7,
  };
}
