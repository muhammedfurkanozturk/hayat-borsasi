import { DeltaBadge } from "./DeltaBadge";
import { Sparkline } from "./Sparkline";

export function HeroIndexCard({
  label,
  value,
  delta,
  sparklineData,
  accent = false,
}: {
  label: string;
  value: number;
  delta: number;
  sparklineData: number[];
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4 ${
        accent ? "ring-1 ring-accent/25" : ""
      }`}
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            {value.toFixed(1)}
          </span>
          <DeltaBadge delta={delta} />
        </div>
      </div>
      <Sparkline data={sparklineData} positive={delta >= 0} />
    </div>
  );
}
