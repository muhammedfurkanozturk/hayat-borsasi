"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { trendSeries } from "@/lib/mock/dashboard-data";

const ranges = ["7G", "30G", "90G"] as const;

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
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
  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Skor Trendi</h2>
          <p className="text-xs text-muted">Genel gelişim endeksinin zaman içindeki seyri</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border-soft bg-background-elevated p-1">
          {ranges.map((range, i) => (
            <span
              key={range}
              className={`rounded-md px-2.5 py-1 font-mono text-xs tabular-nums ${
                i === 0 ? "bg-accent-soft text-accent" : "text-muted"
              }`}
            >
              {range}
            </span>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-soft)", fontSize: 11 }}
              interval={2}
            />
            <YAxis hide domain={["dataMin - 8", "dataMax + 8"]} />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#scoreFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
