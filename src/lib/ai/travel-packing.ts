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

export interface TravelPackingInput {
  wardrobeItems: WardrobeItemSummary[];
  city: string;
  days: number;
  tempMinC: number | null;
  tempMaxC: number | null;
  rainy: boolean;
}

export interface TravelPackingResult {
  itemIds: string[];
  note: string;
}

function describeItem(item: WardrobeItemSummary): string {
  const parts = [item.label];
  if (item.category) parts.push(CLOTHING_CATEGORY_LABELS[item.category]);
  if (item.color) parts.push(item.color);
  if (item.season) parts.push(CLOTHING_SEASON_LABELS[item.season]);
  if (item.formality) parts.push(CLOTHING_FORMALITY_LABELS[item.formality]);
  return `[id:${item.id}] ${parts.join(", ")}`;
}

// Acloset'ten (piyasa araştırması) ilham — "Seyahat Paketleme Listesi":
// AI Stilist'ten farklı olarak TEK bir kombin değil, gardıroptan bir
// PARÇA SETİ (bavula ne koyulacağı) öneriyor. Aynı "sadece verilen id'lerden
// seç" güvencesi (bkz. style-advice.ts, workoutPlan.ts).
export async function suggestPackingList(input: TravelPackingInput): Promise<TravelPackingResult> {
  if (input.wardrobeItems.length < 2) {
    throw new Error("Gardırobunda yeterli parça yok.");
  }

  const weatherLine =
    input.tempMinC != null && input.tempMaxC != null
      ? `Tahmini hava: ${Math.round(input.tempMinC)}-${Math.round(input.tempMaxC)}°C${input.rainy ? ", yağış ihtimali var" : ""}.`
      : "Bu tarih için henüz hava durumu tahmini yok, mevsim etiketlerine göre genel bir öneri yap.";

  const system =
    `Sen bir seyahat paketleme asistanısın. Kullanıcı ${input.city} şehrine ${input.days} günlük bir seyahate çıkıyor. ${weatherLine} ` +
    `Kullanıcının gardırobundaki parçalardan (SADECE bunlardan, id'leri birebir kullan) bu seyahat için bavula konulacak makul bir set öner ` +
    `— gün sayısına göre yeterli üst/alt, hava soğuksa dış giyim, yağış varsa uygun ayakkabı, karma-eşleşebilecek parçaları tercih et (az parça, çok kombinasyon). ` +
    `Gardırop: ${input.wardrobeItems.map(describeItem).join(" | ")}. ` +
    `SADECE şu JSON formatında döndür: {"itemIds": ["id1", "id2"], "note": "1-2 cümlelik Türkçe not (neden bu seçim, eksik kalan bir kategori varsa belirt)"}. ` +
    `Yanıtın SADECE JSON olsun, kod bloğu işaretleyicisi kullanma.`;

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1000,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: "Bavul için paketleme listesi öner." }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    throw new Error("Paketleme listesi üretilirken bir sorun oluştu, tekrar dener misin?");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Paketleme listesi üretilirken bir sorun oluştu, tekrar dener misin?");
  }
  const record = parsed as Record<string, unknown>;
  const validIds = new Set(input.wardrobeItems.map((i) => i.id));
  const itemIds = Array.isArray(record.itemIds) ? record.itemIds.filter((id): id is string => typeof id === "string" && validIds.has(id)) : [];
  if (itemIds.length === 0) {
    throw new Error("Paketleme listesi üretilirken bir sorun oluştu, tekrar dener misin?");
  }

  return { itemIds, note: typeof record.note === "string" ? record.note : "" };
}
