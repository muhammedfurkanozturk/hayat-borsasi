import { TrendUpIcon } from "@/components/icons";

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-border-soft px-6 py-4 sm:px-10">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <TrendUpIcon width={16} height={16} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">Hayat Borsası</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden font-mono text-xs tabular-nums text-muted sm:inline">29 Temmuz 2026</span>
        <div className="h-8 w-8 rounded-full border border-border-soft bg-surface" />
      </div>
    </header>
  );
}
