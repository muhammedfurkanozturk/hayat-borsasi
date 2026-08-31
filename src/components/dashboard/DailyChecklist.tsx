"use client";

import { useState } from "react";
import { AppIcon } from "@/components/icons";
import { TaskRow } from "@/components/TaskRow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatTodayLong } from "@/lib/format";
import { useAppData, type TaskFrequency } from "@/lib/supabase/app-data-context";

const periodOptions: { value: TaskFrequency; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

export function DailyChecklist({ attached = false }: { attached?: boolean }) {
  const { tasks, categories } = useAppData();
  const [period, setPeriod] = useState<TaskFrequency>("daily");

  const periodTasks = tasks
    .filter((task) => task.frequency === period)
    .sort((a, b) => b.weight - a.weight);

  const completedWeight = periodTasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.weight, 0);
  const totalWeight = periodTasks.reduce((sum, task) => sum + task.weight, 0);

  // Dashboard'da görevleri kategorilerine göre gruplayıp her kategoriyi kendi
  // alanında gösteriyoruz — Kategori sayfasında bu gruplama yok, sadece burada.
  const groups = categories
    .map((category) => ({
      category,
      tasks: periodTasks.filter((task) => task.categoryId === category.id),
    }))
    .filter((group) => group.tasks.length > 0);

  return (
    <div
      // ActivityRingsCard'ın altına doğrudan bitişik render edildiğinde
      // (bkz. DashboardClient.tsx) üst kenar/köşe/gölgeyi kaldırıp tek bir
      // kartın alt yarısıymış gibi görünmesini sağlıyor (2026-08-26).
      className={`flex flex-1 flex-col border-border bg-surface p-5 ${
        attached
          ? "rounded-b-lg border-x border-b border-t border-t-border-soft shadow-card"
          : "rounded-lg border shadow-card"
      }`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Görevler</h2>
          <p className="text-xs text-muted" suppressHydrationWarning>
            {formatTodayLong()}
          </p>
        </div>

        <SegmentedControl
          className="self-start sm:self-auto"
          options={periodOptions}
          value={period}
          onChange={setPeriod}
        />

        <span className="font-mono text-xs tabular-nums text-muted">
          {completedWeight}/{totalWeight} ağırlık
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="px-2 py-6 text-sm text-foreground">
          Bu periyotta henüz görevin yok. Bir kategoriye girip görev ekleyerek başla.
        </p>
      ) : (
        // DESIGN.md — "defter" deseni: her kategori artık kendi kutusuna
        // hapsedilmiyor, tek akan bir listede ince ayırıcı çizgilerle
        // (.ledger-row) bölünüyor. Kategori kutu-içinde-kutu tekrarının
        // yerine geçiyor.
        <div className="flex flex-col">
          {groups.map(({ category, tasks: groupTasks }, i) => (
            <div key={category.id} className={i > 0 ? "mt-3 border-t border-border-soft pt-3" : ""}>
              <div className="mb-1 flex items-center gap-2 px-1">
                <AppIcon name={category.icon} width={14} height={14} className="text-accent" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{category.name}</span>
              </div>
              <ul className="flex flex-col">
                {groupTasks.map((task) => (
                  <li key={task.id} className="ledger-row">
                    <TaskRow task={task} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
