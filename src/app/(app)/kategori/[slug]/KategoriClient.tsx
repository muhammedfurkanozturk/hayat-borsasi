"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DeltaBadge } from "@/components/dashboard/DeltaBadge";
import { CategoryChecklist } from "@/components/kategori/CategoryChecklist";
import { CategoryIconEditor } from "@/components/kategori/CategoryIconEditor";
import { CategoryNameEditor } from "@/components/kategori/CategoryNameEditor";
import { DeleteCategoryButton } from "@/components/kategori/DeleteCategoryButton";
import { FinanceCalculators } from "@/components/kategori/finance/FinanceCalculators";
import { FinanceTabBar, type FinanceTab } from "@/components/kategori/finance/FinanceTabBar";
import { StockScreenerPanel } from "@/components/kategori/finance/StockScreenerPanel";
import { TaxReportPanel } from "@/components/kategori/finance/TaxReportPanel";
import { HabitTrackerPanel } from "@/components/kategori/HabitTrackerPanel";
import { MarketWatchPanel } from "@/components/kategori/MarketWatchPanel";
import { MealLogPanel } from "@/components/kategori/MealLogPanel";
import { PomodoroTimer } from "@/components/kategori/PomodoroTimer";
import { PortfolioPanel } from "@/components/kategori/PortfolioPanel";
import { RoadmapPanel } from "@/components/kategori/roadmap/RoadmapPanel";
import { TravelPanel } from "@/components/kategori/travel/TravelPanel";
import { WardrobePanel } from "@/components/kategori/WardrobePanel";
import { WorkoutLogPanel } from "@/components/kategori/WorkoutLogPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { calculateScore } from "@/lib/scoring";
import { todayIso } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";

const YEARLY_WINDOW_DAYS = 365;

export default function KategoriPage() {
  const { slug } = useParams<{ slug: string }>();
  const [financeTab, setFinanceTab] = useState<FinanceTab>("markets");

  const { categories, tasks: allTasks, dailyHistory, removeTask } = useAppData();

  const category = categories.find((c) => c.id === slug);
  // Kullanıcı bulgusu (2026-08-28): bu liste (kategori sayfasındaki
  // "Görevler"/Beslenme'nin Checklist sekmesi) ağırlığa göre OTOMATİK
  // sıralanmamalı — kullanıcı hangi sırayla oluşturduysa o sırada kalmalı,
  // sadece yukarı/aşağı butonlarıyla (bkz. TaskRow.tsx, moveTaskUp/
  // moveTaskDown) elle değiştirilebilmeli. Bu yüzden `sortOrder`'a göre
  // sıralıyoruz — `weight`'e göre DEĞİL. sortOrder değişmediği sürece
  // (görev işaretlenince/ağırlığı değişince) liste hiç zıplamıyor, çünkü
  // o alanlar sortOrder'ı etkilemiyor. Dashboard'daki (DailyChecklist.tsx)
  // ağırlığa göre canlı sıralama BİLEREK dokunulmadı, orası ayrı kalıyor.
  const tasks = allTasks
    .filter((t) => t.categoryId === slug)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  // Spor, Kötü Alışkanlıklar, Yol Haritam ve Beslenme modüllerinin kendi
  // özel checklist'i var (Beslenme'de "Checklist" artık kendi sekmesinin
  // içinde, bkz. MealLogPanel) — bunlarda ayrıca genel "Görevler" listesi
  // gösterilmiyor.
  const showGenericTasks =
    category?.moduleType !== "sport" &&
    category?.moduleType !== "habit" &&
    category?.moduleType !== "digital" &&
    category?.moduleType !== "nutrition" &&
    category?.moduleType !== "travel";

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
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-6">
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

        {showGenericTasks && (
          <CategoryChecklist categoryId={category.id} tasks={tasks} onDeleteTask={removeTask} />
        )}

        {category.moduleType === "focus" && <PomodoroTimer categoryId={category.id} />}
        {category.moduleType === "finance" && (
          <div className="flex flex-col gap-4">
            <FinanceTabBar value={financeTab} onChange={setFinanceTab} />
            {financeTab === "markets" && <MarketWatchPanel />}
            {financeTab === "portfolio" && <PortfolioPanel categoryId={category.id} />}
            {financeTab === "screener" && <StockScreenerPanel />}
            {financeTab === "tools" && (
              <div className="flex flex-col gap-4">
                <TaxReportPanel categoryId={category.id} />
                <FinanceCalculators />
              </div>
            )}
          </div>
        )}
        {category.moduleType === "nutrition" && (
          <MealLogPanel categoryId={category.id} tasks={tasks} onDeleteTask={removeTask} />
        )}
        {category.moduleType === "style" && <WardrobePanel categoryId={category.id} />}
        {category.moduleType === "digital" && <RoadmapPanel categoryId={category.id} />}
        {category.moduleType === "sport" && <WorkoutLogPanel categoryId={category.id} />}
        {category.moduleType === "habit" && <HabitTrackerPanel categoryId={category.id} />}
        {category.moduleType === "travel" && <TravelPanel categoryId={category.id} />}
      </main>
    </div>
  );
}
