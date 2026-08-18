export function CheckMark({ checked, size = 20 }: { checked: boolean; size?: number }) {
  return (
    <span
      style={{
        height: size,
        width: size,
        transitionProperty: "color, background-color, border-color, transform",
        transitionDuration: "var(--dur-base)",
        transitionTimingFunction: "var(--ease-snap)",
      }}
      className={`flex shrink-0 items-center justify-center rounded-md border-2 ${
        checked
          ? "check-pop border-positive bg-positive-soft text-positive"
          : "border-muted bg-background-elevated text-transparent hover:scale-105 hover:border-foreground"
      }`}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        style={{
          strokeDasharray: 24,
          strokeDashoffset: checked ? 0 : 24,
          transition: `stroke-dashoffset var(--dur-slow) var(--ease-snap)`,
        }}
      >
        <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
