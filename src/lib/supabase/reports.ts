import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportPeriod } from "@/lib/report";

export interface DbReport {
  id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  content_text: string;
  created_at: string;
}

const periodTypeMap: Record<ReportPeriod, "daily" | "weekly" | "monthly"> = {
  Günlük: "daily",
  Haftalık: "weekly",
  Aylık: "monthly",
};

const periodLabelMap: Record<string, ReportPeriod> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
};

export function periodTypeToLabel(periodType: string): ReportPeriod {
  return periodLabelMap[periodType] ?? "Günlük";
}

export async function fetchReports(supabase: SupabaseClient): Promise<DbReport[]> {
  const { data, error } = await supabase
    .from("ai_reports")
    .select("id, period_type, period_start, period_end, content_text, created_at")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data ?? [];
}

export async function insertReport(
  supabase: SupabaseClient,
  userId: string,
  period: ReportPeriod,
  contentText: string
): Promise<DbReport> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("ai_reports")
    .insert({
      user_id: userId,
      period_type: periodTypeMap[period],
      period_start: today,
      period_end: today,
      content_text: contentText,
    })
    .select("id, period_type, period_start, period_end, content_text, created_at")
    .single();
  if (error) throw error;
  return data;
}

// Bir ayda hangi günlerde kayıtlı rapor var — takvimde nokta işareti için.
export async function fetchReportsForMonth(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number // 0-11
): Promise<DbReport[]> {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("ai_reports")
    .select("id, period_type, period_start, period_end, content_text, created_at")
    .eq("user_id", userId)
    .lte("period_start", end)
    .gte("period_end", start);
  if (error) throw error;
  return data ?? [];
}

// Belirli bir günü kapsayan tüm raporlar (o gün başlayıp biten günlük rapor,
// ya da o günü içine alan haftalık/aylık rapor).
export async function fetchReportsForDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<DbReport[]> {
  const { data, error } = await supabase
    .from("ai_reports")
    .select("id, period_type, period_start, period_end, content_text, created_at")
    .eq("user_id", userId)
    .lte("period_start", date)
    .gte("period_end", date)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
