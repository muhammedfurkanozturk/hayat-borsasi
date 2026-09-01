"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import {
  calculateLastDoneDates,
  calculateLastPerformance,
  calculatePersonalRecords,
  deleteExercise,
  deleteWorkoutSet,
  deleteWorkoutTemplate,
  EXERCISE_LIBRARY,
  fetchBodyMeasurements,
  fetchExercises,
  fetchWorkoutSets,
  fetchWorkoutTemplateItems,
  fetchWorkoutTemplates,
  insertBodyMeasurement,
  insertDefaultExercises,
  insertExercise,
  insertWorkoutSet,
  insertWorkoutTemplate,
  todayIso,
  updateExerciseMuscle,
  type DbBodyMeasurement,
  type DbExercise,
  type DbWorkoutSet,
  type DbWorkoutTemplate,
  type DbWorkoutTemplateItem,
  type MuscleGroup,
  type QuickWorkoutPlan,
  type WeeklyWorkoutPlan,
} from "@hayat-borsasi/shared";
import { PlusIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { BodyMeasurementPanel } from "./sport/BodyMeasurementPanel";
import { DayColumn } from "./sport/DayColumn";
import { ExerciseCard } from "./sport/ExerciseCard";
import { ExerciseLibraryPanel } from "./sport/ExerciseLibraryPanel";
import { ExerciseProgressChart } from "./sport/ExerciseProgressChart";
import { MuscleMapPanel } from "./sport/MuscleMapPanel";
import { MuscleVolumeDistribution } from "./sport/MuscleVolumeDistribution";
import { OneRepMaxCalculator } from "./sport/OneRepMaxCalculator";
import { SportTabBar, type SportTab } from "./sport/SportTabBar";
import { WorkoutBuilderPanel } from "./sport/WorkoutBuilderPanel";
import { WorkoutTemplates } from "./sport/WorkoutTemplates";
import { WorkoutVolumeChart } from "./sport/WorkoutVolumeChart";

const DAY_LABELS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const HISTORY_WINDOW_DAYS = 365;
const MEASUREMENT_WINDOW_DAYS = 90;
const DEFAULT_TEMPLATE_SETS = 3;
const DEFAULT_TEMPLATE_REPS = 10;

function getCurrentWeekDates(): { date: string; label: string; isToday: boolean }[] {
  const today = new Date();
  const dayIndex = today.getDay(); // 0=Pazar..6=Cumartesi
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const todayStr = todayIso();

  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { date: iso, label, isToday: iso === todayStr };
  });
}

export function WorkoutLogPanel({ categoryId }: { categoryId: string }) {
  const [tab, setTab] = useState<SportTab>("workout");
  const [exercises, setExercises] = useState<DbExercise[]>([]);
  const [sets, setSets] = useState<DbWorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);

  const [newExerciseName, setNewExerciseName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);

  const [pendingDrop, setPendingDrop] = useState<{ exerciseId: string; date: string } | null>(null);

  const [templates, setTemplates] = useState<DbWorkoutTemplate[]>([]);
  const [templateItems, setTemplateItems] = useState<DbWorkoutTemplateItem[]>([]);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [newRecordExercise, setNewRecordExercise] = useState<string | null>(null);

  const [measurements, setMeasurements] = useState<DbBodyMeasurement[]>([]);
  const [savingMeasurement, setSavingMeasurement] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const weekDates = getCurrentWeekDates();

  async function load() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let exerciseRows = await fetchExercises(supabase, categoryId);
    if (exerciseRows.length === 0 && user) {
      exerciseRows = await insertDefaultExercises(supabase, user.id, categoryId);
    }
    setExercises(exerciseRows);

    // Sadece bu hafta değil, PR/"son yapıldı"/hacim trendi için 1 yıllık
    // geçmiş çekiliyor — DayColumn'lar bu haftanın tarihlerine göre
    // istemci tarafında filtreleniyor (aşağıda weekSets).
    const historySince = new Date();
    historySince.setDate(historySince.getDate() - HISTORY_WINDOW_DAYS);
    const setRows = await fetchWorkoutSets(supabase, categoryId, historySince.toISOString().slice(0, 10));
    setSets(setRows);

    // Şablonlar/vücut ölçümü, ilgili migration henüz uygulanmadıysa
    // (workout_templates/body_measurements tabloları yoksa) hata
    // fırlatabilir — bu, hareket kütüphanesi/haftalık takvim gibi ana
    // özelliği kilitlemesin diye ayrı try/catch'te.
    try {
      const templateRows = await fetchWorkoutTemplates(supabase, categoryId);
      setTemplates(templateRows);
      const itemRows = await fetchWorkoutTemplateItems(
        supabase,
        templateRows.map((t) => t.id)
      );
      setTemplateItems(itemRows);
    } catch (err) {
      console.error("Antrenman şablonları yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    try {
      const measurementSince = new Date();
      measurementSince.setDate(measurementSince.getDate() - MEASUREMENT_WINDOW_DAYS);
      const measurementRows = await fetchBodyMeasurements(supabase, categoryId, measurementSince.toISOString().slice(0, 10));
      setMeasurements(measurementRows);
    } catch (err) {
      console.error("Vücut ölçümleri yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    setAddingExercise(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertExercise(supabase, user.id, categoryId, newExerciseName.trim(), exercises.length);
      setExercises((prev) => [...prev, created]);
    }
    setNewExerciseName("");
    setAddingExercise(false);
  }

  async function handleDeleteExercise(exercise: DbExercise) {
    setExercises((prev) => prev.filter((ex) => ex.id !== exercise.id));
    setPendingDrop((prev) => (prev?.exerciseId === exercise.id ? null : prev));
    const supabase = createClient();
    await deleteExercise(supabase, exercise.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    setPendingDrop({ exerciseId: String(active.id), date: String(over.id) });
  }

  async function handleSubmitEntry(reps: number, setsCount: number, weightKg: number | null) {
    if (!pendingDrop) return;
    const exercise = exercises.find((ex) => ex.id === pendingDrop.exerciseId);
    if (!exercise) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const existingForDay = sets.filter(
        (s) => s.date === pendingDrop.date && s.exercise_name.toLowerCase() === exercise.name.toLowerCase()
      ).length;
      const previousBest = calculatePersonalRecords(sets).get(exercise.name)?.weightKg ?? 0;
      const created: DbWorkoutSet[] = [];
      for (let i = 0; i < setsCount; i += 1) {
        created.push(
          await insertWorkoutSet(supabase, user.id, categoryId, {
            exerciseName: exercise.name,
            setNumber: existingForDay + i + 1,
            reps,
            weightKg,
            date: pendingDrop.date,
          })
        );
      }
      setSets((prev) => [...created, ...prev]);
      if (weightKg != null && weightKg > previousBest) {
        setNewRecordExercise(exercise.name);
        setTimeout(() => setNewRecordExercise(null), 4000);
      }
    }
    setPendingDrop(null);
  }

  async function handleCreateTemplate(name: string, exerciseNames: string[]) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { template, items } = await insertWorkoutTemplate(supabase, user.id, categoryId, name, exerciseNames, templates.length);
    setTemplates((prev) => [...prev, template]);
    setTemplateItems((prev) => [...prev, ...items]);
  }

  async function handleApplyTemplate(template: DbWorkoutTemplate) {
    setApplyingTemplateId(template.id);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const items = templateItems.filter((i) => i.template_id === template.id);
      const today = todayIso();
      const created: DbWorkoutSet[] = [];
      for (const item of items) {
        const existingForDay = sets.filter(
          (s) => s.date === today && s.exercise_name.toLowerCase() === item.exercise_name.toLowerCase()
        ).length;
        for (let i = 0; i < DEFAULT_TEMPLATE_SETS; i += 1) {
          created.push(
            await insertWorkoutSet(supabase, user.id, categoryId, {
              exerciseName: item.exercise_name,
              setNumber: existingForDay + i + 1,
              reps: DEFAULT_TEMPLATE_REPS,
              weightKg: null,
              date: today,
            })
          );
        }
      }
      setSets((prev) => [...created, ...prev]);
    }
    setApplyingTemplateId(null);
  }

  async function handleDeleteTemplate(templateId: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    setTemplateItems((prev) => prev.filter((i) => i.template_id !== templateId));
    const supabase = createClient();
    await deleteWorkoutTemplate(supabase, templateId);
  }

  async function handleAddMeasurement(weightKg: number) {
    setSavingMeasurement(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertBodyMeasurement(supabase, user.id, categoryId, todayIso(), weightKg);
      setMeasurements((prev) => [...prev.filter((m) => m.date !== created.date), created]);
    }
    setSavingMeasurement(false);
  }

  async function handleDeleteSet(id: string) {
    const supabase = createClient();
    await deleteWorkoutSet(supabase, id);
    setSets((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleTagMuscle(exerciseId: string, muscle: MuscleGroup) {
    setExercises((prev) => prev.map((ex) => (ex.id === exerciseId ? { ...ex, primary_muscle: muscle } : ex)));
    try {
      const supabase = createClient();
      await updateExerciseMuscle(supabase, exerciseId, muscle);
    } catch (err) {
      // primary_muscle migration'ı (20260901090000) henüz uygulanmamış
      // olabilir — Kas Haritası etiketlemesi başarısız olsa da ana
      // hareket/set akışını kilitlemesin.
      console.error("Kas grubu kaydedilemedi (migration uygulanmamış olabilir):", err);
    }
  }

  // Kütüphaneden bir isim geldiğinde (Bölüm 2 — Antrenman Oluştur), aynı
  // isimde bir hareket zaten varsa onu döndürür, yoksa oluşturup kas
  // grubunu da (biliniyorsa) etiketler. exercises state'i güncel referansla
  // kapanışa alınabilsin diye bir parametre olarak geçiliyor (setExercises
  // ile yarışan bir closure sorunu olmasın diye).
  async function ensureExercise(name: string, currentExercises: DbExercise[]): Promise<DbExercise> {
    const existing = currentExercises.find((ex) => ex.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum bulunamadı.");

    const created = await insertExercise(supabase, user.id, categoryId, name, currentExercises.length);
    const libraryMatch = EXERCISE_LIBRARY.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (libraryMatch) {
      try {
        await updateExerciseMuscle(supabase, created.id, libraryMatch.muscleGroup);
        created.primary_muscle = libraryMatch.muscleGroup;
      } catch (err) {
        console.error("Kas grubu kaydedilemedi (migration uygulanmamış olabilir):", err);
      }
    }
    return created;
  }

  // muscle parametresi WorkoutBuilderPanel'in imzasıyla uyumlu olsun diye
  // burada — ensureExercise kas grubunu zaten exerciseLibrary'den kendisi
  // buluyor, bu yüzden burada kullanılmıyor.
  async function handleAddLibraryExercise(name: string) {
    const created = await ensureExercise(name, exercises);
    setExercises((prev) => (prev.some((ex) => ex.id === created.id) ? prev : [...prev, created]));
  }

  // Hızlı mod (Bölüm 2) — üretilen tek seanslık planı BUGÜNE uyguluyor,
  // handleApplyTemplate ile aynı mantık (mevcut set sayısını görüp devam
  // numarası veriyor), tek fark kaynağın bir AI planı olması.
  async function handleApplyQuickPlan(plan: QuickWorkoutPlan) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let currentExercises = exercises;
    const today = todayIso();
    const created: DbWorkoutSet[] = [];
    for (const planEx of plan.exercises) {
      const exercise = await ensureExercise(planEx.name, currentExercises);
      if (!currentExercises.some((ex) => ex.id === exercise.id)) {
        currentExercises = [...currentExercises, exercise];
      }
      const existingForDay = sets.filter(
        (s) => s.date === today && s.exercise_name.toLowerCase() === exercise.name.toLowerCase()
      ).length;
      for (let i = 0; i < planEx.sets; i += 1) {
        created.push(
          await insertWorkoutSet(supabase, user.id, categoryId, {
            exerciseName: exercise.name,
            setNumber: existingForDay + i + 1,
            reps: planEx.reps,
            weightKg: null,
            date: today,
          })
        );
      }
    }
    setExercises(currentExercises);
    setSets((prev) => [...created, ...prev]);
  }

  // Haftalık mod (Bölüm 2) — her günü ayrı bir "Antrenman Şablonu" olarak
  // kaydediyor (mevcut workout_templates altyapısı), kullanıcı istediği
  // güne istediği zaman "Hareketlerim" sekmesinden uygulayabiliyor — yeni
  // bir tablo/tekrarlama mantığı gerekmedi, var olanın üstüne kuruldu.
  async function handleSaveWeeklyPlan(plan: WeeklyWorkoutPlan) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let currentExercises = exercises;
    const newTemplates: DbWorkoutTemplate[] = [];
    const newItems: DbWorkoutTemplateItem[] = [];
    let sortOrder = templates.length;
    for (const day of plan.days) {
      for (const planEx of day.exercises) {
        const exercise = await ensureExercise(planEx.name, currentExercises);
        if (!currentExercises.some((ex) => ex.id === exercise.id)) {
          currentExercises = [...currentExercises, exercise];
        }
      }
      const { template, items } = await insertWorkoutTemplate(
        supabase,
        user.id,
        categoryId,
        day.label,
        day.exercises.map((e) => e.name),
        sortOrder
      );
      newTemplates.push(template);
      newItems.push(...items);
      sortOrder += 1;
    }
    setExercises(currentExercises);
    setTemplates((prev) => [...prev, ...newTemplates]);
    setTemplateItems((prev) => [...prev, ...newItems]);
  }

  const personalRecords = calculatePersonalRecords(sets);
  const lastDoneDates = calculateLastDoneDates(sets);
  const lastPerformance = calculateLastPerformance(sets);

  return (
    <div
      className="flex flex-col gap-4 rounded-lg bg-[color:var(--sport-bg)] p-4 sm:p-5"
      style={
        {
          "--sport-accent": "#2e7dff",
          "--sport-bg": "#141414",
          "--sport-surface": "#1c1c1c",
          "--sport-elevated": "#242424",
          "--sport-border": "rgba(255,255,255,0.12)",
          "--sport-text": "#f5f5f5",
          "--sport-muted": "#9a9a9a",
          // Bu kapsam içinde render edilen paylaşılan bileşenler
          // (SegmentedControl, Modal vb.) site-geneli --accent'i doğrudan
          // kullanıyor — modülün kendi bakır yerine mavi kimliğini
          // taşıması için genel token'lar da burada yerel olarak eziliyor.
          "--accent": "#2e7dff",
          "--accent-soft": "#2e7dff26",
          "--accent-foreground": "#ffffff",
        } as React.CSSProperties
      }
    >
      <SportTabBar value={tab} onChange={setTab} />

      {tab === "workout" && (
        <div className="flex flex-col gap-4">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-4 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
              <h2 className="text-sm font-medium text-[color:var(--sport-text)]">Hareketlerim</h2>
              <p className="text-xs text-[color:var(--sport-muted)]">
                Bir hareket kartını aşağıdaki haftanın günlerinden birine sürükleyip bırak — set/tekrar/ağırlığı
                orada gireceksin. Kamera tabanlı vücut/ilerleme analizi henüz yok.
              </p>

              <div className="flex flex-wrap gap-2">
                {exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onDelete={handleDeleteExercise}
                    personalRecordKg={personalRecords.get(exercise.name)?.weightKg}
                    isNewRecord={newRecordExercise === exercise.name}
                    lastDoneDate={lastDoneDates.get(exercise.name)}
                  />
                ))}
              </div>

              <form onSubmit={handleAddExercise} className="flex gap-2">
                <input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="örn. Şınav"
                  className="h-9 flex-1 rounded-lg border-2 border-[color:var(--sport-muted)]/30 bg-[color:var(--sport-surface)] px-3 text-sm text-[color:var(--sport-text)] outline-none placeholder:text-[color:var(--sport-muted)] focus:border-[color:var(--sport-accent)]/50"
                />
                <button
                  type="submit"
                  disabled={addingExercise || !newExerciseName.trim()}
                  className="btn flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[color:var(--sport-accent)]/15 px-4 text-xs font-medium text-[color:var(--sport-accent)] hover:bg-[color:var(--sport-accent)]/25 disabled:pointer-events-none disabled:opacity-50"
                >
                  <PlusIcon width={12} height={12} />
                  Hareket Ekle
                </button>
              </form>
            </div>

            {!loading && (
              <div className="mt-4 flex flex-col gap-3">
                {weekDates.map(({ date, label, isToday }) => (
                  <DayColumn
                    key={date}
                    date={date}
                    dayLabel={label}
                    isToday={isToday}
                    sets={sets.filter((s) => s.date === date)}
                    pendingExerciseName={
                      pendingDrop?.date === date ? exercises.find((ex) => ex.id === pendingDrop.exerciseId)?.name ?? null : null
                    }
                    pendingDefaults={
                      pendingDrop?.date === date
                        ? lastPerformance.get(exercises.find((ex) => ex.id === pendingDrop.exerciseId)?.name ?? "") ?? null
                        : null
                    }
                    onSubmitEntry={handleSubmitEntry}
                    onCancelEntry={() => setPendingDrop(null)}
                    onDeleteSet={handleDeleteSet}
                  />
                ))}
              </div>
            )}
          </DndContext>

          {!loading && (
            <>
              <WorkoutTemplates
                templates={templates}
                items={templateItems}
                onCreate={handleCreateTemplate}
                onApply={handleApplyTemplate}
                onDelete={handleDeleteTemplate}
                applyingId={applyingTemplateId}
              />
              <WorkoutVolumeChart sets={sets} />
              <BodyMeasurementPanel measurements={measurements} onAdd={handleAddMeasurement} saving={savingMeasurement} />
            </>
          )}
        </div>
      )}

      {tab === "muscle-map" && !loading && (
        <MuscleMapPanel exercises={exercises} sets={sets} onTagMuscle={handleTagMuscle} />
      )}

      {tab === "builder" && !loading && (
        <WorkoutBuilderPanel
          exercises={exercises}
          onApplyQuickPlan={handleApplyQuickPlan}
          onSaveWeeklyPlan={handleSaveWeeklyPlan}
          onAddLibraryExercise={handleAddLibraryExercise}
        />
      )}

      {tab === "library" && !loading && (
        <ExerciseLibraryPanel exercises={exercises} onAddLibraryExercise={handleAddLibraryExercise} />
      )}

      {tab === "tracking" && !loading && (
        <div className="flex flex-col gap-4">
          <ExerciseProgressChart
            sets={sets}
            exerciseNames={Array.from(new Set(sets.filter((s) => s.weight_kg != null).map((s) => s.exercise_name)))}
          />
          <MuscleVolumeDistribution sets={sets} exercises={exercises} />
        </div>
      )}

      {tab === "calculators" && !loading && <OneRepMaxCalculator personalRecords={personalRecords} />}
    </div>
  );
}
