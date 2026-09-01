"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { buildDailySumSeries, setVolume, type DbWorkoutSet } from "@hayat-borsasi/shared";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const ranges = ["2 Hafta", "1 Ay"] as const;
type Range = (typeof ranges)[number];
const rangeDays: Record<Range, number> = { "2 Hafta": 14, "1 Ay": 30 };

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-elevated)] px-3 py-2 shadow-lg">
      <div className="text-xs text-[color:var(--sport-muted)]">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-[color:var(--sport-text)]">
        {Number(payload[0].value).toLocaleString("tr-TR")} kg
      </div>
    </div>
  );
}

// B-fit'teki (piyasa araştırması) "interactive progress charts" fikri —
// ScoreChart/NutritionTrendChart ile aynı Recharts + tema deseni, günlük
// toplam antrenman hacmi (kg × tekrar) gösteriyor.
export function WorkoutVolumeChart({ sets }: { sets: DbWorkoutSet[] }) {
  const [range, setRange] = useState<Range>("2 Hafta");

  const data = useMemo(() => buildDailySumSeries(sets, rangeDays[range], setVolume), [sets, range]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-[color:var(--sport-text)]">Antrenman Hacmi</h2>
          <p className="text-xs text-[color:var(--sport-muted)]">Günlük toplam kaldırılan kg (tekrar × ağırlık)</p>
        </div>
        <SegmentedControl options={ranges.map((r) => ({ value: r, label: r }))} value={range} onChange={setRange} />
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={range === "1 Ay" ? "10%" : "25%"}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-soft)", fontSize: 9 }}
              interval={range === "1 Ay" ? 4 : 1}
            />
            <YAxis hide />
            <Tooltip content={ChartTooltip} cursor={{ fill: "var(--border-soft)" }} />
            <Bar dataKey="score" fill="var(--positive)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
