import { CategoryTile } from "@/components/dashboard/CategoryTile";
import { DailyChecklist } from "@/components/dashboard/DailyChecklist";
import { HeroIndexCard } from "@/components/dashboard/HeroIndexCard";
import { ScoreChart } from "@/components/dashboard/ScoreChart";
import { TopBar } from "@/components/dashboard/TopBar";
import { categoryScores, dailyIndex, trendSeries, weeklyIndex } from "@/lib/mock/dashboard-data";

export default function Home() {
  const sparklineData = trendSeries.map((point) => point.score);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-3 sm:flex-row">
          <HeroIndexCard
            label={dailyIndex.label}
            value={dailyIndex.value}
            delta={dailyIndex.delta}
            sparklineData={sparklineData.slice(-7)}
            accent
          />
          <HeroIndexCard
            label={weeklyIndex.label}
            value={weeklyIndex.value}
            delta={weeklyIndex.delta}
            sparklineData={sparklineData}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categoryScores.map((category) => (
            <CategoryTile key={category.key} category={category} />
          ))}
        </div>

        <ScoreChart />

        <DailyChecklist />
      </main>
    </div>
  );
}
