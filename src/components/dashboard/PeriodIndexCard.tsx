"use client";

import { useMemo, useState } from "react";
import {
  buildCalendarMonthSeries,
  buildCalendarYearSeries,
  buildDailySeries,
  buildTwoHourSeries,
} from "@/lib/chartSeries";
import { average, calculateScore } from "@/lib/scoring";
import { daysAgoIso, todayIso } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";
import { DeltaBadge } from "./DeltaBadge";
import { Sparkline } from "./Sparkline";

const periods = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;
type Period = (typeof periods)[number];

const YEARLY_WINDOW_DAYS = 365;

function nonNullScores(points: { score: number | null }[]): number[] {
  return points.map((p) => p.score).filter((s): s is number => s !== null);
}

export function PeriodIndexCard() {
  const [period, setPeriod] = useState<Period>("Günlük");
  const { tasks, dailyHistory } = useAppData();

  // Her periyot, Skor Trendi grafiğiyle aynı takvime-hizalı seri
  // fonksiyonlarını kullanır (bkz. src/lib/chartSeries.ts) — böylece
  // buradaki büyük sayı ile aşağıdaki grafik hep aynı veriyi gösterir.
  const { value, delta, sparklineData } = useMemo(() => {
    const today = todayIso();
    const todayScore = calculateScore(tasks);
    const historyByDate = new Map(dailyHistory.map((h) => [h.date, h.overallScore]));
    const scoreForDate = (date: string) => (date === today ? todayScore : (historyByDate.get(date) ?? 0));

    if (period === "Günlük") {
      const sparklineData = nonNullScores(buildTwoHourSeries(tasks));
      // Kategori kutucuklarıyla aynı mantık: dün-bugün kıyası yerine, yılın
      // kaç gününe karşılık geldiğini gösteren yavaş büyüyen bir katkı oranı.
      const historicalSum = dailyHistory
        .filter((day) => day.date !== today)
        .reduce((sum, day) => sum + day.overallScore, 0);
      const delta = (historicalSum + todayScore) / YEARLY_WINDOW_DAYS;
      return { value: todayScore, delta, sparklineData: sparklineData.length ? sparklineData : [todayScore] };
    }

    if (period === "Haftalık") {
      const current = buildDailySeries(scoreForDate, 7).map((p) => p.score ?? 0);
      const previous: number[] = [];
      for (let i = 0; i < current.length; i++) previous.push(scoreForDate(daysAgoIso(current.length + i)));
      return { value: average(current), delta: average(current) - average(previous), sparklineData: current };
    }

    if (period === "Aylık") {
      const current = nonNullScores(buildCalendarMonthSeries(scoreForDate));
      const previous: number[] = [];
      for (let i = 0; i < current.length; i++) previous.push(scoreForDate(daysAgoIso(current.length + i)));
      return {
        value: average(current),
        delta: average(current) - average(previous),
        sparklineData: current.length ? current : [0],
      };
    }

    // Yıllık — bir önceki takvim yılıyla kıyaslayacak kadar geçmiş veri yok,
    // nötr bırakıyoruz.
    const current = nonNullScores(buildCalendarYearSeries(scoreForDate));
    return { value: average(current), delta: 0, sparklineData: current.length ? current : [0] };
  }, [period, tasks, dailyHistory]);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface shadow-card p-5 ring-1 ring-accent/25 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex flex-col gap-4 sm:w-[35%] sm:shrink-0">
        <div className="flex items-center gap-1 self-start rounded-lg border border-border-soft bg-background-elevated p-1">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                period === p ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            {period} Endeks
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
              {value.toFixed(1)}
            </span>
            <DeltaBadge delta={delta} />
          </div>
        </div>
      </div>

      <div className="hidden self-stretch border-l border-border-soft sm:block" />

      <div className="h-28 min-w-0 flex-1 sm:h-32">
        <Sparkline
          data={sparklineData}
          positive={sparklineData[sparklineData.length - 1] >= sparklineData[0]}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
