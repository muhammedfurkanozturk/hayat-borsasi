"use client";

import { useMemo, useState } from "react";
import { calculateMuscleSetCounts, MUSCLE_GROUP_LABELS, type DbExercise, type DbWorkoutSet, type MuscleGroup } from "@hayat-borsasi/shared";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const ranges = ["Haftalık", "Aylık"] as const;
type Range = (typeof ranges)[number];
const rangeDays: Record<Range, number> = { Haftalık: 7, Aylık: 30 };

// MuscleWiki'nin (piyasa araştırması) "kas bazlı hacim dağılımı" fikri —
// Kas Haritası'ndaki (Bölüm 1) aynı primary_muscle etiketleme köprüsünü
// kullanıyor, sadece görsel farklı: ısı haritası yerine sıralı bar listesi,
// haftalık/aylık seçenekli. Etiketlenmemiş hareketler burada da katkı
// yapmıyor (aynı savunmacı davranış).
export function MuscleVolumeDistribution({ sets, exercises }: { sets: DbWorkoutSet[]; exercises: DbExercise[] }) {
  const [range, setRange] = useState<Range>("Haftalık");

  const rows = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - rangeDays[range]);
    const sinceIso = since.toISOString().slice(0, 10);
    const windowSets = sets.filter((s) => s.date >= sinceIso);
    const counts = calculateMuscleSetCounts(windowSets, exercises);
    const max = Math.max(1, ...counts.values());
    return Array.from(counts.entries())
      .map(([muscle, count]) => ({ muscle: muscle as MuscleGroup, count, percent: (count / max) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [sets, exercises, range]);

  const hasTaggedExercises = exercises.some((e) => e.primary_muscle);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-[color:var(--sport-text)]">Kas Bazlı Hacim Dağılımı</h2>
          <p className="text-xs text-[color:var(--sport-muted)]">Hangi kas grubuna ne kadar set yapıldı</p>
        </div>
        <SegmentedControl options={ranges.map((r) => ({ value: r, label: r }))} value={range} onChange={setRange} size="sm" />
      </div>

      {!hasTaggedExercises && (
        <p className="text-xs text-[color:var(--sport-muted)]">
          Hareketlerini bir kas grubuna etiketlemedin — bu dağılımı görmek için &quot;Kas Haritası&quot; sekmesinden hareketlerini
          etiketle.
        </p>
      )}

      {hasTaggedExercises && rows.length === 0 && (
        <p className="text-xs text-[color:var(--sport-muted)]">Bu aralıkta etiketlenmiş bir hareket için kayıtlı set yok.</p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.muscle} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-[color:var(--sport-text)]">{MUSCLE_GROUP_LABELS[row.muscle] ?? row.muscle}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--sport-border)]">
              <div className="h-full rounded-full bg-[color:var(--sport-accent)]" style={{ width: `${row.percent}%` }} />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-[color:var(--sport-muted)]">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
