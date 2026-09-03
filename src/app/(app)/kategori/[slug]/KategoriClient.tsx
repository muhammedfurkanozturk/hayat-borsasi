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

  // "eksikler" envanteri madde 9 — okunur kategori URL'leri. Hem yeni
  // (slug) hem eski/geçiş-döneminde-kalmış (id/UUID) linkler çalışsın diye
  // ikisi de deneniyor.
  const category = categories.find((c) => c.slug === slug) ?? categories.find((c) => c.id === slug);
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
    .filter((t) => t.categoryId === category?.id)
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

        {showGenericTasks && category.moduleType === "focus" && (
          // Kategori Bazlı Tasarım Farklılaştırma — Bölüm 5 (Duolingo dili,
          // 2026-09-02). Duolingo'nun sabit TEK vurgu yerine alt-özelliğe
          // göre değişen doygun renk fikri — Checklist turuncu, Pomodoro
          // (PomodoroTimer.tsx'in kendi scope'u) mavi, İlerleme raporu mor.
          // Zemin BEYAZ'a zorlanıyor (site temasından bağımsız — Freeletics/
          // Robinhood'un koyuya zorlanmasının tersi yönü, aynı "kategori
          // kendi kimliğini taşır" ilkesi).
          <div
            className="rounded-lg bg-[color:var(--background)] p-4 sm:p-5"
            style={
              {
                "--background": "#ffffff",
                "--background-elevated": "#f7f7f7",
                "--surface": "#ffffff",
                "--surface-hover": "#f0f0f0",
                "--border": "#e5e5e5",
                "--border-soft": "#eeeeee",
                "--foreground": "#3c3c3c",
                "--muted": "#777777",
                "--muted-soft": "#afafaf",
                "--accent": "#ff9600",
                "--accent-soft": "#ff960026",
                "--accent-foreground": "#ffffff",
                // "eksikler" envanteri madde 5 — PomodoroTimer.tsx'teki AYNI
                // Nunito uygulaması, Checklist'in kendi beyaz/turuncu
                // scope'unda da tutarlı olsun diye.
                fontFamily: "var(--font-nunito)",
              } as React.CSSProperties
            }
          >
            <CategoryChecklist categoryId={category.id} tasks={tasks} onDeleteTask={removeTask} />
          </div>
        )}
        {showGenericTasks && category.moduleType !== "focus" && (
          <CategoryChecklist categoryId={category.id} tasks={tasks} onDeleteTask={removeTask} />
        )}

        {category.moduleType === "focus" && <PomodoroTimer categoryId={category.id} />}
        {category.moduleType === "finance" && (
          // Kategori Bazlı Tasarım Farklılaştırma — Bölüm 4 (Robinhood dili,
          // 2026-09-02). Site'nin HER rengi (`--background`, `--surface`,
          // `--accent`, `--positive`, `--negative` vb.) globals.css'te
          // `--color-X: var(--X)` zinciriyle Tailwind'e bağlı — bu zincir
          // CSS custom property'lerin iç içe `var()` referanslarını KULLANIM
          // noktasında yeniden çözmesi sayesinde, burada sadece kök `--X`
          // değişkenlerini yerel olarak ezmek YETİYOR: PortfolioPanel/
          // MarketWatchPanel/finance/* içindeki TÜM `bg-surface`/
          // `text-foreground`/`bg-accent`/`text-positive` vb. class'lar tek
          // dosya değiştirmeden otomatik olarak Robinhood'un saf siyah +
          // neon yeşil paletine dönüşüyor (Spor/Stil bölümlerindeki
          // dosya-dosya script taşımaya göre çok daha az kod dokunuşu).
          <div
            className="flex flex-col gap-4 rounded-lg bg-[color:var(--background)] p-4 sm:p-5"
            style={
              {
                "--background": "#000000",
                "--background-elevated": "#0a0a0a",
                "--surface": "#0a0a0a",
                "--surface-hover": "#141414",
                "--border": "rgba(255,255,255,0.12)",
                "--border-soft": "rgba(255,255,255,0.08)",
                "--foreground": "#ffffff",
                "--muted": "#8e8e93",
                "--muted-soft": "#636366",
                "--accent": "#00e676",
                "--accent-soft": "#00e67626",
                "--accent-foreground": "#000000",
                "--positive": "#00e676",
                "--positive-soft": "#00e67626",
                "--negative": "#ff3b30",
                "--negative-soft": "#ff3b3026",
              } as React.CSSProperties
            }
          >
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
