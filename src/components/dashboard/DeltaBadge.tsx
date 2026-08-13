function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function DeltaBadge({
  delta,
  size = "md",
  className = "",
}: {
  delta: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const isFlat = delta === 0;
  const isPositive = delta > 0;

  const tone = isFlat
    ? "text-muted bg-white/5"
    : isPositive
      ? "text-positive bg-positive-soft"
      : "text-negative bg-negative-soft";

  const padding =
    size === "sm"
      ? "gap-1 px-1.5 py-0.5 text-[11px]"
      : size === "lg"
        ? "gap-2 px-4 py-2 text-2xl"
        : "gap-1 px-2 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-medium tabular-nums ${tone} ${padding} ${className}`}
    >
      <span aria-hidden>{isFlat ? "•" : isPositive ? "▲" : "▼"}</span>
      {formatDelta(delta)}
    </span>
  );
}
