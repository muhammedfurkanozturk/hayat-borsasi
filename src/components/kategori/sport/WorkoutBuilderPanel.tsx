"use client";

import { useState } from "react";
import {
  EQUIPMENT_LABELS,
  EXERCISE_LIBRARY,
  MUSCLE_GROUP_LABELS,
  type DbExercise,
  type EquipmentType,
  type MuscleGroup,
  type QuickWorkoutPlan,
  type WeeklyWorkoutPlan,
} from "@hayat-borsasi/shared";
import { CalendarIcon, CompassIcon, LightbulbIcon } from "@/components/icons";
import { DifficultyDots } from "./DifficultyDots";
import { EQUIPMENT_ENTRIES, MUSCLE_ENTRIES, MultiSelect } from "./MultiSelect";

type BuilderMode = "quick" | "weekly" | "manual";

const MODE_TILES: { value: BuilderMode; label: string; description: string }[] = [
  { value: "quick", label: "Bugünün Antrenmanını Oluştur", description: "Hızlı, tek seanslık öneri" },
  { value: "weekly", label: "Haftalık Plan Oluştur", description: "3-6 günlük, dengeli program" },
  { value: "manual", label: "Manuel Oluştur", description: "Kütüphaneden kendi seçimini yap" },
];

const GOAL_OPTIONS: { value: "hypertrophy" | "strength" | "endurance"; label: string }[] = [
  { value: "hypertrophy", label: "Kas Kütlesi" },
  { value: "strength", label: "Kuvvet" },
  { value: "endurance", label: "Dayanıklılık" },
];

// MuscleWiki'den (piyasa araştırması) ilham alınan üç antrenman oluşturma
// modu. Hızlı/Haftalık modlar Claude API'yi SADECE exerciseLibrary.ts'teki
// gerçek isimlerden seçmeye zorluyor (bkz. src/lib/ai/workout-generate.ts) —
// AI egzersiz uydurmuyor. Manuel mod ise kütüphanede arama yapıp
// "Hareketlerime Ekle" ile mevcut sürükle-bırak akışına köprü kuruyor,
// ayrı bir set-kayıt arayüzü tekrarlamıyor.
export function WorkoutBuilderPanel({
  exercises,
  onApplyQuickPlan,
  onSaveWeeklyPlan,
  onAddLibraryExercise,
}: {
  exercises: DbExercise[];
  onApplyQuickPlan: (plan: QuickWorkoutPlan) => Promise<void>;
  onSaveWeeklyPlan: (plan: WeeklyWorkoutPlan) => Promise<void>;
  onAddLibraryExercise: (name: string, muscle: MuscleGroup) => Promise<void>;
}) {
  const [mode, setMode] = useState<BuilderMode>("quick");
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [goal, setGoal] = useState<"hypertrophy" | "strength" | "endurance">("hypertrophy");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickPlan, setQuickPlan] = useState<QuickWorkoutPlan | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkoutPlan | null>(null);
  const [applying, setApplying] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [addingLibraryId, setAddingLibraryId] = useState<string | null>(null);

  function toggleMuscle(m: MuscleGroup) {
    setMuscleGroups((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }
  function toggleEquipment(e: EquipmentType) {
    setEquipment((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));
  }

  async function handleGenerate() {
    if (muscleGroups.length === 0) {
      setError("En az bir kas grubu seç.");
      return;
    }
    setLoading(true);
    setError(null);
    setQuickPlan(null);
    setWeeklyPlan(null);
    try {
      const res = await fetch("/api/workout-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, muscleGroups, equipment, goal, daysPerWeek }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Antrenman üretilemedi.");
      if (mode === "weekly") setWeeklyPlan(json);
      else setQuickPlan(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Antrenman üretilemedi.");
    }
    setLoading(false);
  }

  const existingNames = new Set(exercises.map((e) => e.name.toLowerCase()));
  const manualResults = manualQuery.trim()
    ? EXERCISE_LIBRARY.filter(
        (e) =>
          e.name.toLowerCase().includes(manualQuery.trim().toLowerCase()) ||
          MUSCLE_GROUP_LABELS[e.muscleGroup].toLowerCase().includes(manualQuery.trim().toLowerCase())
      ).slice(0, 20)
    : [];

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-surface)] shadow-card p-5">
      <div>
        <h2 className="text-sm font-medium text-[color:var(--sport-text)]">Antrenman Oluştur</h2>
        <p className="text-xs text-[color:var(--sport-muted)]">Nasıl bir antrenman istersin?</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODE_TILES.map((tile) => {
          const active = mode === tile.value;
          return (
            <button
              key={tile.value}
              type="button"
              onClick={() => {
                setMode(tile.value);
                setError(null);
                setQuickPlan(null);
                setWeeklyPlan(null);
              }}
              className={`btn flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left ${
                active ? "border-[color:var(--sport-accent)]/50 bg-[color:var(--sport-accent)]/15" : "border-[color:var(--sport-muted)]/25 hover:border-[color:var(--sport-accent)]/30"
              }`}
            >
              <span className={`text-xs font-semibold ${active ? "text-[color:var(--sport-accent)]" : "text-[color:var(--sport-text)]"}`}>{tile.label}</span>
              <span className="text-[11px] text-[color:var(--sport-muted)]">{tile.description}</span>
            </button>
          );
        })}
      </div>

      {mode !== "manual" && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-[color:var(--sport-muted)]">Hedef Kas Grubu</p>
            <MultiSelect options={MUSCLE_ENTRIES} selected={muscleGroups} onToggle={toggleMuscle} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-[color:var(--sport-muted)]">Ekipman (boş = fark etmez)</p>
            <MultiSelect options={EQUIPMENT_ENTRIES} selected={equipment} onToggle={toggleEquipment} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-[color:var(--sport-muted)]">Hedef</p>
            <div className="flex gap-1.5">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`btn rounded-lg border-2 px-3 py-1.5 text-xs font-medium ${
                    goal === g.value ? "border-[color:var(--sport-accent)]/50 bg-[color:var(--sport-accent)]/15 text-[color:var(--sport-accent)]" : "border-[color:var(--sport-muted)]/25 text-[color:var(--sport-muted)] hover:border-[color:var(--sport-accent)]/30"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "weekly" && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[color:var(--sport-muted)]">Haftada Kaç Gün</p>
              <div className="flex gap-1.5">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`btn h-9 w-9 rounded-lg border-2 text-sm font-medium ${
                      daysPerWeek === d ? "border-[color:var(--sport-accent)]/50 bg-[color:var(--sport-accent)]/15 text-[color:var(--sport-accent)]" : "border-[color:var(--sport-muted)]/25 text-[color:var(--sport-muted)] hover:border-[color:var(--sport-accent)]/30"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="btn flex h-11 w-fit items-center gap-2 rounded-lg bg-[color:var(--sport-accent)] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          >
            <LightbulbIcon width={16} height={16} />
            {loading ? "Oluşturuluyor..." : "Antrenman Oluştur"}
          </button>

          {error && <p className="text-xs text-negative">{error}</p>}

          {quickPlan && (
            <div className="flex flex-col gap-3 rounded-lg border-2 border-[color:var(--sport-accent)]/25 bg-[color:var(--sport-accent)]/15 p-4">
              <div className="flex flex-col gap-1.5">
                {quickPlan.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-[color:var(--sport-elevated)] px-3 py-2">
                    <span className="text-sm font-black italic uppercase tracking-tight text-[color:var(--sport-text)]">{ex.name}</span>
                    <span className="font-mono text-xs text-[color:var(--sport-muted)]">
                      {ex.sets} × {ex.reps}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={applying}
                onClick={async () => {
                  setApplying(true);
                  await onApplyQuickPlan(quickPlan);
                  setApplying(false);
                  setQuickPlan(null);
                }}
                className="btn h-10 w-fit rounded-lg bg-[color:var(--sport-accent)] px-4 text-xs font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              >
                {applying ? "Uygulanıyor..." : "Bugüne Uygula"}
              </button>
            </div>
          )}

          {weeklyPlan && (
            <div className="flex flex-col gap-3 rounded-lg border-2 border-[color:var(--sport-accent)]/25 bg-[color:var(--sport-accent)]/15 p-4">
              {weeklyPlan.progressionNote && (
                <div className="flex items-start gap-2 rounded-lg bg-pro-soft px-3 py-2 text-xs text-pro">
                  <LightbulbIcon width={13} height={13} className="mt-0.5 shrink-0" />
                  <span>{weeklyPlan.progressionNote}</span>
                </div>
              )}
              {/* Freeletics'in dikey zaman çizelgesi — numaralı, birbirine
                  bağlantı çizgisiyle bağlı daireler. Bu plan henüz
                  uygulanmadığı/tamamlanmadığı için "tamamlandı" durumu yok —
                  ilk gün "aktif" (dolu mavi), kalanı "henüz gelmemiş" (gri
                  kontur) olarak gösteriliyor. */}
              <div className="flex flex-col">
                {weeklyPlan.days.map((day, i) => {
                  const isFirst = i === 0;
                  const isLast = i === weeklyPlan.days.length - 1;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-bold ${
                            isFirst
                              ? "border-[color:var(--sport-accent)] bg-[color:var(--sport-accent)] text-white"
                              : "border-[color:var(--sport-muted)]/40 text-[color:var(--sport-muted)]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        {!isLast && <span className="w-0.5 flex-1 bg-[color:var(--sport-muted)]/25" />}
                      </div>
                      <div className="flex flex-1 flex-col gap-1.5 rounded-lg bg-[color:var(--sport-elevated)] p-3 pb-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon width={13} height={13} className="text-[color:var(--sport-accent)]" />
                          <span className="text-sm font-black italic uppercase tracking-tight text-[color:var(--sport-text)]">
                            {day.label}
                          </span>
                          <span className="text-[10px] text-[color:var(--sport-muted)]">
                            {day.muscleGroups.map((m) => MUSCLE_GROUP_LABELS[m as MuscleGroup] ?? m).join(", ")}
                          </span>
                        </div>
                        {day.exercises.map((ex, j) => (
                          <div key={j} className="flex items-center justify-between pl-5 text-xs text-[color:var(--sport-muted)]">
                            <span>{ex.name}</span>
                            <span className="font-mono">
                              {ex.sets} × {ex.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={applying}
                onClick={async () => {
                  setApplying(true);
                  await onSaveWeeklyPlan(weeklyPlan);
                  setApplying(false);
                  setWeeklyPlan(null);
                }}
                className="btn h-10 w-fit rounded-lg bg-[color:var(--sport-accent)] px-4 text-xs font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
              >
                {applying ? "Kaydediliyor..." : "Şablonlarıma Kaydet"}
              </button>
              <p className="text-[11px] text-[color:var(--sport-muted)]">
                Her gün ayrı bir şablon olarak &quot;Hareketlerim&quot; sekmesine kaydedilir, oradan istediğin güne uygulayabilirsin.
              </p>
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <div className="flex flex-col gap-3">
          {/* EK GÖREV 2 (2026-09-01) — önceki sürüm border'ı DIŞ konteynere,
              odak halkasını (globals.css'teki genel input:focus-visible
              kuralı) sınırsız/borderless İÇ input'a uyguluyordu; ikisinin
              kutuları örtüşmediği için halka dıştaki pilin dışına taşıyordu.
              Diğer arama kutularıyla (örn. StockScreenerPanel.tsx) AYNI
              deseni kullanacak şekilde düzeltildi: border+odak halkası
              artık input'un KENDİ üzerinde, ikon input'un içine mutlak
              konumlandırılmış. */}
          <div className="relative">
            <CompassIcon width={14} height={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--sport-muted)]" />
            <input
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Egzersiz veya kas grubu ara..."
              className="h-10 w-full rounded-lg border-2 border-[color:var(--sport-muted)]/25 bg-[color:var(--sport-elevated)] pl-9 pr-3 text-sm text-[color:var(--sport-text)] outline-none placeholder:text-[color:var(--sport-muted)] focus:border-[color:var(--sport-accent)]/50"
            />
          </div>
          {manualQuery.trim() && (
            <div className="flex flex-col gap-1.5">
              {manualResults.length === 0 && <p className="text-xs text-[color:var(--sport-muted)]">Sonuç bulunamadı.</p>}
              {manualResults.map((ex) => {
                const alreadyAdded = existingNames.has(ex.name.toLowerCase());
                return (
                  <div key={ex.id} className="flex items-center justify-between gap-2 rounded-lg border-2 border-[color:var(--sport-muted)]/20 px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black italic uppercase tracking-tight text-[color:var(--sport-text)]">{ex.name}</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-[color:var(--sport-muted)]">
                        {MUSCLE_GROUP_LABELS[ex.muscleGroup]} · {EQUIPMENT_LABELS[ex.equipment]}
                        <DifficultyDots difficulty={ex.difficulty} />
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={alreadyAdded || addingLibraryId === ex.id}
                      onClick={async () => {
                        setAddingLibraryId(ex.id);
                        await onAddLibraryExercise(ex.name, ex.muscleGroup);
                        setAddingLibraryId(null);
                      }}
                      className="btn h-8 shrink-0 rounded-lg bg-[color:var(--sport-accent)]/15 px-3 text-xs font-medium text-[color:var(--sport-accent)] hover:bg-[color:var(--sport-accent)]/25 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {alreadyAdded ? "Eklendi" : addingLibraryId === ex.id ? "Ekleniyor..." : "Hareketlerime Ekle"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-[color:var(--sport-muted)]">
            Eklediğin hareket &quot;Hareketlerim&quot; sekmesinde görünür — oradan haftanın bir gününe sürükleyip set/tekrar/ağırlığını
            gireceksin.
          </p>
        </div>
      )}
    </div>
  );
}
