"use client";

import { useMemo, useState } from "react";
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS, type DbExercise, type EquipmentType, type ExerciseDifficulty, type MuscleGroup } from "@hayat-borsasi/shared";
import { DifficultyDots } from "./DifficultyDots";
import { EQUIPMENT_ENTRIES, MUSCLE_ENTRIES, MultiSelect } from "./MultiSelect";

const DIFFICULTY_ENTRIES = Object.entries(DIFFICULTY_LABELS) as [ExerciseDifficulty, string][];

// MuscleWiki'nin 1.700+ egzersizlik, video/talimatlı, kas+ekipman filtreli
// kütüphanesinden (piyasa araştırması) ilham — bizimki 86 egzersizlik,
// video yerine yazılı talimatlı bir başlangıç seti (exerciseLibrary.ts).
// Bu panel, o kütüphaneyi arama+filtre ile tarayan bağımsız bir görünüm —
// Bölüm 2'deki (Antrenman Oluştur → Manuel) hızlı arama kutusundan farklı
// olarak tüm kütüphaneyi kas grubu/ekipman/zorluk filtreleriyle keşfetmeye
// odaklanıyor.
export function ExerciseLibraryPanel({
  exercises,
  onAddLibraryExercise,
}: {
  exercises: DbExercise[];
  onAddLibraryExercise: (name: string, muscle: MuscleGroup) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  function toggleMuscle(m: MuscleGroup) {
    setMuscleGroups((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }
  function toggleEquipment(e: EquipmentType) {
    setEquipment((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }
  function toggleDifficulty(d: ExerciseDifficulty) {
    setDifficulty((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  const existingNames = useMemo(() => new Set(exercises.map((e) => e.name.toLowerCase())), [exercises]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (muscleGroups.length > 0 && !muscleGroups.includes(e.muscleGroup)) return false;
      if (equipment.length > 0 && !equipment.includes(e.equipment)) return false;
      if (difficulty.length > 0 && !difficulty.includes(e.difficulty)) return false;
      return true;
    });
  }, [query, muscleGroups, equipment, difficulty]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
      <div>
        <h2 className="text-sm font-medium text-[color:var(--sport-text)]">Egzersiz Kütüphanesi</h2>
        <p className="text-xs text-[color:var(--sport-muted)]">
          {EXERCISE_LIBRARY.length} egzersiz — kas grubu, ekipman ve zorluğa göre filtrele.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Egzersiz ara..."
        className="h-10 rounded-lg border-2 border-[color:var(--sport-muted)]/25 bg-[color:var(--sport-elevated)] px-3 text-sm text-[color:var(--sport-text)] outline-none placeholder:text-[color:var(--sport-muted)] focus:border-[color:var(--sport-accent)]/50"
      />

      <div>
        <p className="mb-1.5 text-xs font-medium text-[color:var(--sport-muted)]">Kas Grubu</p>
        <MultiSelect options={MUSCLE_ENTRIES} selected={muscleGroups} onToggle={toggleMuscle} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-[color:var(--sport-muted)]">Ekipman</p>
        <MultiSelect options={EQUIPMENT_ENTRIES} selected={equipment} onToggle={toggleEquipment} />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-[color:var(--sport-muted)]">Zorluk</p>
        <MultiSelect options={DIFFICULTY_ENTRIES} selected={difficulty} onToggle={toggleDifficulty} />
      </div>

      <div className="flex flex-col gap-1.5 border-t border-[color:var(--sport-border)] pt-3">
        <p className="text-xs text-[color:var(--sport-muted)]">{results.length} sonuç</p>
        {results.map((ex) => {
          const alreadyAdded = existingNames.has(ex.name.toLowerCase());
          return (
            <div key={ex.id} className="flex items-center justify-between gap-3 rounded-lg border-2 border-[color:var(--sport-muted)]/20 px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-black italic uppercase tracking-tight text-[color:var(--sport-text)]">{ex.name}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-[color:var(--sport-muted)]">
                  {MUSCLE_GROUP_LABELS[ex.muscleGroup]} · {EQUIPMENT_LABELS[ex.equipment]}
                  <DifficultyDots difficulty={ex.difficulty} />
                </span>
                <span className="text-xs text-[color:var(--sport-muted)]">{ex.instructions}</span>
              </div>
              <button
                type="button"
                disabled={alreadyAdded || addingId === ex.id}
                onClick={async () => {
                  setAddingId(ex.id);
                  await onAddLibraryExercise(ex.name, ex.muscleGroup);
                  setAddingId(null);
                }}
                className="btn h-8 shrink-0 rounded-lg bg-[color:var(--sport-accent)]/15 px-3 text-xs font-medium text-[color:var(--sport-accent)] hover:bg-[color:var(--sport-accent)]/25 disabled:pointer-events-none disabled:opacity-50"
              >
                {alreadyAdded ? "Eklendi" : addingId === ex.id ? "Ekleniyor..." : "Hareketlerime Ekle"}
              </button>
            </div>
          );
        })}
        {results.length === 0 && <p className="text-xs text-[color:var(--sport-muted)]">Bu filtrelere uyan egzersiz bulunamadı.</p>}
      </div>
    </div>
  );
}
