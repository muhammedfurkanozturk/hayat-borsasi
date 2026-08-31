"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import {
  buildCalendarMonthSeries,
  buildCalendarYearSeries,
  buildDailySeries,
  buildTwoHourSeries,
  makeScoreForDate,
} from "@/lib/chartSeries";
import { calculateScore } from "@/lib/scoring";
import { todayIso } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const ranges = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;
type Range = (typeof ranges)[number];

const chartTypes = ["Sütun", "Çizgisel"] as const;
type ChartType = (typeof chartTypes)[number];

const rangeSubtitle: Record<Range, string> = {
  Günlük: "Bugün 2 saatlik dilimlerle görev tamamlama seyri",
  Haftalık: "Son 7 günün seyri",
  Aylık: "Bu ayın 1'inden bugüne, gün gün",
  Yıllık: "Bu yılın Ocak'ından itibaren, ay ay ortalama",
};

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="rounded-lg border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {Number(payload[0].value).toFixed(1)}
      </div>
    </div>
  );
}

export function ScoreChart() {
  const [range, setRange] = useState<Range>("Günlük");
  const [chartType, setChartType] = useState<ChartType>("Sütun");
  const { tasks, dailyHistory } = useAppData();

  // Günlük sekmesi bugünü 2 saatlik dilimlerle (12 kutu) gösterir (canlı).
  // Haftalık/Aylık/Yıllık ise dailyHistory'deki gerçek geçmiş günlere
  // dayanır — bugünün payı için her zaman canlı tasks state'inden
  // hesaplanan güncel skor kullanılır. Aylık her zaman ayın 1'inden,
  // Yıllık her zaman Ocak'tan başlar (takvime hizalı, kaydırmalı pencere değil).
  const data = useMemo(() => {
    if (range === "Günlük") return buildTwoHourSeries(tasks);

    const today = todayIso();
    const todayScore = calculateScore(tasks);
    const scoreForDate = makeScoreForDate(dailyHistory, today, todayScore, (d) => d.overallScore);

    if (range === "Haftalık") return buildDailySeries(scoreForDate, 7);
    if (range === "Aylık") return buildCalendarMonthSeries(scoreForDate);
    return buildCalendarYearSeries(scoreForDate);
  }, [range, tasks, dailyHistory]);

  const tickFontSize = range === "Aylık" ? 9 : 11;
  const barGap = range === "Aylık" ? "6%" : "20%";

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Skor Trendi</h2>
          <p className="text-xs text-muted">{rangeSubtitle[range]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            options={chartTypes.map((t) => ({ value: t, label: t }))}
            value={chartType}
            onChange={setChartType}
          />
          <SegmentedControl options={ranges.map((r) => ({ value: r, label: r }))} value={range} onChange={setRange} />
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "Sütun" ? (
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={barGap}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-soft)", fontSize: tickFontSize }}
                interval={0}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={ChartTooltip} cursor={{ fill: "var(--border-soft)" }} />
              <Bar dataKey="score" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-soft)", fontSize: tickFontSize }}
                interval={0}
              />
              <YAxis hide domain={["dataMin - 8", "dataMax + 8"]} />
              <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#scoreFill)"
                connectNulls={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
