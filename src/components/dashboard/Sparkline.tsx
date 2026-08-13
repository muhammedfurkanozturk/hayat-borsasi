export function Sparkline({
  data,
  positive,
  width = 300,
  height = 90,
  className,
}: {
  data: number[];
  positive: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = height * 0.12;
  const drawableHeight = height - padding * 2;
  const step = width / (data.length - 1);

  const points = data
    .map((value, i) => {
      const x = i * step;
      const y = padding + drawableHeight - ((value - min) / range) * drawableHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const color = positive ? "var(--positive)" : "var(--negative)";
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className ?? "h-8 w-24"}
    >
      <polyline points={areaPoints} fill={color} opacity={0.08} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
