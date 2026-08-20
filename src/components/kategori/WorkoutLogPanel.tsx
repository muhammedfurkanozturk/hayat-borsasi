"use client";

import { useEffect, useMemo, useState } from "react";
import { daysAgoIso, deleteWorkoutSet, fetchWorkoutSets, insertWorkoutSet, todayIso, type DbWorkoutSet } from "@hayat-borsasi/shared";
import { TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

const HISTORY_WINDOW_DAYS = 30;

export function WorkoutLogPanel({ categoryId }: { categoryId: string }) {
  const [sets, setSets] = useState<DbWorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseName, setExerciseName] = useState("");
  const [reps, setReps] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const rows = await fetchWorkoutSets(supabase, categoryId, daysAgoIso(HISTORY_WINDOW_DAYS));
    setSets(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const today = todayIso();
  const todaySets = useMemo(() => sets.filter((s) => s.date === today), [sets, today]);
  const nextSetNumberFor = (exercise: string) =>
    todaySets.filter((s) => s.exercise_name.toLowerCase() === exercise.trim().toLowerCase()).length + 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const repsNum = Number(reps);
    if (!exerciseName.trim() || !(repsNum > 0)) return;

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertWorkoutSet(supabase, user.id, categoryId, {
        exerciseName: exerciseName.trim(),
        setNumber: nextSetNumberFor(exerciseName),
        reps: repsNum,
        weightKg: weightKg ? Number(weightKg) : null,
        date: today,
      });
      setSets((prev) => [created, ...prev]);
      setReps("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await deleteWorkoutSet(supabase, id);
    setSets((prev) => prev.filter((s) => s.id !== id));
  }

  const todayByExercise = useMemo(() => {
    const map = new Map<string, DbWorkoutSet[]>();
    for (const s of todaySets) {
      const arr = map.get(s.exercise_name) ?? [];
      arr.push(s);
      map.set(s.exercise_name, arr);
    }
    return map;
  }, [todaySets]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Antrenman Kaydı</h2>
      <p className="text-xs text-muted">
        Set/tekrar/ağırlık takibi. Kamera tabanlı vücut/ilerleme analizi henüz yok, ayrı bir modül
        olarak eklenecek.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border-2 border-muted/30 p-3 sm:flex-row sm:items-center">
        <input
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          placeholder="Egzersiz (örn. Bench Press)"
          className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        <input
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Tekrar"
          inputMode="numeric"
          className="h-10 w-24 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        <input
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="kg (opsiyonel)"
          inputMode="decimal"
          className="h-10 w-32 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn h-10 shrink-0 rounded-lg bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Ekleniyor..." : "Set Ekle"}
        </button>
      </form>

      {!loading && todayByExercise.size > 0 && (
        <div className="flex flex-col gap-3">
          {Array.from(todayByExercise.entries()).map(([exercise, exerciseSets]) => (
            <div key={exercise} className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">{exercise}</span>
              <div className="flex flex-wrap gap-1.5">
                {exerciseSets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s) => (
                    <span
                      key={s.id}
                      className="group flex items-center gap-1.5 rounded-lg border-2 border-muted/20 bg-background-elevated px-2.5 py-1.5 font-mono text-xs tabular-nums text-foreground"
                    >
                      #{s.set_number} — {s.reps} tekrar{s.weight_kg != null ? ` × ${s.weight_kg}kg` : ""}
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        aria-label="Seti sil"
                        className="btn text-muted hover:text-negative"
                      >
                        <TrashIcon width={12} height={12} />
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
