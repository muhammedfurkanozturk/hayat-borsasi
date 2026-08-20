"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TaskRow } from "@/components/TaskRow";
import { DeltaBadge } from "@/components/dashboard/DeltaBadge";
import { AddTaskForm } from "@/components/kategori/AddTaskForm";
import { CategoryIconEditor } from "@/components/kategori/CategoryIconEditor";
import { CategoryNameEditor } from "@/components/kategori/CategoryNameEditor";
import { DeleteCategoryButton } from "@/components/kategori/DeleteCategoryButton";
import { HabitBreakCard } from "@/components/kategori/HabitBreakCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { calculateScore } from "@/lib/scoring";
import { todayIso } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";

const YEARLY_WINDOW_DAYS = 365;

export default function KategoriPage() {
  const { slug } = useParams<{ slug: string }>();

  const { categories, tasks: allTasks, dailyHistory, removeTask } = useAppData();

  const category = categories.find((c) => c.id === slug);
  const tasks = allTasks
    .filter((t) => t.categoryId === slug)
    .sort((a, b) => b.weight - a.weight);
  const habitBreakTasks = tasks.filter((t) => t.isHabitBreak);

  if (!category) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
        <p className="text-sm text-muted">Kategori bulunamadı.</p>
        <Link href="/dashboard" className="btn rounded-md text-sm text-accent hover:underline">
          ← Dashboard&apos;a dön
        </Link>
      </div>
    );
  }

  const score = calculateScore(tasks);
  // Dashboard'daki kategori kutucuklarıyla aynı mantık: dün-bugün kıyası
  // yerine yılın kaç gününe karşılık geldiğini gösteren yavaş büyüyen bir
  // katkı oranı (bkz. src/app/(app)/dashboard/page.tsx).
  const today = todayIso();
  const historicalSum = dailyHistory
    .filter((day) => day.date !== today)
    .reduce((sum, day) => sum + (day.categoryScores[category.id] ?? 0), 0);
  const delta = (historicalSum + score) / YEARLY_WINDOW_DAYS;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        right={
          <DeleteCategoryButton
            categoryId={category.id}
            categoryName={category.name}
            taskCount={tasks.length}
          />
        }
      >
        <CategoryNameEditor categoryId={category.id} name={category.name} />
      </PageHeader>

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <CategoryIconEditor categoryId={category.id} icon={category.icon} />
            <span className="truncate text-base uppercase tracking-wider text-muted sm:text-lg">
              {category.name} Endeksi
            </span>
          </div>
          <div className="flex flex-col items-start gap-1 sm:ml-auto sm:items-end">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
              Yıllık Kazanılan Endeks
            </span>
            <DeltaBadge delta={delta} size="lg" />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
          <h2 className="text-sm font-medium text-foreground">Görevler</h2>

          <ul className="flex flex-col gap-1">
            {tasks.length === 0 && (
              <li className="px-2 py-3 text-sm text-muted">Bu kategoride henüz görev yok.</li>
            )}
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskRow task={task} onDelete={() => removeTask(task.id)} allowManageSubtasks />
              </li>
            ))}
          </ul>

          <AddTaskForm categoryId={category.id} />
        </div>

        {habitBreakTasks.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface shadow-card p-5">
            <h2 className="text-sm font-medium text-foreground">Alışkanlık Takibi</h2>
            <div className="flex flex-col gap-2">
              {habitBreakTasks.map((task) => (
                <HabitBreakCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
