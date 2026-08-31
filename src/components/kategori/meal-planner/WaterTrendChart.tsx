"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { buildDailySumSeries, type DbWaterLog } from "@hayat-borsasi/shared";

const TREND_DAYS = 14;
// 2026-08-29 (kullanıcı isteği): Y ekseni artık gizli değil, 500'er
// artan sabit tik değerleriyle gösteriliyor.
const Y_TICKS = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {Number(payload[0].value).toFixed(0)} ml
      </div>
    </div>
  );
}

// 2026-08-29 (kullanıcı isteği): Su Takibi'nin altına gün-gün ml trendi —
// kullanıcı bilinçli olarak Kalori Trendi'nden (Sütun/Çizgisel toggle'lı)
// FARKLI, ayrı bir grafik istedi: burada tek sabit stil (nokta işaretli
// çizgi), X ekseni gün, Y ekseni ml. buildDailySumSeries `{date}` alan
// gerektiren generic bir yardımcı — DbMealLog'un yanında DbWaterLog için
// de aynen kullanılabiliyor.
export function WaterTrendChart({ history, goalMl }: { history: DbWaterLog[]; goalMl: number | null }) {
  const data = buildDailySumSeries(history, TREND_DAYS, (log) => log.amount_ml);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface shadow-card p-5">
      <div>
        <h2 className="text-sm font-medium text-foreground">Su Trendi</h2>
        <p className="text-xs text-muted">Son {TREND_DAYS} gün, günlük toplam</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-soft)", fontSize: 9 }}
              interval={1}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-soft)", fontSize: 9 }}
              ticks={Y_TICKS}
              domain={[0, 5000]}
              width={44}
            />
            {goalMl != null && <ReferenceLine y={goalMl} stroke="var(--muted)" strokeDasharray="4 4" />}
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 2.5, fill: "var(--accent)", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
