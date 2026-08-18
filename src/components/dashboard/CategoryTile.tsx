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
      className="card-lift flex min-w-0 flex-col items-stretch gap-2.5 rounded-xl border border-border-soft bg-surface/60 p-2.5 shadow-card hover:border-accent/30 hover:bg-surface sm:flex-row"
    >
      <div className="flex min-w-0 items-stretch gap-2.5 sm:flex-1">
        <div className="flex w-14 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-accent-soft text-accent sm:w-16">
          <AppIcon name={category.icon} width={22} height={22} />
        </div>

        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-border-soft px-3">
          <span className="truncate text-xl font-bold text-foreground sm:text-2xl" title={category.name}>
            {category.name}
          </span>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft sm:flex-1">
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
