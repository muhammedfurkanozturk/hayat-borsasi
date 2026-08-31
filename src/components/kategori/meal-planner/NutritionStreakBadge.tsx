import { calculateStreak, fillDateRange, todayIso } from "@hayat-borsasi/shared";
import { FlameIcon } from "@/components/icons";

const STREAK_WINDOW_DAYS = 60;

// OpenNutriTracker'daki (piyasa araştırması) günlük seri kartı fikri —
// alışkanlık bırakma modülündeki calculateStreak/fillDateRange saf
// fonksiyonları burada da aynen kullanılıyor, ek mantık yazılmadı.
export function NutritionStreakBadge({ loggedDates }: { loggedDates: string[] }) {
  const today = todayIso();
  const since = new Date();
  since.setDate(since.getDate() - STREAK_WINDOW_DAYS);
  const sinceIso = since.toISOString().slice(0, 10);

  const loggedSet = new Set(loggedDates);
  const days = fillDateRange(
    Array.from(loggedSet).map((date) => ({ date, completed: true })),
    sinceIso,
    today
  );
  const { current } = calculateStreak(days);

  if (current === 0) return null;

  return (
    <span className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-background-elevated px-2.5 py-1 text-xs font-medium text-foreground">
      <FlameIcon width={13} height={13} className="text-negative" />
      {current} günlük seri
    </span>
  );
}
