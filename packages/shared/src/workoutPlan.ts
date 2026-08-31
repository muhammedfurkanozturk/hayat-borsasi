// MuscleWiki'den (piyasa araştırması) ilham alınan "antrenman oluştur"
// özelliği — AI Rapor/Tarif Önerisi'ndeki JSON-yapılandırılmış çıktı
// deseninin (bkz. report.ts, recipe.ts) antrenman planına uyarlaması.
// KRİTİK KURAL: Claude egzersiz UYDURMAMALI, sadece exerciseLibrary.ts'teki
// gerçek isimlerden seçmeli — bu yüzden parse sırasında EXERCISE_LIBRARY'de
// karşılığı olmayan isimler sessizce elenir (hallucinate edilmiş bir isim
// varsa listeden düşer, tüm planı geçersiz kılmaz).
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from "./exerciseLibrary";

const VALID_MUSCLE_KEYS = new Set(Object.keys(MUSCLE_GROUP_LABELS));

export interface WorkoutPlanExercise {
  name: string;
  sets: number;
  reps: number;
}

export interface QuickWorkoutPlan {
  exercises: WorkoutPlanExercise[];
}

export interface WeeklyWorkoutDay {
  label: string;
  muscleGroups: string[];
  exercises: WorkoutPlanExercise[];
}

export interface WeeklyWorkoutPlan {
  days: WeeklyWorkoutDay[];
  progressionNote: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stripCodeFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

const LIBRARY_NAMES = new Set(EXERCISE_LIBRARY.map((e) => e.name.toLowerCase()));

function parseExerciseList(value: unknown): WorkoutPlanExercise[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((e) => ({
      name: typeof e.name === "string" ? e.name : "",
      sets: typeof e.sets === "number" ? Math.round(e.sets) : 3,
      reps: typeof e.reps === "number" ? Math.round(e.reps) : 10,
    }))
    // Claude'un uydurduğu/kütüphanede olmayan bir isim varsa sessizce ele —
    // "AI egzersiz uydurmasın" kuralının çalışma zamanı güvencesi.
    .filter((e) => e.name.trim().length > 0 && LIBRARY_NAMES.has(e.name.toLowerCase()));
}

export function parseQuickWorkoutPlan(text: string): QuickWorkoutPlan | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.exercises)) return null;
  const exercises = parseExerciseList(parsed.exercises);
  if (exercises.length === 0) return null;
  return { exercises };
}

export function parseWeeklyWorkoutPlan(text: string): WeeklyWorkoutPlan | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    return null;
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.days)) return null;

  const days: WeeklyWorkoutDay[] = parsed.days
    .filter(isRecord)
    .map((d) => ({
      label: typeof d.label === "string" ? d.label : "",
      // Claude bazen Türkçe çeviri veya tekil/çoğul farklı bir kelime
      // döndürebiliyor (örn. "quadriceps" yerine bizim "quads" anahtarımız
      // bekleniyor) — bilinmeyen anahtarlar sessizce elenir, ham/çevrilmemiş
      // bir string ekrana sızmaz.
      muscleGroups: Array.isArray(d.muscleGroups)
        ? d.muscleGroups.filter((m): m is string => typeof m === "string" && VALID_MUSCLE_KEYS.has(m))
        : [],
      exercises: parseExerciseList(d.exercises),
    }))
    .filter((d) => d.label.trim().length > 0 && d.exercises.length > 0);

  if (days.length === 0) return null;

  return {
    days,
    progressionNote: typeof parsed.progressionNote === "string" ? parsed.progressionNote : "",
  };
}
