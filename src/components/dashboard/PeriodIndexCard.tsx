"use client";

import { useMemo, useState } from "react";
import { calculateScore } from "@/lib/scoring";
import { useAppData } from "@/lib/supabase/app-data-context";
import { DeltaBadge } from "./DeltaBadge";
import { Sparkline } from "./Sparkline";

const periods = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;
type Period = (typeof periods)[number];

export function PeriodIndexCard() {
  const [period, setPeriod] = useState<Period>("Günlük");
  const { tasks, previousDailyScore } = useAppData();

  // Henüz gün-gün geçmiş veri biriktirmiyoruz (Supabase'e yeni geçtik), o
  // yüzden Haftalık/Aylık/Yıllık için uydurma bir eğilim göstermek yerine
  // bugünün gerçek skorunu gösteriyoruz — geçmiş veri birikince gerçek
  // haftalık/aylık ortalamalarla değiştireceğiz.
  const { value, delta, sparklineData } = useMemo(() => {
    const score = calculateScore(tasks);
    return {
      value: score,
      delta: period === "Günlük" ? score - previousDailyScore : 0,
      sparklineData: [score, score, score, score, score, score, score],
    };
  }, [period, tasks, previousDailyScore]);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 ring-1 ring-accent/25 sm:flex-row sm:items-center sm:gap-6">
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
        <Sparkline data={sparklineData} positive={delta >= 0} className="h-full w-full" />
      </div>
    </div>
  );
}
