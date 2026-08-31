"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import type { DbBodyMeasurement } from "@hayat-borsasi/shared";
import { ScaleIcon } from "@/components/icons";

function ChartTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{Number(payload[0].value).toFixed(1)} kg</div>
    </div>
  );
}

// OpenNutriTracker'daki (piyasa araştırması) kilo takibi grafiği fikri.
export function BodyMeasurementPanel({
  measurements,
  onAdd,
  saving,
}: {
  measurements: DbBodyMeasurement[];
  onAdd: (weightKg: number) => void;
  saving: boolean;
}) {
  const [weight, setWeight] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(weight.replace(",", "."));
    if (!(value > 0)) return;
    onAdd(value);
    setWeight("");
  }

  const latest = measurements[measurements.length - 1];
  const chartData = measurements.map((m) => ({ label: m.date.slice(5), weight: m.weight_kg }));

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Vücut Ölçümü</h2>
          {latest && (
            <p className="text-xs text-muted">
              Son: <span className="font-mono tabular-nums text-foreground">{latest.weight_kg}</span> kg
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="kg"
            inputMode="decimal"
            className="h-9 w-20 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <button
            type="submit"
            disabled={saving || !weight.trim()}
            className="btn flex h-9 items-center gap-1.5 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
          >
            <ScaleIcon width={13} height={13} />
            Kaydet
          </button>
        </form>
      </div>

      {chartData.length > 1 && (
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-soft)", fontSize: 9 }} />
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
              <Area type="monotone" dataKey="weight" stroke="var(--accent)" strokeWidth={2} fill="url(#weightFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
