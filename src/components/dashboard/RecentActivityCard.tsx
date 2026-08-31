"use client";

import { AppIcon, type IconKey } from "@/components/icons";
import { formatRelativeTime } from "@/lib/format";
import { useAppData } from "@/lib/supabase/app-data-context";

// Genel UI tasarım referansındaki "Recent Activity" satır desenini
// (ikon+başlık+açıklama+zaman) çeviriyor — ama referansın kart-başına-renk
// ve uydurma örnek verisi yerine, DESIGN.md'nin .ledger-row deseniyle tek
// vurgu rengi (accent-soft ikon çipi) ve gerçek veriyle (bugün işaretlenen
// görevler, daily_task_logs.completed_at) (2026-08-28).
export function RecentActivityCard() {
  const { tasks, categories } = useAppData();

  const items = tasks
    .filter((task) => task.completed && task.completedAt)
    .sort((a, b) => new Date(b.completedAt as string).getTime() - new Date(a.completedAt as string).getTime())
    .slice(0, 8)
    .map((task) => {
      const category = categories.find((c) => c.id === task.categoryId);
      return {
        id: task.id,
        title: task.title,
        categoryName: category?.name ?? "",
        icon: (category?.icon ?? "target") as IconKey,
        completedAt: task.completedAt as string,
      };
    });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-sm font-medium text-foreground">Bugünün Aktiviteleri</h2>
        <p className="text-xs text-muted">Bugün işaretlediğin görevler, en yeniden eskiye.</p>
      </div>

      {items.length === 0 ? (
        <p className="px-1 py-2 text-sm text-muted">Bugün henüz işaretlenen bir görev yok.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} className="ledger-row flex items-center gap-3 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <AppIcon name={item.icon} width={16} height={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted">{item.categoryName}</p>
              </div>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {formatRelativeTime(item.completedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
