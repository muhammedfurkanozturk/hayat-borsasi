"use client";

import { useDroppable } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { ClockIcon, TrashIcon } from "@/components/icons";
import type { DbWorkoutSet, LastPerformance } from "@hayat-borsasi/shared";

const REST_SECONDS = 90;
// Tahmini seans süresi için kaba bir varsayım — set başına ortalama
// çalışma süresi (~40sn) + dinlenme (REST_SECONDS). Kesin bir ölçüm değil,
// sadece "yaklaşık ne kadar sürdü" hissi vermek için (MuscleWiki'deki
// antrenman özeti kartından ilham).
const SECONDS_PER_SET_WORK = 40;

// Genel pazar standardı (piyasa araştırması, Strong/Hevy) dinlenme süresi
// zamanlayıcısı — DB'ye hiç yazmıyor, tamamen istemci taraflı bir sayaç.
function RestTimer({ startedAt }: { startedAt: number }) {
  const [remaining, setRemaining] = useState(REST_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, REST_SECONDS - Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (remaining === 0) return null;

  return (
    <span className="flex w-fit items-center gap-1.5 rounded-lg border-2 border-accent/40 bg-accent-soft/30 px-2 py-1 font-mono text-xs tabular-nums text-accent">
      <ClockIcon width={12} height={12} />
      Dinlen: {remaining}sn
    </span>
  );
}

// 2026-08-29 (progressive overload autofill — MuscleWiki'nin bilinen
// eksikliği, bkz. CLAUDE.md): reps/weightKg state'i, `pendingDefaults`'tan
// LAZY INITIALIZER ile önceden dolduruluyor — bir useEffect'le state'i
// prop değişince senkronize etmek yerine, DayColumn bu component'i
// `key={pendingExerciseName}` ile render ediyor, isim değişince React
// component'i REMOUNT ediyor ve useState initializer'ı yeniden çalışıyor.
// Bu, React'in resmi önerdiği "prop değişince state resetleme" deseni —
// ekstra bir effect/senkronizasyon kodu gerekmiyor.
function PendingEntryForm({
  exerciseName,
  defaults,
  onSubmit,
  onCancel,
}: {
  exerciseName: string;
  defaults: LastPerformance | null;
  onSubmit: (reps: number, setsCount: number, weightKg: number | null) => void;
  onCancel: () => void;
}) {
  const [reps, setReps] = useState(defaults ? String(defaults.reps) : "");
  const [setsCount, setSetsCount] = useState("3");
  const [weightKg, setWeightKg] = useState(defaults?.weightKg != null ? String(defaults.weightKg) : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const repsNum = Number(reps);
    const setsNum = Number(setsCount);
    if (!(repsNum > 0) || !(setsNum > 0)) return;
    onSubmit(repsNum, setsNum, weightKg ? Number(weightKg) : null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 rounded-lg border-2 border-accent/40 bg-accent-soft/30 p-2">
      <span className="text-xs font-medium text-foreground">{exerciseName}</span>
      {defaults && (
        <span className="text-[10px] text-muted">
          Önceki seans: {defaults.reps} tekrar × {defaults.weightKg != null ? `${defaults.weightKg}kg` : "-"} (otomatik dolduruldu,
          değiştirebilirsin)
        </span>
      )}
      <div className="flex gap-1.5">
        <input
          autoFocus
          value={setsCount}
          onChange={(e) => setSetsCount(e.target.value)}
          placeholder="Set"
          inputMode="numeric"
          className="h-8 w-14 rounded-md border-2 border-muted/30 bg-surface px-2 text-xs text-foreground outline-none focus:border-accent/50"
        />
        <input
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Tekrar"
          inputMode="numeric"
          className="h-8 w-16 rounded-md border-2 border-muted/30 bg-surface px-2 text-xs text-foreground outline-none focus:border-accent/50"
        />
        <input
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="kg"
          inputMode="decimal"
          className="h-8 w-16 rounded-md border-2 border-muted/30 bg-surface px-2 text-xs text-foreground outline-none focus:border-accent/50"
        />
      </div>
      <div className="flex gap-1.5">
        <button type="submit" className="btn h-7 flex-1 rounded-md bg-accent px-2 text-xs font-semibold text-accent-foreground hover:opacity-90">
          Kaydet
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn h-7 rounded-md border-2 border-muted/30 px-2 text-xs text-muted hover:text-foreground"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

export function DayColumn({
  date,
  dayLabel,
  isToday,
  sets,
  pendingExerciseName,
  pendingDefaults,
  onSubmitEntry,
  onCancelEntry,
  onDeleteSet,
}: {
  date: string;
  dayLabel: string;
  isToday: boolean;
  sets: DbWorkoutSet[];
  pendingExerciseName: string | null;
  // 2026-08-29 (MuscleWiki'nin bilinen eksikliği — bkz. CLAUDE.md): bir
  // önceki seansta bu hareket için ne yapıldığı, girişi otomatik dolduruyor.
  pendingDefaults: LastPerformance | null;
  onSubmitEntry: (reps: number, setsCount: number, weightKg: number | null) => void;
  onCancelEntry: () => void;
  onDeleteSet: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);

  const byExercise = new Map<string, DbWorkoutSet[]>();
  for (const s of sets) {
    const arr = byExercise.get(s.exercise_name) ?? [];
    arr.push(s);
    byExercise.set(s.exercise_name, arr);
  }

  const totalSets = sets.length;
  const estimatedMinutes = Math.round((totalSets * (REST_SECONDS + SECONDS_PER_SET_WORK)) / 60);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-lg border-2 p-3 transition-colors ${
        isOver ? "border-accent/60 bg-accent-soft/40" : isToday ? "border-accent/30" : "border-muted/25"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{dayLabel}</span>
        <span className="font-mono text-[11px] text-muted">{date}</span>
      </div>

      {/* Antrenman özeti — MuscleWiki'deki (piyasa araştırması) egzersiz
          sayısı/set sayısı/tahmini süre kartı fikri, kendi mevcut
          günlük-sütun yapımıza tek satırlık bir özet olarak eklendi. */}
      {byExercise.size > 0 && (
        <p className="font-mono text-[11px] tabular-nums text-muted">
          {byExercise.size} egzersiz · {totalSets} set · ~{estimatedMinutes} dk
        </p>
      )}

      {restStartedAt != null && <RestTimer startedAt={restStartedAt} />}

      {byExercise.size === 0 && !pendingExerciseName && (
        <p className="py-1 text-xs text-muted">Buraya bir hareket kartı sürükle.</p>
      )}

      {Array.from(byExercise.entries()).map(([exerciseName, exerciseSets]) => (
        <div key={exerciseName} className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">{exerciseName}</span>
          <div className="flex flex-wrap gap-1.5">
            {exerciseSets
              .sort((a, b) => a.set_number - b.set_number)
              .map((s) => (
                <span
                  key={s.id}
                  className="group flex items-center gap-1.5 rounded-lg border-2 border-muted/20 bg-background-elevated px-2 py-1 font-mono text-[11px] tabular-nums text-foreground"
                >
                  #{s.set_number} — {s.reps}×{s.weight_kg != null ? `${s.weight_kg}kg` : "-"}
                  <button
                    type="button"
                    onClick={() => onDeleteSet(s.id)}
                    aria-label="Seti sil"
                    className="btn text-muted hover:text-negative"
                  >
                    <TrashIcon width={10} height={10} />
                  </button>
                </span>
              ))}
          </div>
        </div>
      ))}

      {pendingExerciseName && (
        <PendingEntryForm
          key={pendingExerciseName}
          exerciseName={pendingExerciseName}
          defaults={pendingDefaults}
          onCancel={onCancelEntry}
          onSubmit={(reps, setsCount, weightKg) => {
            onSubmitEntry(reps, setsCount, weightKg);
            setRestStartedAt(Date.now());
          }}
        />
      )}
    </div>
  );
}
