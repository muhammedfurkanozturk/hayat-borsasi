export type ReportPeriod = "Günlük" | "Haftalık" | "Aylık";

export interface CategorySummary {
  name: string;
  score: number;
}

// Gerçek Claude API bağlanana kadar (backend aşaması), elimizdeki gerçek
// verilerden basit bir kural tabanlı özet metni üretiyoruz. Bu bir yapay
// zeka çıktısı DEĞİL — sadece sayılardan cümle kuruyor.
export function buildLocalReport({
  period,
  overallScore,
  overallDelta,
  categories,
  completedWeight,
  totalWeight,
  dailyNote,
}: {
  period: ReportPeriod;
  overallScore: number;
  overallDelta: number;
  categories: CategorySummary[];
  completedWeight: number;
  totalWeight: number;
  dailyNote: string;
}): string {
  const periodWord = period === "Günlük" ? "Bugün" : period === "Haftalık" ? "Bu hafta" : "Bu ay";
  const trendWord = overallDelta > 0 ? "yükseliş" : overallDelta < 0 ? "düşüş" : "yatay bir seyir";

  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const sentences: string[] = [];

  sentences.push(
    `${periodWord} genel endeksin %${overallScore.toFixed(0)} oldu, önceki döneme göre %${Math.abs(
      overallDelta
    ).toFixed(1)} ${trendWord} gösterdi.`
  );

  if (best && worst && best.name !== worst.name) {
    sentences.push(
      `En güçlü olduğun alan ${best.name} (%${best.score.toFixed(0)}), en çok gelişim fırsatı olan alan ise ${worst.name} (%${worst.score.toFixed(0)}).`
    );
  }

  if (totalWeight > 0) {
    sentences.push(
      `Ağırlık bazında görevlerinin %${((completedWeight / totalWeight) * 100).toFixed(0)}'ini tamamladın.`
    );
  }

  if (period === "Günlük" && dailyNote.trim()) {
    const trimmed = dailyNote.trim();
    const excerpt = trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed;
    sentences.push(`Bugünkü notunda şunu paylaştın: "${excerpt}"`);
  }

  return sentences.join(" ");
}
