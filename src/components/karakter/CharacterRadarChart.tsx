"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

export interface RadarDatum {
  category: string;
  score: number;
}

function RadarTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <div className="text-xs text-foreground">{point.payload.category}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-accent">
        {Number(point.value).toFixed(0)}
      </div>
    </div>
  );
}

export function CharacterRadarChart({ data }: { data: RadarDatum[] }) {
  // Kategori eksenlerinin ilki (Girişimcilik) her zaman 90°'de (en üstte)
  // başlıyor. Sayısal ekseni de aynı açıya koyarsak "100" yazısı o kategori
  // etiketiyle çakışır — iki eksen arasındaki boşluğa kaydırıyoruz.
  const radiusAxisAngle = data.length > 0 ? 90 - 180 / data.length : 90;

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis type="category" dataKey="category" tick={{ fill: "var(--foreground)", fontSize: 12 }} />
          <PolarRadiusAxis
            type="number"
            angle={radiusAxisAngle}
            domain={[0, 100]}
            tick={{ fill: "var(--muted)", fontSize: 10 }}
            axisLine={false}
          />
          <Tooltip content={RadarTooltip} />
          <Radar
            name="Skor"
            dataKey="score"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
