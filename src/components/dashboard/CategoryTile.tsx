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
      className="flex min-w-0 items-stretch gap-2.5 rounded-xl border border-border-soft bg-surface/60 p-2.5 shadow-card transition-colors hover:border-border hover:bg-surface"
    >
      <div className="flex min-w-0 flex-1 items-stretch gap-2.5">
        <div className="flex w-16 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-accent-soft text-accent">
          <AppIcon name={category.icon} width={24} height={24} />
        </div>

        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-border-soft px-3">
          <span className="truncate text-2xl font-bold text-foreground" title={category.name}>
            {category.name}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col divide-y divide-border-soft rounded-lg border border-border-soft">
        <div className="flex flex-1 items-center justify-between gap-2 px-4 py-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Günlük Kazanılan Puan
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {Math.round(category.score)}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-between gap-2 px-4 py-4">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Yıllık Kazanılan Endeks
          </span>
          <DeltaBadge delta={category.delta} size="lg" />
        </div>
      </div>
    </Link>
  );
}
