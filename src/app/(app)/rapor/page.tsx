"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportArchive } from "@/components/rapor/ReportArchive";
import type { ReportPeriod } from "@/lib/report";
import { calculateScore } from "@/lib/scoring";
import { useAppData } from "@/lib/supabase/app-data-context";

const periods: ReportPeriod[] = ["Günlük", "Haftalık", "Aylık"];

const generateLabels: Record<ReportPeriod, string> = {
  Günlük: "Anlık Günü Özetle",
  Haftalık: "Anlık Haftayı Özetle",
  Aylık: "Anlık Ayı Özetle",
};

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
    </span>
  );
}

export default function RaporPage() {
  const [period, setPeriod] = useState<ReportPeriod>("Günlük");
  const [loading, setLoading] = useState(false);
  const [livePreview, setLivePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { categories, tasks, dailyNote, previousDailyScore } = useAppData();

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    // Henüz gün-gün geçmiş veri biriktirmiyoruz, o yüzden Haftalık/Aylık
    // için de bugünün gerçek skorunu kullanıyoruz — uydurma geçmiş yok.
    const overallScore = calculateScore(tasks);
    const overallDelta = period === "Günlük" ? overallScore - previousDailyScore : 0;

    const categorySummaries = categories.map((category) => {
      const categoryTasks = tasks.filter((task) => task.categoryId === category.id);
      return { name: category.name, score: calculateScore(categoryTasks) };
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
      setLivePreview(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rapor oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="AI Rapor" subtitle="Dönemsel özet ve içgörüler" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1 self-start rounded-lg border border-border-soft bg-background-elevated p-1">
              {periods.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    period === p ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-accent-soft px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  Oluşturuluyor <LoadingDots />
                </>
              ) : (
                generateLabels[period]
              )}
            </button>
          </div>

          {error ? (
            <p className="text-xs text-negative">{error}</p>
          ) : (
            <p className="text-xs text-muted">
              Bu, o an ekranda göreceğin anlık bir özet — arşive kaydedilmez. Günün gerçek AI raporu
              gece otomatik oluşturulup arşive kaydedilir.
            </p>
          )}
        </div>

        {livePreview && (
          <div className="rounded-2xl border border-accent/30 bg-accent-soft/10 p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-accent">
                Anlık {period} Özeti
              </span>
              <button
                type="button"
                onClick={() => setLivePreview(null)}
                className="text-xs text-muted hover:text-foreground"
              >
                Kapat
              </button>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{livePreview}</p>
          </div>
        )}

        <ReportArchive />
      </main>
    </div>
  );
}
