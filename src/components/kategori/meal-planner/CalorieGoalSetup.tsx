"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ActivityLevel, BiologicalSex, CalorieGoal } from "@hayat-borsasi/shared";

export interface CalorieGoalFormValues {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  goal: CalorieGoal;
  activityLevel: ActivityLevel;
}

const GOAL_OPTIONS: { value: CalorieGoal; label: string }[] = [
  { value: "maintain", label: "Kilomu Korumak İstiyorum" },
  { value: "gain", label: "Kilo Almak İstiyorum" },
  { value: "lose", label: "Kilo Vermek İstiyorum" },
];

// 2026-08-28 (kullanıcı isteği): önceden aktivite düzeyi hiç sorulmuyordu,
// sabit "ortalama" varsayımı kullanılıyordu — artık gerçek bir adım.
const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary", label: "Hareketsiz", description: "Masa başı iş, egzersiz yok" },
  { value: "light", label: "Az Hareketli", description: "Haftada 1-3 gün hafif egzersiz" },
  { value: "moderate", label: "Orta Düzeyde Hareketli", description: "Haftada 3-5 gün orta yoğunlukta egzersiz" },
  { value: "active", label: "Aktif", description: "Haftada 6-7 gün egzersiz" },
  { value: "very_active", label: "Çok Aktif", description: "Günde 2 kez veya fiziksel iş" },
];

// roadmap.sh/onboarding tarzı 3-adımlı, nokta göstergeli kayan kart — AI
// Rapor'un Pro-kilit kutucuğuyla aynı görsel dil (hafif blur arkaplan +
// öne çıkan kart, bkz. RaporClient.tsx).
export function CalorieGoalSetup({
  initial,
  onCancel,
  onSubmit,
  saving,
  error,
}: {
  initial: Partial<CalorieGoalFormValues> | null;
  onCancel: (() => void) | null;
  onSubmit: (values: CalorieGoalFormValues) => void;
  saving: boolean;
  error?: string | null;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [weightKg, setWeightKg] = useState(initial?.weightKg ? String(initial.weightKg) : "");
  const [heightCm, setHeightCm] = useState(initial?.heightCm ? String(initial.heightCm) : "");
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [sex, setSex] = useState<BiologicalSex>(initial?.sex ?? "female");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(initial?.activityLevel ?? null);
  const [goal, setGoal] = useState<CalorieGoal | null>(initial?.goal ?? null);

  const step1Valid = Number(weightKg) > 0 && Number(heightCm) > 0 && Number(age) > 0;

  function handleFinish(selectedGoal: CalorieGoal) {
    if (!activityLevel) return;
    setGoal(selectedGoal);
    onSubmit({
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      age: Number(age),
      sex,
      goal: selectedGoal,
      activityLevel,
    });
  }

  return (
    <div className="modal-in fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/60 px-6 py-10 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col gap-5 overflow-hidden rounded-lg border border-border bg-surface p-6 shadow-card">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.div
              key="step-0"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4"
            >
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-foreground">Kalori Hedefini Hesaplayalım</h2>
                <p className="text-xs text-muted">Günlük kalori hedefin için birkaç bilgiye ihtiyacımız var.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Kilo (kg)</span>
                  <input
                    type="number"
                    min={1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="h-10 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 text-sm text-foreground outline-none focus:border-accent/50"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Boy (cm)</span>
                  <input
                    type="number"
                    min={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="h-10 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 text-sm text-foreground outline-none focus:border-accent/50"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Yaş</span>
                  <input
                    type="number"
                    min={1}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-10 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 text-sm text-foreground outline-none focus:border-accent/50"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Cinsiyet</span>
                  <div className="flex h-10 gap-1 rounded-lg border-2 border-muted/30 bg-background-elevated p-1">
                    {(["female", "male"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSex(option)}
                        className={`btn flex-1 rounded-md text-xs font-medium ${
                          sex === option ? "bg-[color:var(--nutrition-accent)]/15 text-[color:var(--nutrition-accent)]" : "text-muted hover:text-foreground"
                        }`}
                      >
                        {option === "female" ? "Kadın" : "Erkek"}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2">
                {onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="btn h-9 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground"
                  >
                    Vazgeç
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={!step1Valid}
                  className="btn h-9 rounded-lg bg-[color:var(--nutrition-accent)] px-4 text-xs font-semibold text-[color:var(--nutrition-accent-fg)] hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  Devam Et
                </button>
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4"
            >
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-foreground">Ne Kadar Hareketlisin?</h2>
                <p className="text-xs text-muted">Günlük kalori ihtiyacın (TDEE) buna göre hesaplanır.</p>
              </div>

              <div className="flex flex-col gap-2">
                {ACTIVITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActivityLevel(option.value)}
                    className={`btn flex flex-col items-start gap-0.5 rounded-lg border-2 px-4 py-2 text-left ${
                      activityLevel === option.value
                        ? "border-[color:var(--nutrition-accent)]/50 bg-[color:var(--nutrition-accent)]/15"
                        : "border-muted/30 hover:border-[color:var(--nutrition-accent)]/30"
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${activityLevel === option.value ? "text-[color:var(--nutrition-accent)]" : "text-foreground"}`}
                    >
                      {option.label}
                    </span>
                    <span className="text-[11px] text-muted">{option.description}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="btn h-9 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground"
                >
                  ← Geri
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!activityLevel}
                  className="btn h-9 rounded-lg bg-[color:var(--nutrition-accent)] px-4 text-xs font-semibold text-[color:var(--nutrition-accent-fg)] hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                >
                  Devam Et
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-4"
            >
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-foreground">Hedefin Ne?</h2>
                <p className="text-xs text-muted">Günlük kalori hedefin buna göre ayarlanacak.</p>
              </div>

              <div className="flex flex-col gap-2">
                {GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFinish(option.value)}
                    disabled={saving}
                    className={`btn h-11 rounded-lg border-2 px-4 text-left text-sm font-medium disabled:pointer-events-none disabled:opacity-50 ${
                      goal === option.value
                        ? "border-[color:var(--nutrition-accent)]/50 bg-[color:var(--nutrition-accent)]/15 text-[color:var(--nutrition-accent)]"
                        : "border-muted/30 text-foreground hover:border-[color:var(--nutrition-accent)]/30"
                    }`}
                  >
                    {saving && goal === option.value ? "Hesaplanıyor..." : option.label}
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-negative">{error}</p>}

              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn self-start text-xs text-muted hover:text-foreground"
              >
                ← Geri
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={`h-1.5 rounded-full transition-all ${
                dot === step ? "w-4 bg-[color:var(--nutrition-accent)]" : "w-1.5 bg-muted/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
