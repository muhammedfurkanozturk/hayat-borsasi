import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface OutfitScoreResult {
  score: number;
  comment: string;
}

export interface OutfitScoreItem {
  base64Image: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  label: string;
}

export async function scoreOutfit(items: OutfitScoreItem[]): Promise<OutfitScoreResult> {
  const content: Anthropic.Messages.ContentBlockParam[] = [];
  for (const item of items) {
    content.push({ type: "image", source: { type: "base64", media_type: item.mediaType, data: item.base64Image } });
    content.push({ type: "text", text: `Yukarıdaki parçanın etiketi: ${item.label}` });
  }
  content.push({ type: "text", text: "Bu parçaların birlikte oluşturduğu kombini değerlendir." });

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 300,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system:
      'Sen bir stil danışmanısın. Sana bir kombini oluşturan birden fazla giysi parçasının fotoğrafı ve etiketi verilecek. Bu parçaların renk/stil uyumunu bir bütün olarak değerlendir VE bu kombinin en çok hangi ortam/durum için uygun olduğunu (örn. günlük, iş, spor, özel davet) değerlendirmene kat — yorumun sadece uyumu değil, "ne zaman giyilmeli" tavsiyesini de içersin (örn. "Rahat bir güne uygun ama resmi bir toplantı için fazla spor kaçıyor"). SADECE şu JSON formatında döndür, başka hiçbir metin ekleme: {"score": 1 ile 10 arası tam sayı, "comment": "1-2 cümlelik Türkçe değerlendirme + hangi ortam için uygun olduğu tavsiyesi"}.',
    messages: [{ role: "user", content }],
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

  const score = typeof parsed.score === "number" ? Math.max(1, Math.min(10, Math.round(parsed.score))) : 5;
  return { score, comment: typeof parsed.comment === "string" ? parsed.comment : "" };
}
