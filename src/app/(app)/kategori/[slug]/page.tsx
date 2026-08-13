"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TaskRow } from "@/components/TaskRow";
import { DeltaBadge } from "@/components/dashboard/DeltaBadge";
import { AddTaskForm } from "@/components/kategori/AddTaskForm";
import { CategoryIconEditor } from "@/components/kategori/CategoryIconEditor";
import { CategoryNameEditor } from "@/components/kategori/CategoryNameEditor";
import { DeleteCategoryButton } from "@/components/kategori/DeleteCategoryButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { calculateScore } from "@/lib/scoring";
import { useAppData } from "@/lib/supabase/app-data-context";

export default function KategoriPage() {
  const { slug } = useParams<{ slug: string }>();

  const { categories, tasks: allTasks, previousCategoryScores, removeTask } = useAppData();

  const category = categories.find((c) => c.id === slug);
  const tasks = allTasks
    .filter((t) => t.categoryId === slug)
    .sort((a, b) => b.weight - a.weight);

  if (!category) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10">
        <p className="text-sm text-muted">Kategori bulunamadı.</p>
        <Link href="/dashboard" className="text-sm text-accent hover:underline">
          ← Dashboard&apos;a dön
        </Link>
      </div>
    );
  }

  const score = calculateScore(tasks);
  const delta = score - (previousCategoryScores[category.id] ?? 0);

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
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface px-6 py-6">
          <CategoryIconEditor categoryId={category.id} icon={category.icon} />
          <div className="flex flex-1 items-center gap-3">
            <span className="text-lg uppercase tracking-wider text-muted">{category.name} Endeksi</span>
            <DeltaBadge delta={delta} size="lg" className="ml-auto" />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
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
      </main>
    </div>
  );
}
