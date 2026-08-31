export interface TaskDayCompletion {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

// Sorgudan dönen (sadece işaretlenmiş günler için satırı olan, aradaki
// boşlukları içermeyen) günleri sinceDate..untilDate aralığında yoğun bir
// diziye çevirir — kayıt olmayan gün "tamamlanmadı" sayılır. Streak
// hesabının doğru çalışması için bu dolgu şart, yoksa atlanan bir gün
// sanki hiç yaşanmamış gibi seriyi bozmadan atlanır.
export function fillDateRange(
  existing: TaskDayCompletion[],
  sinceDate: string,
  untilDate: string
): TaskDayCompletion[] {
  const completedByDate = new Map(existing.map((d) => [d.date, d.completed]));
  const result: TaskDayCompletion[] = [];
  const cursor = new Date(`${sinceDate}T00:00:00Z`);
  const end = new Date(`${untilDate}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    const iso = cursor.toISOString().slice(0, 10);
    result.push({ date: iso, completed: completedByDate.get(iso) ?? false });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

// Görev bu tarih aralığından daha yeni oluşturulmuş olsa bile sonucu
// bozmaz — görev var olmadan önceki günler baştaki "tamamlanmadı" bloğu
// olarak kalır, gerçek serinin ortasına asla karışmaz.
export function calculateStreak(days: TaskDayCompletion[]): { current: number; longest: number } {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));

  let longest = 0;
  let running = 0;
  for (const day of sorted) {
    if (day.completed) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].completed) current += 1;
    else break;
  }

  return { current, longest };
}

export type HabitCostPeriod = "day" | "week" | "month";

const PERIOD_DAYS: Record<HabitCostPeriod, number> = { day: 1, week: 7, month: 30 };

// Quitzilla'daki (piyasa araştırması) "para/zaman tasarrufu" fikri — kullanıcı
// alışkanlığın maliyetini bir kere giriyor (örn. "haftada 300₺"), temiz
// kaldığı gün sayısıyla çarpılarak canlı hesaplanıyor. Nükseme günü
// tasarruf sayılmıyor çünkü zaten current streak o günden itibaren sıfırdan
// başlıyor (bkz. calculateStreak).
export function calculateHabitSavings(
  costAmount: number | null,
  costPeriod: HabitCostPeriod | null,
  streakDays: number
): number {
  if (costAmount == null || costPeriod == null) return 0;
  const dailyCost = costAmount / PERIOD_DAYS[costPeriod];
  return dailyCost * streakDays;
}

// Quitzilla'daki (piyasa araştırması) otomatik "trophy" kilometre taşları —
// en uzun seriye (streak.longest) göre türetiliyor, DB'de ayrıca
// saklanmıyor; bir kere kırılan rekor rozeti nükseme sonrası da kilitli
// kalmaz (longest hiç azalmaz).
export const HABIT_MILESTONES_DAYS = [1, 3, 7, 14, 30, 60, 90, 180, 365] as const;

export function unlockedMilestones(longestStreak: number): number[] {
  return HABIT_MILESTONES_DAYS.filter((d) => longestStreak >= d);
}

// Pattrn'deki (piyasa araştırması) "büyük hedefi ufak kilometre taşlarına
// bölme" fikri — HABIT_MILESTONES_DAYS zaten bir sıra, buradan "şu anki
// serinin bir sonraki rozete olan mesafesi"ni türetiyor. Zaten en son rozeti
// de geçtiyse null (gösterilecek bir "sıradaki" kalmadı demek).
export interface NextMilestone {
  days: number;
  daysRemaining: number;
  progressPct: number; // önceki kilometre taşından bu yana kat edilen yol, 0-100
}

export function calculateNextMilestone(currentStreak: number): NextMilestone | null {
  const next = HABIT_MILESTONES_DAYS.find((d) => d > currentStreak);
  if (next === undefined) return null;
  const prevIndex = HABIT_MILESTONES_DAYS.indexOf(next) - 1;
  const prev = prevIndex >= 0 ? HABIT_MILESTONES_DAYS[prevIndex] : 0;
  const progressPct = Math.round(((currentStreak - prev) / (next - prev)) * 100);
  return { days: next, daysRemaining: next - currentStreak, progressPct };
}

// Pattrn'deki (piyasa araştırması) "Kilitlenme Skoru" (Locked-In Score)
// fikri — "progress, precision, consistency" birleşimi diyorlar ama gerçek
// formülü paylaşmıyorlar (WebFetch araştırmasında doğrulanamadı). Kendi
// BASİT, ŞEFFAF versiyonumuz: %50 "şu anki serin kişisel rekorunun ne
// kadarı" + %50 "son 30 günde ne sıklıkla nüksettin" (azsa iyi). Karmaşık/
// gizemli bir "AI skoru" değil — istenirse elle doğrulanabilir iki girdiden
// hesaplanan dürüst bir yüzde.
export function calculateLockedInScore(streak: { current: number; longest: number }, relapsesLast30Days: number): number {
  const streakRatio = streak.longest > 0 ? Math.min(1, streak.current / streak.longest) : streak.current > 0 ? 1 : 0;
  const relapseRate = Math.min(1, relapsesLast30Days / 30);
  return Math.round((0.5 * streakRatio + 0.5 * (1 - relapseRate)) * 100);
}

// Pattrn'deki (piyasa araştırması) "AI kalıp/tetikleyici analizi" fikri —
// gerçek örüntü tespiti için notların METNİNE güvenmek yerine (LLM'in
// tarihleri kendi başına sayması güvenilir değil) gün-bazlı dağılımı BURADA
// (deterministik JS) hesaplayıp AI'a hazır bir tablo olarak veriyoruz (bkz.
// habit-insight.ts). "date" YYYY-MM-DD formatında, yerel saat dilimi
// karışıklığı yaratmasın diye UTC olarak parse ediliyor (todayIso ile aynı
// varsayım).
const DAY_NAMES_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export function tallyRelapsesByDayOfWeek(dates: string[]): { day: string; count: number }[] {
  const counts = new Array(7).fill(0);
  for (const date of dates) {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    counts[dow] += 1;
  }
  return DAY_NAMES_TR.map((day, i) => ({ day, count: counts[i] })).filter((d) => d.count > 0);
}
