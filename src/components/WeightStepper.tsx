import { MinusIcon, PlusIcon } from "@/components/icons";

export function WeightStepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Ağırlığı azalt"
        className="flex h-10 w-9 items-center justify-center text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <MinusIcon width={14} height={14} />
      </button>
      <span className="w-8 text-center font-mono text-sm font-medium tabular-nums text-foreground">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Ağırlığı artır"
        className="flex h-10 w-9 items-center justify-center text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
      >
        <PlusIcon width={14} height={14} />
      </button>
    </div>
  );
}
