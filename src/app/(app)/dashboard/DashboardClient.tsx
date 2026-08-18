"use client";

import { AddCategoryTile } from "@/components/dashboard/AddCategoryTile";
import { CategoryTile } from "@/components/dashboard/CategoryTile";
import { DailyChecklist } from "@/components/dashboard/DailyChecklist";
import { PeriodIndexCard } from "@/components/dashboard/PeriodIndexCard";
import { ScoreChart } from "@/components/dashboard/ScoreChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { calculateScore } from "@/lib/scoring";
import { todayIso } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";

const YEARLY_WINDOW_DAYS = 365;

export default function Home() {
  const { categories, tasks, dailyHistory } = useAppData();

  // Kategori kutucuklarındaki rozet, dünle kıyaslanan oynak bir yüzde değil
  // — "yılın kaç gününe karşılık geldiğin" mantığında yavaşça büyüyen bir
  // katkı oranı (1 tam gün tamamlama = 365'te 1). Geçmiş günler dailyHistory'den
  // gelir, bugünün payı ise canlı (optimistic) tasks state'inden hesaplanır.
  const today = todayIso();
  const categoryTiles = categories.map((category) => {
    const categoryTasks = tasks.filter((task) => task.categoryId === category.id);
    const score = calculateScore(categoryTasks);

    const historicalSum = dailyHistory
      .filter((day) => day.date !== today)
      .reduce((sum, day) => sum + (day.categoryScores[category.id] ?? 0), 0);
    const yearlyContribution = (historicalSum + score) / YEARLY_WINDOW_DAYS;

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      score,
      delta: yearlyContribution,
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
