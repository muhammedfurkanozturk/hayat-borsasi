export type BiologicalSex = "male" | "female";
export type CalorieGoal = "maintain" | "gain" | "lose";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export interface CalorieGoalInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: BiologicalSex;
  goal: CalorieGoal;
  activityLevel: ActivityLevel;
}

// 2026-08-28 (kullanıcı isteği): önceden aktivite düzeyi sorulmuyordu, sabit
// "ortalama" (×1.55) varsayımı kullanılıyordu — artık sihirbazda gerçek bir
// adım (bkz. CalorieGoalSetup.tsx), standart Harris-Benedict/Mifflin
// aktivite çarpanları.
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GAIN_SURPLUS_KCAL = 400;
const LOSE_DEFICIT_KCAL = 500;

// Mifflin-St Jeor — yaygın kabul görmüş, BMR için Harris-Benedict'ten daha
// isabetli sayılan formül.
export function calculateBmr({ weightKg, heightCm, age, sex }: Pick<CalorieGoalInput, "weightKg" | "heightCm" | "age" | "sex">): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateCalorieGoal(input: CalorieGoalInput): number {
  const tdee = calculateBmr(input) * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const adjusted =
    input.goal === "gain" ? tdee + GAIN_SURPLUS_KCAL : input.goal === "lose" ? tdee - LOSE_DEFICIT_KCAL : tdee;
  return Math.round(adjusted);
}
