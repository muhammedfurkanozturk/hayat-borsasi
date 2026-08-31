"use client";

import { useMemo, useState } from "react";
import {
  calculateMuscleVolume,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  EXERCISE_LIBRARY,
  MUSCLE_GROUP_LABELS,
  type DbExercise,
  type DbWorkoutSet,
  type MuscleGroup,
} from "@hayat-borsasi/shared";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MuscleMap } from "./MuscleMap";

const VIEW_OPTIONS = [
  { value: "front", label: "Ön" },
  { value: "back", label: "Arka" },
] as const;

// MuscleWiki'den (piyasa araştırması) ilham alınan interaktif kas haritası
// paneli — bir kasa tıklayınca o kası hedefleyen kütüphane egzersizlerini
// listeler, kullanıcının SON 7 GÜNÜNÜN set hacmini (sadece primary_muscle
// etiketlenmiş kendi hareketlerinden) ısı haritası olarak gösterir.
export function MuscleMapPanel({
  exercises,
  sets,
  onTagMuscle,
}: {
  exercises: DbExercise[];
  sets: DbWorkoutSet[];
  onTagMuscle: (exerciseId: string, muscle: MuscleGroup) => void;
}) {
  const [view, setView] = useState<"front" | "back">("front");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const recentSets = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceIso = since.toISOString().slice(0, 10);
    return sets.filter((s) => s.date >= sinceIso);
  }, [sets]);

  const volumeByMuscle = useMemo(
    () => calculateMuscleVolume(recentSets, exercises) as Partial<Record<MuscleGroup, number>>,
    [recentSets, exercises]
  );

  const libraryMatches = selectedMuscle ? EXERCISE_LIBRARY.filter((e) => e.muscleGroup === selectedMuscle) : [];
  const untaggedExercises = exercises.filter((e) => !e.primary_muscle);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Kas Haritası</h2>
          <p className="text-xs text-muted">Bir kasa tıkla, o kası hedefleyen egzersizleri gör. Renk = son 7 günkü hacmin.</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} size="sm" />
        </div>
      </div>

      <div className="mx-auto h-80 w-56">
        <MuscleMap view={view} volumeByMuscle={volumeByMuscle} selectedMuscle={selectedMuscle} onSelectMuscle={setSelectedMuscle} />
      </div>

      {selectedMuscle && (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-accent/25 bg-accent-soft/20 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">{MUSCLE_GROUP_LABELS[selectedMuscle]} Egzersizleri</h3>
            <button type="button" onClick={() => setSelectedMuscle(null)} className="btn text-xs text-muted hover:text-foreground">
              Kapat
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {libraryMatches.map((ex) => (
              <div key={ex.id} className="flex flex-col gap-0.5 rounded-lg bg-background-elevated px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{ex.name}</span>
                  <span className="shrink-0 rounded-full bg-muted/10 px-2 py-0.5 text-[10px] text-muted">
                    {EQUIPMENT_LABELS[ex.equipment]} · {DIFFICULTY_LABELS[ex.difficulty]}
                  </span>
                </div>
                <p className="text-xs text-muted">{ex.instructions}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {untaggedExercises.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border-soft pt-3">
          <p className="text-xs text-muted">
            Isı haritasının hareketlerini görebilmesi için kendi hareketlerini bir kas grubuna etiketle (opsiyonel):
          </p>
          <div className="flex flex-col gap-1.5">
            {untaggedExercises.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between gap-2 rounded-lg border-2 border-muted/20 px-3 py-1.5">
                <span className="text-xs text-foreground">{ex.name}</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) onTagMuscle(ex.id, e.target.value as MuscleGroup);
                  }}
                  className="h-7 rounded-md border border-muted/30 bg-background-elevated px-1.5 text-[11px] text-foreground outline-none"
                >
                  <option value="" disabled>
                    Kas grubu seç
                  </option>
                  {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
