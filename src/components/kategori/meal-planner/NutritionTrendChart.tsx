"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { buildDailySumSeries, type DbMealLog } from "@hayat-borsasi/shared";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

// 2026-08-26 (kullanıcı bulgusu — gerçek bug): etiketler "2 Hafta"/"1 Ay"
// yazıyordu, projenin geri kalanındaki Günlük/Haftalık/Aylık/Yıllık
// diline uymuyordu — Haftalık/Aylık'a çevrildi (gün sayısı aynı kaldı,
// sadece isim). Bu, Dashboard'daki ScoreChart'tan (o zaten doğruydu) AYRI
// bir grafik — Beslenme'ye özel "Kalori Trendi".
const ranges = ["Haftalık", "Aylık"] as const;
type Range = (typeof ranges)[number];
const rangeDays: Record<Range, number> = { Haftalık: 7, Aylık: 30 };

const chartTypes = ["Sütun", "Çizgisel"] as const;
type ChartType = (typeof chartTypes)[number];

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {Number(payload[0].value).toFixed(0)} kcal
      </div>
    </div>
  );
}

// OpenNutriTracker'daki (piyasa araştırması) haftalık/aylık trend grafiği
// fikri — ScoreChart.tsx ile aynı Recharts + tema deseni, skor yerine
// günlük toplam kalori gösteriyor.
//
// 2026-08-26: iki gerçek bug düzeltildi (kullanıcı bulgusu) — (1) XAxis
// `interval={1}`/`interval={4}` kullanıyordu, bu Recharts'ta "her N
// etiketten 1'ini göster" anlamına geliyor, yani günler görsel olarak
// atlanıyordu; `interval={0}` ile tüm günler zorlanıyor, 30 günlük
// görünümde sığması için etiketler döndürülüyor. (2) Sütun/Çizgisel
// seçeneği hiç yoktu (sadece BarChart vardı) — ScoreChart.tsx'teki
// Bar/Area deseni buraya da taşındı.
export function NutritionTrendChart({ logs, goalKcal = null }: { logs: DbMealLog[]; goalKcal?: number | null }) {
  const [range, setRange] = useState<Range>("Haftalık");
  const [chartType, setChartType] = useState<ChartType>("Sütun");

  const data = useMemo(
    () => buildDailySumSeries(logs, rangeDays[range], (log) => (log.calories ?? 0) * (log.quantity ?? 1)),
    [logs, range]
  );

  const isMonthly = range === "Aylık";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-foreground">Kalori Trendi</h2>
          <p className="text-xs text-muted">Günlük toplam alım</p>
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
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "Sütun" ? (
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: isMonthly ? 16 : 0 }}
              barCategoryGap={isMonthly ? "10%" : "25%"}
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-soft)", fontSize: isMonthly ? 8 : 9 }}
                interval={0}
              />
              <YAxis hide />
              {goalKcal != null && <ReferenceLine y={goalKcal} stroke="var(--muted)" strokeDasharray="4 4" />}
              <Tooltip content={ChartTooltip} cursor={{ fill: "var(--border-soft)" }} />
              <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={goalKcal != null && (entry.score ?? 0) > goalKcal ? "var(--negative)" : "var(--nutrition-accent)"}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: isMonthly ? 16 : 0 }}>
              <defs>
                <linearGradient id="calorieFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--nutrition-accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--nutrition-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-soft)", fontSize: isMonthly ? 8 : 9 }}
                interval={0}
              />
              <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
              {goalKcal != null && <ReferenceLine y={goalKcal} stroke="var(--muted)" strokeDasharray="4 4" />}
              <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
              <Area type="monotone" dataKey="score" stroke="var(--nutrition-accent)" strokeWidth={2} fill="url(#calorieFill)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
