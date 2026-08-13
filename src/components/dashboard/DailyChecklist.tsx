"use client";

import { useState } from "react";
import { AppIcon } from "@/components/icons";
import { TaskRow } from "@/components/TaskRow";
import { formatTodayLong } from "@/lib/format";
import { useAppData, type TaskFrequency } from "@/lib/supabase/app-data-context";

const periodOptions: { value: TaskFrequency; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

export function DailyChecklist() {
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
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Görevler</h2>
          <p className="text-xs text-muted" suppressHydrationWarning>
            {formatTodayLong()}
          </p>
        </div>

        <div className="flex items-center gap-1 self-start rounded-lg border border-border-soft bg-background-elevated p-1 sm:self-auto">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                period === option.value ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="font-mono text-xs tabular-nums text-muted">
          {completedWeight}/{totalWeight} ağırlık
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="px-2 py-6 text-sm text-foreground">
          Bu periyotta henüz görevin yok. Bir kategoriye girip görev ekleyerek başla.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(({ category, tasks: groupTasks }) => (
            <div key={category.id} className="rounded-xl border-2 border-muted/30 bg-background-elevated p-3">
              <div className="mb-2 flex items-center gap-2 px-1">
                <AppIcon name={category.icon} width={16} height={16} className="text-accent" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted">{category.name}</span>
              </div>
              <ul className="flex flex-col gap-1">
                {groupTasks.map((task) => (
                  <li key={task.id}>
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
