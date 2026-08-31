import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface FocusSessionSummary {
  subject: string | null;
  durationMinutes: number;
  completedAt: string;
}

// Chronoid'deki (piyasa araştırması) "verimin hakkında doğal dilde soru
// sor" fikri — Chronoid'in kendisi native bir masaüstü uygulaması ve
// otomatik/pasif takip yapıyor (bizim web sekmemizde bu teknik olarak
// mümkün değil, bkz. CLAUDE.md'deki GitHub/LinkedIn kararı), ama
// mevcut ELLE tutulan Pomodoro seans verisi üzerine aynı "soru-cevap"
// katmanını kurabiliyoruz.
export async function answerFocusQuestion(question: string, sessions: FocusSessionSummary[]): Promise<string> {
  const sessionLines =
    sessions
      .map((s) => `- ${s.completedAt.slice(0, 10)} · ${s.subject ?? "Genel"} · ${s.durationMinutes} dk`)
      .join("\n") || "(Henüz kayıtlı seans yok)";

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 400,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system:
      "Sen kullanıcının kişisel odaklanma/çalışma seans geçmişine bakıp sorularını yanıtlayan bir asistansın. Sana kullanıcının Pomodoro seans listesi (tarih, ders/konu, dakika) ve bir soru verilecek. SADECE verilen veriden hareketle, kısa (1-3 cümle) bir Türkçe cevap yaz. Veride cevaplanamayacak bir şey sorulursa bunu dürüstçe belirt, uydurma.",
    messages: [
      {
        role: "user",
        content: `Seans geçmişi:\n${sessionLines}\n\nSoru: ${question}`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }
  return textBlock.text.trim();
}
