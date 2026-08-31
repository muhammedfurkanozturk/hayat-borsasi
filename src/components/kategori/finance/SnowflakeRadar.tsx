"use client";

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { SnowflakeAxis } from "@/lib/finance/snowflake";

export function SnowflakeRadar({ axes }: { axes: SnowflakeAxis[] }) {
  const data = axes.map((a) => ({ label: a.label, score: a.score }));
  const missing = axes.filter((a) => !a.available);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="70%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis type="category" dataKey="label" tick={{ fill: "var(--muted)", fontSize: 10 }} />
            <PolarRadiusAxis type="number" domain={[0, 5]} tick={false} axisLine={false} tickCount={6} />
            <Radar name="Skor" dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.35} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center text-[10px] leading-snug text-muted">
        Basitleştirilmiş, sadece gerçek finansal verilere (P/E, temettü verimi, ROE, cari oran vb.) dayalı bir özet — analist
        adil değer/DCF tahmini içermez.
      </p>
      {missing.length > 0 && (
        <p className="text-center text-[10px] text-muted">Veri yok: {missing.map((m) => m.label).join(", ")}</p>
      )}
    </div>
  );
}
