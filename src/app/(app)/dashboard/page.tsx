"use client";

import { AddCategoryTile } from "@/components/dashboard/AddCategoryTile";
import { CategoryTile } from "@/components/dashboard/CategoryTile";
import { DailyChecklist } from "@/components/dashboard/DailyChecklist";
import { PeriodIndexCard } from "@/components/dashboard/PeriodIndexCard";
import { ScoreChart } from "@/components/dashboard/ScoreChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { calculateScore } from "@/lib/scoring";
import { useAppData } from "@/lib/supabase/app-data-context";

export default function Home() {
  const { categories, tasks, previousCategoryScores } = useAppData();

  const categoryTiles = categories.map((category) => {
    const categoryTasks = tasks.filter((task) => task.categoryId === category.id);
    const score = calculateScore(categoryTasks);
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      score,
      delta: score - (previousCategoryScores[category.id] ?? 0),
    };
  });

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Dashboard" subtitle="Bugünkü genel görünüm" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <PeriodIndexCard />

        {categories.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-border-soft p-8 text-center">
            <p className="text-base font-medium text-foreground">
              Henüz hiç kategorin yok. İlk kategorini oluştur.
            </p>
            <AddCategoryTile emptyState />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {categoryTiles.map((category) => (
              <CategoryTile key={category.id} category={category} />
            ))}
            <AddCategoryTile />
          </div>
        )}

        <ScoreChart />

        <DailyChecklist />
      </main>
    </div>
  );
}
