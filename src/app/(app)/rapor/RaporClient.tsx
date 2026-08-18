"use client";

import Link from "next/link";
import { useState } from "react";
import { LockIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportArchive } from "@/components/rapor/ReportArchive";
import { buildCalendarMonthSeries, buildCalendarYearSeries, makeScoreForDate, nonNullScores } from "@/lib/chartSeries";
import type { ReportPeriod } from "@/lib/report";
import { average, calculateScore } from "@/lib/scoring";
import { todayIso } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";
import { useProfile } from "@/lib/supabase/profile-context";

const periods: ReportPeriod[] = ["Günlük", "Aylık", "Yıllık"];

const generateLabels: Record<ReportPeriod, string> = {
  Günlük: "Anlık Günü Özetle",
  Haftalık: "Anlık Haftayı Özetle",
  Aylık: "Anlık Ayı Özetle",
  Yıllık: "Anlık Yılı Özetle",
};

function LoadingDots() {
  const dotStyle = (delay: number): React.CSSProperties => ({
    animation: "wave-dot 1.1s ease-in-out infinite",
    animationDelay: `${delay}s`,
  });
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" style={dotStyle(0)} />
      <span className="h-1.5 w-1.5 rounded-full bg-accent" style={dotStyle(0.15)} />
      <span className="h-1.5 w-1.5 rounded-full bg-accent" style={dotStyle(0.3)} />
    </span>
  );
}

export default function RaporPage() {
  const [loadingPeriod, setLoadingPeriod] = useState<ReportPeriod | null>(null);
  const [activePeriod, setActivePeriod] = useState<ReportPeriod | null>(null);
  const [livePreview, setLivePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { categories, tasks, dailyNote, previousDailyScore, dailyHistory } = useAppData();
  const { isPro, loading: profileLoading } = useProfile();

  async function handleGenerate(period: ReportPeriod) {
    setLoadingPeriod(period);
    setError(null);

    const today = todayIso();
    const liveOverallScore = calculateScore(tasks);

    let overallScore = liveOverallScore;
    const overallDelta = period === "Günlük" ? liveOverallScore - previousDailyScore : 0;

    const overallScoreForDate = makeScoreForDate(dailyHistory, today, liveOverallScore, (d) => d.overallScore);
    if (period === "Aylık") {
      overallScore = average(nonNullScores(buildCalendarMonthSeries(overallScoreForDate)));
    } else if (period === "Yıllık") {
      overallScore = average(nonNullScores(buildCalendarYearSeries(overallScoreForDate)));
    }

    const categorySummaries = categories.map((category) => {
      const categoryTasks = tasks.filter((task) => task.categoryId === category.id);
      const liveCategoryScore = calculateScore(categoryTasks);

      if (period === "Günlük") {
        return { name: category.name, score: liveCategoryScore };
      }

      const categoryScoreForDate = makeScoreForDate(
        dailyHistory,
        today,
        liveCategoryScore,
        (d) => d.categoryScores[category.id] ?? 0
      );
      const series =
        period === "Aylık" ? buildCalendarMonthSeries(categoryScoreForDate) : buildCalendarYearSeries(categoryScoreForDate);
      return { name: category.name, score: average(nonNullScores(series)) };
    });

    const completedWeight = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.weight, 0);
    const totalWeight = tasks.reduce((sum, t) => sum + t.weight, 0);

    try {
      const response = await fetch("/api/rapor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          overallScore,
          overallDelta,
          categories: categorySummaries,
          completedWeight,
          totalWeight,
          dailyNote,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Rapor oluşturulamadı.");
      }

      // Anlık özet sadece ekranda gösterilir, arşive kaydedilmez — arşive
      // kayıt gece otomatik olarak yapılacak (bkz. CLAUDE.md).
      setActivePeriod(period);
      setLivePreview(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rapor oluşturulamadı.");
    } finally {
      setLoadingPeriod(null);
    }
  }

  const locked = !profileLoading && !isPro;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="AI Rapor" subtitle="Dönemsel özet ve içgörüler" />

      <main className="relative flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        {locked && (
          <div className="modal-in absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-background/60 px-6 py-16 backdrop-blur-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pro-soft text-pro">
              <LockIcon width={26} height={26} />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-base font-semibold text-foreground">AI Rapor bir Pro özelliği</p>
              <p className="max-w-xs text-sm text-muted">
                Anlık AI özetleri ve arşivlenmiş raporlara erişmek için Pro&apos;ya geç.
              </p>
            </div>
            <Link
              href="/pro"
              className="btn flex items-center gap-2 rounded-lg bg-pro px-5 py-2.5 text-sm font-semibold text-pro-foreground hover:-translate-y-px hover:opacity-90"
            >
              <LockIcon width={14} height={14} />
              Pro&apos;ya Geç
            </Link>
          </div>
        )}

        <div
          className={`flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5 ${locked ? "pointer-events-none blur-sm select-none" : ""}`}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleGenerate(p)}
                disabled={loadingPeriod !== null}
                className="btn card-lift flex items-center justify-center gap-2 rounded-xl border-2 border-border-soft bg-background-elevated px-4 py-4 text-sm font-semibold text-foreground hover:border-accent/50 hover:text-accent disabled:pointer-events-none disabled:opacity-50"
              >
                {loadingPeriod === p ? (
                  <>
                    Oluşturuluyor <LoadingDots />
                  </>
                ) : (
                  generateLabels[p]
                )}
              </button>
            ))}
          </div>

          {error ? (
            <p className="text-center text-xs text-negative">{error}</p>
          ) : (
            <p className="text-center text-xs text-muted">
              Bu, o an ekranda göreceğin anlık bir özet — arşive kaydedilmez. Günün gerçek AI raporu
              gece otomatik oluşturulup arşive kaydedilir.
            </p>
          )}
        </div>

        {livePreview && activePeriod && (
          <div className="modal-in rounded-2xl border border-accent/30 bg-accent-soft/10 p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-accent">
                Anlık {activePeriod} Özeti
              </span>
              <button
                type="button"
                onClick={() => setLivePreview(null)}
                className="btn rounded-md border border-negative/40 bg-negative-soft px-2.5 py-1 text-xs font-medium text-negative hover:border-negative/70 hover:bg-negative/25"
              >
                Kapat
              </button>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{livePreview}</p>
          </div>
        )}

        <div className={locked ? "pointer-events-none blur-sm select-none" : ""}>
          <ReportArchive />
        </div>
      </main>
    </div>
  );
}
