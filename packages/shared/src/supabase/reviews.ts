import type { SupabaseClient } from "@supabase/supabase-js";

// "eksikler" envanteri madde 6 — weekly_reviews/monthly_reviews tabloları
// ilk şemadan (20260811120000_initial_schema.sql) beri vardı ama hiçbir
// kod onları hiç okumuyor/yazmıyordu (bölüm 5'teki formülün öngördüğü
// "haftalık/aylık cevaplarla ayarlama" hiç UI'a bağlanmamıştı). Kullanıcı
// onaylı karar: kategori bazlı 1-5 memnuniyet puanı + serbest not, ortalama
// puana göre ±%10 aralığında (3=nötr) günlük ortalamayı ayarlayan küçük bir
// çarpan.
export interface CategoryRating {
  categoryId: string;
  categoryName: string;
  rating: number;
}

export interface ReviewAnswers {
  categoryRatings: CategoryRating[];
  note: string | null;
}

export interface DbWeeklyReview {
  id: string;
  week_start_date: string;
  answers: ReviewAnswers;
  weekly_score: number | null;
}

export interface DbMonthlyReview {
  id: string;
  month: string;
  answers: ReviewAnswers;
  monthly_score: number | null;
}

// Haftanın Pazartesi'si — mobil WorkoutLogPanel'in getCurrentWeekDates'iyle
// AYNI Pazartesi-başlangıçlı mantık, burada tek bir tarihe (ISO) indirgendi.
export function currentWeekStartIso(): string {
  const now = new Date();
  const dayIndex = now.getDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  return monday.toISOString().slice(0, 10);
}

export function currentMonthStartIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

// Kategori puanlarının ortalaması 3 (nötr) → ×1.0, 5 (çok memnun) → ×1.10,
// 1 (hiç memnun değil) → ×0.90 — ±%10 aralığında lineer. Hiç kategori
// puanlanmamışsa (boş liste) çarpan uygulanmaz.
export function reviewScoreMultiplier(ratings: CategoryRating[]): number {
  if (ratings.length === 0) return 1;
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return 1 + ((avg - 3) / 2) * 0.1;
}

export async function fetchWeeklyReview(
  supabase: SupabaseClient,
  userId: string,
  weekStartDate: string
): Promise<DbWeeklyReview | null> {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .select("id, week_start_date, answers, weekly_score")
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertWeeklyReview(
  supabase: SupabaseClient,
  userId: string,
  weekStartDate: string,
  answers: ReviewAnswers,
  weeklyScore: number
): Promise<DbWeeklyReview> {
  const { data, error } = await supabase
    .from("weekly_reviews")
    .upsert(
      { user_id: userId, week_start_date: weekStartDate, answers, weekly_score: weeklyScore },
      { onConflict: "user_id,week_start_date" }
    )
    .select("id, week_start_date, answers, weekly_score")
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMonthlyReview(
  supabase: SupabaseClient,
  userId: string,
  month: string
): Promise<DbMonthlyReview | null> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .select("id, month, answers, monthly_score")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertMonthlyReview(
  supabase: SupabaseClient,
  userId: string,
  month: string,
  answers: ReviewAnswers,
  monthlyScore: number
): Promise<DbMonthlyReview> {
  const { data, error } = await supabase
    .from("monthly_reviews")
    .upsert({ user_id: userId, month, answers, monthly_score: monthlyScore }, { onConflict: "user_id,month" })
    .select("id, month, answers, monthly_score")
    .single();
  if (error) throw error;
  return data;
}
