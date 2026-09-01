"use client";

import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { buildExerciseProgressSeries, type DbWorkoutSet } from "@hayat-borsasi/shared";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const ranges = ["1 Ay", "3 Ay", "1 Yıl"] as const;
type Range = (typeof ranges)[number];
const rangeDays: Record<Range, number> = { "1 Ay": 30, "3 Ay": 90, "1 Yıl": 365 };

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-elevated)] px-3 py-2 shadow-lg">
      <div className="text-xs text-[color:var(--sport-muted)]">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-[color:var(--sport-text)]">{payload[0].value} kg</div>
    </div>
  );
}

// MuscleWiki'nin (piyasa araştırması) "zaman içindeki performans" fikri —
// seçilen hareketin, o gün kaldırdığı en ağır seti gün gün çizen bir
// çizgi grafik. Diğer trend grafiklerimizden (ScoreChart/NutritionTrendChart)
// FARKLI olarak boş günleri 0 ile doldurmuyor — sadece gerçekten
// antrenman yapılan günler nokta olarak görünüyor.
export function ExerciseProgressChart({ sets, exerciseNames }: { sets: DbWorkoutSet[]; exerciseNames: string[] }) {
  const [selected, setSelected] = useState(exerciseNames[0] ?? "");
  const [range, setRange] = useState<Range>("3 Ay");

  const data = useMemo(
    () => (selected ? buildExerciseProgressSeries(sets, selected, rangeDays[range]) : []),
    [sets, selected, range]
  );

  if (exerciseNames.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
        <h2 className="text-sm font-medium text-[color:var(--sport-text)]">İlerleme Grafiği</h2>
        <p className="text-xs text-[color:var(--sport-muted)]">Ağırlıklı bir set kaydettiğinde burada hareketinin zaman içindeki ilerlemesini görebileceksin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-[color:var(--sport-text)]">İlerleme Grafiği</h2>
          <p className="text-xs text-[color:var(--sport-muted)]">Seçilen hareketin o günkü en ağır seti</p>
        </div>
        <SegmentedControl options={ranges.map((r) => ({ value: r, label: r }))} value={range} onChange={setRange} size="sm" />
      </div>

      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="h-9 w-fit rounded-lg border-2 border-[color:var(--sport-muted)]/25 bg-[color:var(--sport-elevated)] px-3 text-sm text-[color:var(--sport-text)] outline-none focus:border-[color:var(--sport-accent)]/50"
      >
        {exerciseNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {data.length === 0 ? (
        <p className="py-6 text-center text-xs text-[color:var(--sport-muted)]">Bu aralıkta &quot;{selected}&quot; için ağırlıklı set kaydı yok.</p>
      ) : (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-soft)", fontSize: 9 }} />
              <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="var(--sport-accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--sport-accent)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
