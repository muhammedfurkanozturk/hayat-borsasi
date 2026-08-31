import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// roadmap.sh'in "Learn with AI" özelliğinden (piyasa araştırması, WebFetch —
// roadmap.sh'in gerçek AI sohbet arayüzü kopyalanmadı, sadece "bir konuyu
// AI'a sor" fikri) ilham — düğüm başlığına göre kısa, öğretici bir Türkçe
// açıklama üretiyor. Ephemeral — kaydedilmiyor (tarif önerisi/odak soru-cevap
// ile aynı desen), her seferinde yeniden istenmesi gerekiyor.
export async function explainRoadmapTopic(topicTitle: string, roadmapName: string, parentTitle: string | null): Promise<string> {
  const context = parentTitle ? `"${parentTitle}" konusunun altındaki bir alt başlık` : "ana bir konu başlığı";

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 500,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system:
      "Sen bir yol haritasındaki (roadmap) bir konuyu kısaca öğreten bir eğitim asistanısın. Kullanıcıya konunun NE OLDUĞUNU, NEDEN önemli olduğunu ve öğrenmeye nereden başlayabileceğini 3-5 kısa paragrafta (madde işaretleri kullanabilirsin) Türkçe anlat. Ders kitabı gibi resmi değil, samimi ve anlaşılır bir dille yaz. Uydurma bilgi verme, genel/bilinen doğrulardan git.",
    messages: [
      {
        role: "user",
        content: `"${roadmapName}" yol haritasında "${topicTitle}" adlı konuyu (${context}) kısaca öğret.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }
  return textBlock.text.trim();
}
