import { CategoryIcon } from "@/components/icons";
import type { CategoryScore } from "@/lib/mock/dashboard-data";
import { DeltaBadge } from "./DeltaBadge";

export function CategoryTile({ category }: { category: CategoryScore }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface/60 px-4 py-3 transition-colors hover:border-border hover:bg-surface">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <CategoryIcon category={category.key} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-foreground">{category.name}</span>
        <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
          {category.score}
        </span>
      </div>
      <DeltaBadge delta={category.delta} size="sm" />
    </div>
  );
}
