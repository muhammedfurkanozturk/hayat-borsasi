import { buildHourlySeries, type TimedTask } from "./scoring";
import type { DailyScorePoint } from "./types";

export interface ChartPoint {
  label: string;
  score: number | null;
}

// Bugün için canlı (optimistic) değeri, geçmiş günler için dailyHistory'deki
// gerçek kaydı kullanan bir "tarihe göre skor" fonksiyonu üretir.
export function makeScoreForDate(
  dailyHistory: DailyScorePoint[],
  today: string,
  liveScore: number,
  pick: (day: DailyScorePoint) => number
): (date: string) => number {
  const byDate = new Map(dailyHistory.map((h) => [h.date, pick(h)]));
  return (date: string) => (date === today ? liveScore : (byDate.get(date) ?? 0));
}

export function nonNullScores(points: ChartPoint[]): number[] {
  return points.map((p) => p.score).filter((s): s is number => s !== null);
}

export const monthNamesShort = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Bugünü 2 saatlik dilimlere böler ("00:00-02:00" gibi), her dilimin
// skoru o dilimin sonundaki kümülatif tamamlanma oranı. Henüz gelmemiş
// dilimler null (buildHourlySeries'in kendi mantığından miras).
export function buildTwoHourSeries(tasks: TimedTask[]): ChartPoint[] {
  const hourly = buildHourlySeries(tasks);
  const points: ChartPoint[] = [];
  for (let h = 2; h <= 24; h += 2) {
    points.push({ label: `${pad(h - 2)}:00-${pad(h % 24)}:00`, score: hourly[h]?.score ?? null });
  }
  return points;
}

// Son N günün skorlarını (bugün dahil) tarih etiketiyle döner.
export function buildDailySeries(scoreForDate: (iso: string) => number, days: number): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({ label: `${d.getDate()} ${monthNamesShort[d.getMonth()]}`, score: scoreForDate(toIsoDate(d)) });
  }
  return points;
}

// İçinde bulunulan takvim ayının 1'inden bugüne (veya ay bittiyse sonuna)
// kadar günlük skorlar — her zaman "1" ile başlar, henüz gelmemiş günler null.
export function buildCalendarMonthSeries(scoreForDate: (iso: string) => number): ChartPoint[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  const points: ChartPoint[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    points.push({
      label: `${day}`,
      score: day <= today ? scoreForDate(`${year}-${pad(month + 1)}-${pad(day)}`) : null,
    });
  }
  return points;
}

// İçinde bulunulan takvim yılının Ocak'ından Aralık'ına aylık ortalama
// skorlar — her zaman Ocak'la başlar. Devam eden ay sadece geçen günlerle
// hesaplanır, henüz gelmemiş aylar null.
export function buildCalendarYearSeries(scoreForDate: (iso: string) => number): ChartPoint[] {
  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  const points: ChartPoint[] = [];
  for (let month = 0; month < 12; month++) {
    if (month > currentMonth) {
      points.push({ label: monthNamesShort[month], score: null });
      continue;
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = month === currentMonth ? now.getDate() : daysInMonth;
    let sum = 0;
    for (let day = 1; day <= lastDay; day++) {
      sum += scoreForDate(`${year}-${pad(month + 1)}-${pad(day)}`);
    }
    points.push({ label: monthNamesShort[month], score: lastDay > 0 ? sum / lastDay : 0 });
  }
  return points;
}
