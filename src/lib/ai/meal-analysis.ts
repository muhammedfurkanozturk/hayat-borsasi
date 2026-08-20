import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface MealAnalysisResult {
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  summary: string;
}

// Fotoğrafın kendisi hiçbir yerde saklanmıyor — sadece bu analizin sonucu
// (metin/sayı) meal_logs'a yazılıyor. Aynı prensip sesli not için de
// geçerli (bkz. CLAUDE.md bölüm 8).
export async function analyzeMealPhoto(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
): Promise<MealAnalysisResult> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 500,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system:
      'Sen bir beslenme analiz asistanısın. Sana gösterilen yemek fotoğrafını inceleyip tahmini besin değerlerini SADECE şu JSON formatında döndür, başka hiçbir metin ekleme: {"description": "kısa Türkçe yemek tanımı", "calories": sayı_veya_null, "protein_g": sayı_veya_null, "carbs_g": sayı_veya_null, "fat_g": sayı_veya_null, "summary": "1 cümlelik Türkçe değerlendirme"}. Emin olamadığın değerler için null kullan, uydurma.',
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
          { type: "text", text: "Bu yemeğin besin değerlerini tahmin et." },
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

  const num = (v: unknown) => (typeof v === "number" ? v : null);
  return {
    description: typeof parsed.description === "string" ? parsed.description : "",
    calories: num(parsed.calories),
    proteinG: num(parsed.protein_g),
    carbsG: num(parsed.carbs_g),
    fatG: num(parsed.fat_g),
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
}
