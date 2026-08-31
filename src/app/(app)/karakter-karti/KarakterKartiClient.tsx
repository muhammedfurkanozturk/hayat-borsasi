"use client";

import { useMemo, useState } from "react";
import { CharacterCard } from "@/components/karakter/CharacterCard";
import { CharacterRadarChart } from "@/components/karakter/CharacterRadarChart";
import { LeaderboardCard } from "@/components/karakter/LeaderboardCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { buildCalendarMonthSeries, buildCalendarYearSeries, makeScoreForDate, nonNullScores } from "@/lib/chartSeries";
import { average, calculateScore } from "@/lib/scoring";
import { todayIso } from "@/lib/supabase/daily";
import { useAppData } from "@/lib/supabase/app-data-context";
import { useProfile } from "@/lib/supabase/profile-context";

const periods = ["Günlük", "Aylık", "Yıllık"] as const;
type Period = (typeof periods)[number];

export default function KarakterKartiPage() {
  const [period, setPeriod] = useState<Period>("Günlük");
  const { categories, tasks, dailyHistory } = useAppData();
  const { displayName } = useProfile();

  const data = useMemo(() => {
    const today = todayIso();

    return categories.map((category) => {
      const categoryTasks = tasks.filter((task) => task.categoryId === category.id);
      const liveScore = calculateScore(categoryTasks);

      if (period === "Günlük") {
        return { category: category.name, score: Math.round(liveScore) };
      }

      const scoreForDate = makeScoreForDate(dailyHistory, today, liveScore, (d) => d.categoryScores[category.id] ?? 0);
      const series = period === "Aylık" ? buildCalendarMonthSeries(scoreForDate) : buildCalendarYearSeries(scoreForDate);
      return { category: category.name, score: Math.round(average(nonNullScores(series))) };
    });
  }, [period, categories, tasks, dailyHistory]);

  const overallScore = data.length > 0 ? average(data.map((d) => d.score)) : 0;
  const strongest = data.length ? data.reduce((best, d) => (d.score > best.score ? d : best), data[0]) : null;
  const weakest = data.length ? data.reduce((worst, d) => (d.score < worst.score ? d : worst), data[0]) : null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const cardStats = [
    ...(strongest ? [{ label: "En Güçlü Alan", value: `${strongest.category} · ${strongest.score}` }] : []),
    ...(weakest ? [{ label: "En Zayıf Alan", value: `${weakest.category} · ${weakest.score}` }] : []),
    { label: "Kategori Sayısı", value: String(categories.length) },
    { label: "Toplam Görev", value: String(tasks.length) },
    // Şu an tek kullanıcı olduğu için gerçek bir sıralama sistemi yok — bu
    // alan gelecekte kullanıcılar arası gerçek bir sıralamaya bağlanabilir.
    { label: "Sıralama", value: "#1" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Karakter Kartı" subtitle="Kategorilere göre otomatik hesaplanan gelişim profilin" />

      <main className="flex w-full flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        {data.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CharacterCard name={displayName} initial={initial} overallScore={overallScore} stats={cardStats} />
            <LeaderboardCard currentUser={{ name: displayName, initial, score: overallScore }} />
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
          <SegmentedControl
            className="self-start"
            options={periods.map((p) => ({ value: p, label: p }))}
            value={period}
            onChange={setPeriod}
          />

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
