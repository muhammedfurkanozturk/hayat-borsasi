"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";
import { buildDailySumSeries, calculateStreak, fillDateRange, type DbFocusSession } from "@hayat-borsasi/shared";
import { FlameIcon } from "@/components/icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const ranges = ["Haftalık", "Aylık"] as const;
type Range = (typeof ranges)[number];
const rangeDays: Record<Range, number> = { Haftalık: 7, Aylık: 30 };

const chartTypes = ["Sütun", "Çizgisel"] as const;
type ChartType = (typeof chartTypes)[number];

// `completed_at` bir timestamptz — `buildDailySumSeries`'in kendi iç
// `toIsoDate` yardımcısı YEREL (local) tarih bileşenlerini kullanıyor
// (`getFullYear/getMonth/getDate`, `new Date()` ile "şimdi"yi temel alarak).
// Bu yüzden burada da AYNI yerel tarihi üretmemiz gerekiyor — `slice(0,10)`
// gibi UTC tabanlı bir kesme kullanırsak (bu projede `todayIso()`'nun
// yaptığı gibi), gece yarısına yakın saatlerde (TR için UTC+3, 00:00-03:00
// yerel arası) UTC tarihi hâlâ "dün" derken yerel takvim zaten "bugün"
// olabiliyor — bar/seri bir gün kaymış görünüyor. Bu gerçek bir hatadır,
// test sırasında bulunup düzeltildi.
function toLocalIsoDate(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">{Number(payload[0].value).toFixed(0)} dk</div>
    </div>
  );
}

// Prodpod'daki (piyasa araştırması) "seri + ilerleme raporu" fikri —
// PomodoroTimer'ın zaten çektiği son 60 günlük `sessions`'tan türetiliyor,
// yeni bir sorgu/tablo gerekmedi. Seri hesabı `habits.ts`'teki AYNI saf
// fonksiyonu (calculateStreak/fillDateRange) kullanıyor — "bugün en az bir
// seans tamamlandı mı" sorusuna indirgeniyor, habit-break'e özel değil,
// tamamen genel bir fonksiyon.
export function FocusProgressPanel({ sessions }: { sessions: DbFocusSession[] }) {
  const [range, setRange] = useState<Range>("Haftalık");
  const [chartType, setChartType] = useState<ChartType>("Sütun");

  const streak = useMemo(() => {
    const completedDates = new Set(sessions.map((s) => toLocalIsoDate(s.completed_at)));
    const days = Array.from(completedDates).map((date) => ({ date, completed: true }));
    if (days.length === 0) return { current: 0, longest: 0 };
    const since = days.reduce((min, d) => (d.date < min ? d.date : min), days[0].date);
    const today = toLocalIsoDate(new Date().toISOString());
    const filled = fillDateRange(days, since, today);
    return calculateStreak(filled);
  }, [sessions]);

  const data = useMemo(() => {
    const rows = sessions.map((s) => ({ date: toLocalIsoDate(s.completed_at), duration_minutes: s.duration_minutes }));
    return buildDailySumSeries(rows, rangeDays[range], (r) => r.duration_minutes);
  }, [sessions, range]);

  const isMonthly = range === "Aylık";

  return (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-muted/20 bg-background-elevated p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted">İlerleme</h3>
          {(streak.current > 0 || streak.longest > 0) && (
            <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-foreground">
              <span className="flex items-center gap-1 text-accent">
                <FlameIcon width={13} height={13} />
                {streak.current} gün seri
              </span>
              <span className="text-muted">En uzun: {streak.longest} gün</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl size="sm" options={chartTypes.map((t) => ({ value: t, label: t }))} value={chartType} onChange={setChartType} />
          <SegmentedControl size="sm" options={ranges.map((r) => ({ value: r, label: r }))} value={range} onChange={setRange} />
        </div>
      </div>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "Sütun" ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: isMonthly ? 14 : 0 }} barCategoryGap={isMonthly ? "10%" : "25%"}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-soft)", fontSize: isMonthly ? 8 : 9 }} interval={0} />
              <Tooltip content={ChartTooltip} cursor={{ fill: "var(--border-soft)" }} />
              <Bar dataKey="score" radius={[3, 3, 0, 0]} fill="var(--accent)" />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: isMonthly ? 14 : 0 }}>
              <defs>
                <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-soft)", fontSize: isMonthly ? 8 : 9 }} interval={0} />
              <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
              <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2} fill="url(#focusFill)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
