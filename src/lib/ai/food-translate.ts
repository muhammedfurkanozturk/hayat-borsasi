import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// USDA FoodData Central İngilizce bir veritabanı — Türkçe sorgularda (ör.
// "muz", "mercimek çorbası") sessizce 0 sonuç dönüyor (canlı test edildi,
// bkz. CLAUDE.md Bölüm 2a bulgusu). Bu, arama input'unda sadece USDA
// boş dönerse (ilk hızlı deneme başarısız olursa) devreye giren, tek
// kelimelik/kısa bir çeviri fallback'i — Open Food Facts tarafı zaten
// Türkçe metni doğrudan destekliyor, buna ihtiyacı yok.
export async function translateFoodQueryToEnglish(query: string): Promise<string | null> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 20,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system:
      "Kısa bir Türkçe yemek/malzeme adını, USDA FoodData Central gibi İngilizce bir beslenme veritabanında aratılacak en yakın kısa İngilizce karşılığına çevirirsin. SADECE İngilizce karşılığı yaz (1-4 kelime) — tırnak, noktalama, açıklama YOK. Girdi zaten İngilizceyse veya çevrilemeyecek bir marka adıysa, olduğu gibi geri döndür.",
    messages: [{ role: "user", content: query }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;
  const translated = textBlock.text.trim().replace(/^["']|["']$/g, "");
  return translated || null;
}
