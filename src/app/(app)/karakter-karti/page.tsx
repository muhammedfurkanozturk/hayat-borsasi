"use client";

import { useMemo, useState } from "react";
import { CharacterRadarChart } from "@/components/karakter/CharacterRadarChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { dailySeries, monthlySeries } from "@/lib/mock/dashboard-data";
import { average, calculateScore } from "@/lib/scoring";
import { useAppData } from "@/lib/supabase/app-data-context";

const periods = ["Günlük", "Aylık", "Yıllık"] as const;
type Period = (typeof periods)[number];

export default function KarakterKartiPage() {
  const [period, setPeriod] = useState<Period>("Günlük");
  const { categories, tasks } = useAppData();

  const data = useMemo(() => {
    // Kategori bazlı gün-gün/ay-ay geçmiş henüz yok (Supabase'e kadar), o
    // yüzden Aylık/Yıllık için genel endeksin aynı dönemdeki ortalama
    // eğilimini her kategorinin bugünkü skoruna oranlı olarak uyguluyoruz.
    const liveOverall = calculateScore(tasks);
    const monthlyOverall = average(dailySeries.map((p) => p.score));
    const yearlyOverall = average(monthlySeries.map((p) => p.score));

    const rawRatio =
      period === "Aylık" ? monthlyOverall / liveOverall : period === "Yıllık" ? yearlyOverall / liveOverall : 1;
    const ratio = liveOverall < 5 || !Number.isFinite(rawRatio) ? 1 : Math.min(1.5, Math.max(0.5, rawRatio));

    return categories.map((category) => {
      const categoryTasks = tasks.filter((task) => task.categoryId === category.id);
      const liveScore = calculateScore(categoryTasks);
      const score = period === "Günlük" ? liveScore : Math.min(100, Math.max(0, liveScore * ratio));
      return { category: category.name, score: Math.round(score) };
    });
  }, [period, categories, tasks]);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Karakter Kartı" subtitle="Kategorilere göre otomatik hesaplanan gelişim profilin" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
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

          {data.length < 3 ? (
            <p className="px-2 py-10 text-center text-sm text-muted">
              Bir karakter kartı görebilmek için en az 3 kategoriye ihtiyacın var. Dashboard&apos;dan
              kategori ekleyebilirsin.
            </p>
          ) : (
            <CharacterRadarChart data={data} />
          )}
        </div>
      </main>
    </div>
  );
}
