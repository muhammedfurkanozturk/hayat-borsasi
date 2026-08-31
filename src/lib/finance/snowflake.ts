// Simply Wall St'in "Kar Tanesi" (Snowflake) grafiğinden ilham — ama SWS'in
// gerçek metodolojisi analist DCF adil değer modeline dayanıyor, bu kullanıcının
// kendi isteğiyle KAPSAM DIŞI bırakıldı (bkz. FEATURE_QUEUE.md madde 4). Burada
// SADECE Yahoo Finance'in ücretsiz API'sinin gerçekten döndürdüğü ham finansal
// verilerden (P/E, P/B, temettü verimi, ROE, gelir büyümesi tahmini, cari oran,
// borç/özkaynak, 52 haftalık aralık) basit, şeffaf bantlarla 0-5 arası bir skor
// üretiliyor. Hiçbir sayı uydurulmuyor — bir metrik eksikse o eksen "veri yok"
// olarak işaretleniyor (0 puan ALMIYOR, sadece grafik dışı bırakılıyor gibi
// davranılıyor: skor 0 gösterilir ama `available: false` ile ayırt edilir).
export interface SnowflakeInput {
  trailingPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  returnOnEquity: number | null;
  revenueGrowth: number | null;
  currentRatio: number | null;
  debtToEquity: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  price: number | null;
}

export interface SnowflakeAxis {
  key: string;
  label: string;
  score: number; // 0-5
  available: boolean;
}

function bandScore(value: number, bands: number[]): number {
  // bands küçükten büyüğe eşik listesi, kaçıncı bandın altına düşerse o index puan
  for (let i = 0; i < bands.length; i++) {
    if (value <= bands[i]) return bands.length - i;
  }
  return 0;
}

export function calculateSnowflake(input: SnowflakeInput): SnowflakeAxis[] {
  const value: SnowflakeAxis = {
    key: "value",
    label: "Değer",
    available: input.trailingPE != null && input.trailingPE > 0,
    score: input.trailingPE != null && input.trailingPE > 0 ? bandScore(input.trailingPE, [5, 8, 12, 18, 30]) : 0,
  };

  const growth: SnowflakeAxis = {
    key: "growth",
    label: "Büyüme",
    available: input.revenueGrowth != null,
    score:
      input.revenueGrowth != null
        ? Math.max(0, Math.min(5, [0, 0.05, 0.15, 0.25, 0.4].filter((t) => (input.revenueGrowth as number) > t).length))
        : 0,
  };

  const past: SnowflakeAxis = {
    key: "past",
    label: "Geçmiş Performans",
    available: input.fiftyTwoWeekLow != null && input.fiftyTwoWeekHigh != null && input.price != null && input.fiftyTwoWeekHigh > input.fiftyTwoWeekLow,
    score: (() => {
      if (input.fiftyTwoWeekLow == null || input.fiftyTwoWeekHigh == null || input.price == null) return 0;
      const range = input.fiftyTwoWeekHigh - input.fiftyTwoWeekLow;
      if (range <= 0) return 0;
      const ratio = (input.price - input.fiftyTwoWeekLow) / range;
      return Math.max(0, Math.min(5, Math.round(ratio * 5)));
    })(),
  };

  // Cari oran: YÜKSEK olması iyi (bandScore'un tersi — kaç eşiği AŞTIĞI sayılıyor). Maks 3 puan.
  const currentRatioScore =
    input.currentRatio != null ? [1, 1.5, 2].filter((t) => (input.currentRatio as number) > t).length : null;
  // Borç/özkaynak: DÜŞÜK olması iyi (bandScore küçük değer için yüksek puan veriyor, doğrudan kullanılıyor). Maks 2 puan.
  // Yahoo debtToEquity BIST hisseleri için genelde yüzde ölçeğinde döner (örn. 45.2 = %45.2).
  const debtScore = input.debtToEquity != null ? bandScore(input.debtToEquity, [50, 100]) : null;
  const healthParts = [currentRatioScore, debtScore].filter((s): s is number => s != null);
  const health: SnowflakeAxis = {
    key: "health",
    label: "Finansal Sağlık",
    available: healthParts.length > 0,
    score: healthParts.length > 0 ? Math.max(0, Math.min(5, healthParts.reduce((a, b) => a + b, 0))) : 0,
  };

  const dividend: SnowflakeAxis = {
    key: "dividend",
    label: "Temettü",
    available: input.dividendYield != null,
    score: input.dividendYield != null ? Math.max(0, Math.min(5, [0, 0.02, 0.04, 0.06, 0.08].filter((t) => (input.dividendYield as number) > t).length)) : 0,
  };

  return [value, growth, past, health, dividend];
}
