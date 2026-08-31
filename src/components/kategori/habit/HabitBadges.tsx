import { HABIT_MILESTONES_DAYS, unlockedMilestones } from "@hayat-borsasi/shared";
import { TrophyIcon } from "@/components/icons";

const MILESTONE_LABELS: Record<number, string> = {
  1: "1 Gün",
  3: "3 Gün",
  7: "1 Hafta",
  14: "2 Hafta",
  30: "1 Ay",
  60: "2 Ay",
  90: "3 Ay",
  180: "6 Ay",
  365: "1 Yıl",
};

// Quitzilla'daki (piyasa araştırması) otomatik "trophy" kilometre taşları —
// en uzun seriye göre türetiliyor, DB'de saklanmıyor; bir kere kırılan
// rekor nükseme sonrası da kilitli kalmaz.
export function HabitBadges({ longestStreak }: { longestStreak: number }) {
  const unlocked = new Set(unlockedMilestones(longestStreak));

  return (
    <div className="flex flex-wrap gap-1.5">
      {HABIT_MILESTONES_DAYS.map((d) => (
        <span
          key={d}
          className={`flex items-center gap-1 rounded-full border-2 px-2 py-1 text-[10px] font-medium ${
            unlocked.has(d) ? "border-pro/50 bg-pro-soft text-pro" : "border-muted/20 text-muted opacity-50"
          }`}
        >
          <TrophyIcon width={10} height={10} />
          {MILESTONE_LABELS[d]}
        </span>
      ))}
    </div>
  );
}
