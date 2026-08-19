// Kategori ikon anahtarları — tek doğruluk kaynağı burası. Web tarafındaki
// `iconPalette` (gerçek SVG bileşenleri) bu union'a karşı derleme zamanında
// doğrulanır; mobil kendi ikon bileşenlerini aynı anahtarlarla eşler.
export const ICON_KEYS = [
  "rocket",
  "book",
  "target",
  "users",
  "heart",
  "moon-star",
  "star",
  "badge",
  "wallet",
  "dumbbell",
  "apple",
  "pulse",
  "briefcase",
  "leaf",
  "home",
  "plane",
  "code",
  "music",
  "palette",
  "camera",
  "utensils",
  "clock",
  "gamepad",
  "paw",
  "car",
  "lightbulb",
  "calendar",
  "flame",
  "sun",
  "compass",
] as const;

export type IconKey = (typeof ICON_KEYS)[number];

// Geçmişteki bir günün genel ve kategori bazlı skoru — Skor Trendi
// grafiğinde ve kategori kutucuklarındaki yıllık katkı oranında kullanılır.
export interface DailyScorePoint {
  date: string;
  overallScore: number;
  categoryScores: Record<string, number>;
}
