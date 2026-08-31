import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { CategorySummary, ReportPeriod } from "@/lib/report";

const client = new Anthropic();

const periodWord: Record<ReportPeriod, string> = {
  Günlük: "bugünkü",
  Haftalık: "bu haftaki",
  Aylık: "bu ayki",
  Yıllık: "bu yılki",
};

export interface ReportInput {
  period: ReportPeriod;
  overallScore: number;
  overallDelta: number;
  categories: CategorySummary[];
  completedWeight: number;
  totalWeight: number;
  dailyNote: string;
}

// Claude API anahtarı sadece burada, server tarafında kullanılır — client'a
// asla gönderilmez. Bu dosya "server-only" ile işaretli, bir client
// component'ten yanlışlıkla import edilirse build hatası verir.
export async function generateAiReport({
  period,
  overallScore,
  overallDelta,
  categories,
  completedWeight,
  totalWeight,
  dailyNote,
}: ReportInput): Promise<string> {
  const categoryLines =
    categories.map((c) => `- ${c.name}: %${c.score.toFixed(0)}`).join("\n") ||
    "(Henüz kategori yok)";

  const noteLine =
    period === "Günlük" && dailyNote.trim()
      ? `Kullanıcının bugünkü notu: "${dailyNote.trim()}"`
      : "";

  const userPrompt = `Kullanıcının "Hayat Borsası" adlı kişisel gelişim takip uygulamasındaki ${periodWord[period]} verileri aşağıda.

Genel endeks: %${overallScore.toFixed(0)} (önceki döneme göre ${
    overallDelta >= 0 ? "+" : ""
  }${overallDelta.toFixed(1)} puan)
Tamamlanan görev ağırlığı: ${completedWeight}/${totalWeight}
Kategori skorları:
${categoryLines}
${noteLine}

Bu verilerden kullanıcıya doğrudan hitap eden, samimi ama gereksiz uzatmayan bir özet/içgörü hazırla. Sayıları art arda sıralama; asıl gözlemi ve varsa somut bir öneriyi öne çıkar.`;

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1536,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: `Sen 'Hayat Borsası' uygulamasının yapay zeka rapor asistanısın. Kullanıcının kişisel gelişim verilerinden kısa, doğal, motive edici ama abartısız Türkçe içgörüler üretirsin. Yanıtların her zaman sadece Türkçe olur.

Yanıtını SADECE aşağıdaki şemaya uyan, geçerli bir JSON nesnesi olarak ver — başka hiçbir metin (açıklama, markdown kod bloğu işareti, ön/son yorum) ekleme, sadece ham JSON:

{
  "durum_ozeti": "Tek cümlelik genel değerlendirme",
  "bolumler": [
    { "baslik": "Kısa bölüm başlığı", "icerik": "Kısa paragraf ya da madde madde metin (madde işareti istersen '- ' ile başlayan satırlar kullan)", "ton": "pozitif" }
  ]
}

Kurallar:
- "ton" alanı SADECE şu dört değerden biri olabilir: "pozitif", "notr", "uyari", "negatif".
- Bölüm başlıklarını ve sayısını (genelde 2-4 arası) döneme ve verinin içeriğine göre kendin, anlamlı şekilde belirle — sabit bir şablon değil.
- Gerçekten dikkat çekmesi gereken bir şey yoksa "uyari"/"negatif" tonunu zorlama, "notr" ya da "pozitif" kullan.
- "icerik" alanında markdown başlığı veya iç içe JSON kullanma, sadece düz metin (madde satırları hariç).`,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }
  return textBlock.text.trim();
}
