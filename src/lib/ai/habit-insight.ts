import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { tallyRelapsesByDayOfWeek } from "@hayat-borsasi/shared";

const client = new Anthropic();

export interface HabitInsightResult {
  insight: string;
}

export interface RelapseEntry {
  date: string;
  note: string | null;
}

// Delust'taki (piyasa araştırması) yargılamayan yansıma günlüğü fikri,
// Pattrn'in "gizli örüntüleri bulan AI" fikriyle genişletildi (Madde 10) —
// artık sadece not METNİNE değil, GÜN-BAZLI DAĞILIMA da bakıyor. Tarihlerin
// kendisini AI'a sayması için bırakmak güvenilir değil (LLM'ler tarih
// aritmetiğinde hata yapabilir) — gün dağılımı `tallyRelapsesByDayOfWeek`
// ile deterministik JS'te önceden hesaplanıp AI'a hazır bir tablo olarak
// veriliyor, AI sadece bu tabloyu Türkçe'ye/tavsiyeye çeviriyor. Sonuç
// kalıcı kaydedilmiyor (ephemeral, mevcut tarif önerisi deseniyle aynı).
export async function generateHabitInsight(habitTitle: string, relapses: RelapseEntry[]): Promise<HabitInsightResult> {
  const dayTally = tallyRelapsesByDayOfWeek(relapses.map((r) => r.date));
  const dayTallyText = dayTally.length > 0 ? dayTally.map((d) => `${d.day}: ${d.count}`).join(", ") : "(yeterli veri yok)";
  const notes = relapses.map((r) => r.note).filter((n): n is string => Boolean(n));

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 300,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system:
      'Sen destekleyici, yargılamayan bir bağımlılık/alışkanlık bırakma koçusun. Kullanıcının bırakmaya çalıştığı alışkanlık, nükseme notları VE nükseme günlerinin haftanın hangi gününe denk geldiğinin dökümü verilecek. Bu ikisinden GERÇEKTEN çıkarılabilecek bir örüntü (tetikleyici, hangi gün(ler) riskli, durum) varsa fark et ve 2-3 cümlelik, suçlayıcı olmayan, destekleyici bir Türkçe içgörü/tavsiye yaz. Veri yetersizse örüntü UYDURMA, bunun yerine genel bir destek cümlesi yaz. SADECE şu JSON formatında döndür, başka hiçbir metin ekleme: {"insight": "2-3 cümlelik Türkçe içgörü"}.',
    messages: [
      {
        role: "user",
        content:
          relapses.length > 0
            ? `Alışkanlık: ${habitTitle}\nGüne göre nüksetme dağılımı: ${dayTallyText}\nNotlar: ${notes.length > 0 ? notes.join(" | ") : "(not girilmemiş)"}`
            : `Alışkanlık: ${habitTitle}\nHenüz nükseme kaydı yok, genel bir destek/motivasyon cümlesi yaz.`,
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

  return { insight: typeof parsed.insight === "string" ? parsed.insight : "" };
}
