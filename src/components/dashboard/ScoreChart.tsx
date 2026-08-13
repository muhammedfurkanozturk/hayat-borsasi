"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { buildHourlySeries, calculateScore } from "@/lib/scoring";
import { useAppData } from "@/lib/supabase/app-data-context";

const ranges = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;
type Range = (typeof ranges)[number];

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
  const [range, setRange] = useState<Range>("Aylık");
  const { tasks } = useAppData();

  // Henüz gün-gün geçmiş veri biriktirmiyoruz (Supabase'e yeni geçtik), o
  // yüzden Haftalık/Aylık/Yıllık için uydurma dalgalı bir grafik göstermek
  // yerine sadece bugünün gerçek skorunu tek nokta olarak gösteriyoruz —
  // geçmiş veri birikince gerçek çoklu-gün serisiyle değiştireceğiz.
  const data = useMemo(() => {
    if (range === "Günlük") return buildHourlySeries(tasks);
    return [{ label: "Bugün", score: calculateScore(tasks) }];
  }, [range, tasks]);

  const tickInterval = range === "Günlük" ? 2 : 0;

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Skor Trendi</h2>
          <p className="text-xs text-muted">
            {range === "Günlük"
              ? "Bugün saat saat görev tamamlama seyri"
              : "Genel gelişim endeksinin zaman içindeki seyri"}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border-soft bg-background-elevated p-1">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                range === r ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
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
              tick={{ fill: "var(--muted-soft)", fontSize: 11 }}
              interval={tickInterval}
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
        </ResponsiveContainer>
      </div>
    </div>
  );
}
