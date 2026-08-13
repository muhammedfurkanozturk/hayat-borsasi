import Link from "next/link";
import { AppIcon, type IconKey } from "@/components/icons";
import { DeltaBadge } from "./DeltaBadge";

export interface CategoryTileData {
  id: string;
  name: string;
  icon: IconKey;
  score: number;
  delta: number;
}

export function CategoryTile({ category }: { category: CategoryTileData }) {
  return (
    <Link
      href={`/kategori/${category.id}`}
      className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border-soft bg-surface/60 px-4 py-3 transition-colors hover:border-border hover:bg-surface"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <AppIcon name={category.icon} width={14} height={14} />
        </div>
        <span className="truncate text-sm text-foreground" title={category.name}>
          {category.name}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
          {Math.round(category.score)}
        </span>
        <DeltaBadge delta={category.delta} size="sm" />
      </div>
    </Link>
  );
}
