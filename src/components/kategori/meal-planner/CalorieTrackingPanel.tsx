"use client";

import { useState } from "react";
import {
  calculateCalorieGoal,
  type CalorieGoalInput,
  type DbMealLog,
  type DbNutritionProfile,
} from "@hayat-borsasi/shared";
import { TargetIcon } from "@/components/icons";
import { CalorieGoalSetup, type CalorieGoalFormValues } from "./CalorieGoalSetup";
import { NutritionTrendChart } from "./NutritionTrendChart";

// 2026-08-28 (gerçek bir hata bulundu, canlı network isteğiyle kanıtlandı):
// activity_level migration'ı (20260828140000) uygulanana kadar bu alan
// DB'den her zaman null dönüyor — bunu "tamamlanmadı" saymak (eski
// versiyonda yapıldığı gibi) sihirbazı SONSUZA KADAR "tamamlanmamış"
// gösteriyordu, kaydetme aslında başarılı olsa bile (savunmacı fallback
// çalışıyordu, sadece bu alan olmadan) özet kart hiç görünmüyordu. Eksikse
// eski sabit varsayıma (moderate/×1.55) düşülüyor — migration uygulanınca
// gerçek değer otomatik devreye girecek.
function toCalorieGoalInput(profile: DbNutritionProfile | null): CalorieGoalInput | null {
  if (
    !profile ||
    profile.weight_kg == null ||
    profile.height_cm == null ||
    profile.age == null ||
    profile.sex == null ||
    profile.goal == null
  ) {
    return null;
  }
  return {
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    age: profile.age,
    sex: profile.sex,
    goal: profile.goal,
    activityLevel: profile.activity_level ?? "moderate",
  };
}

// "Kalori Trendi" grafiği artık bir hedefe bağlı: kullanıcının kilo/boy/yaş/
// cinsiyet/hedefinden (Mifflin-St Jeor + TDEE) türetilen günlük kalori
// hedefi burada gösteriliyor, grafik barları hedefin altı/üstüne göre
// renkleniyor (bkz. NutritionTrendChart.tsx).
export function CalorieTrackingPanel({
  profile,
  logs,
  onSaveGoal,
  saving,
  error,
}: {
  profile: DbNutritionProfile | null;
  logs: DbMealLog[];
  onSaveGoal: (values: CalorieGoalFormValues) => Promise<boolean>;
  saving: boolean;
  error: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const calorieInput = toCalorieGoalInput(profile);
  const complete = calorieInput !== null;
  const goalKcal = calorieInput ? calculateCalorieGoal(calorieInput) : null;
  const showSetup = !complete || editing;

  return (
    <div className="relative flex flex-col gap-4">
      {complete && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--nutrition-accent)]/15 text-[color:var(--nutrition-accent)]">
              <TargetIcon width={18} height={18} />
            </div>
            <div>
              <p className="text-xs text-muted">Günlük Hedefin</p>
              <p className="font-mono text-lg font-semibold tabular-nums text-foreground">{goalKcal} kcal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn h-9 rounded-lg border-2 border-muted/30 px-3 text-xs text-muted hover:text-foreground"
          >
            Ayarları Düzenle
          </button>
        </div>
      )}

      <NutritionTrendChart logs={logs} goalKcal={goalKcal} />

      {showSetup && (
        <CalorieGoalSetup
          initial={
            profile
              ? {
                  weightKg: profile.weight_kg ?? undefined,
                  heightCm: profile.height_cm ?? undefined,
                  age: profile.age ?? undefined,
                  sex: profile.sex ?? undefined,
                  goal: profile.goal ?? undefined,
                  activityLevel: profile.activity_level ?? undefined,
                }
              : null
          }
          onCancel={complete ? () => setEditing(false) : null}
          onSubmit={async (values) => {
            const ok = await onSaveGoal(values);
            if (ok) setEditing(false);
          }}
          saving={saving}
          error={error}
        />
      )}
    </div>
  );
}
