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
