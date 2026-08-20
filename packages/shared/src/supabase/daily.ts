import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbDailyEntry {
  id: string;
  date: string;
  note_text: string;
}

export interface DbTaskLog {
  task_id: string;
  completed: boolean;
  completed_at: string | null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayIso(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function fetchEntryForDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<DbDailyEntry | null> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("id, date, note_text")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchYesterdayTaskLogs(
  supabase: SupabaseClient,
  userId: string
): Promise<DbTaskLog[]> {
  const entry = await fetchEntryForDate(supabase, userId, yesterdayIso());
  if (!entry) return [];
  return fetchTaskLogs(supabase, entry.id);
}

export async function getOrCreateEntryForDate(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<DbDailyEntry> {
  const existing = await fetchEntryForDate(supabase, userId, date);
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("daily_entries")
    .insert({ user_id: userId, date, note_text: "" })
    .select("id, date, note_text")
    .single();
  if (!insertError) return created;

  // Aynı anda başka bir çağrı (ör. auth token yenilenirken tetiklenen ikinci
  // bir veri yüklemesi) araya girip satırı zaten oluşturmuş olabilir — bu
  // durumda insert benzersizlik kısıtına (user_id, date) çarpar. Hata
  // fırlatmak yerine az önce oluşturulan satırı çekip onu döndürüyoruz.
  if (insertError.code === "23505") {
    const raceWinner = await fetchEntryForDate(supabase, userId, date);
    if (raceWinner) return raceWinner;
  }
  throw insertError;
}

export async function getOrCreateTodayEntry(
  supabase: SupabaseClient,
  userId: string
): Promise<DbDailyEntry> {
  return getOrCreateEntryForDate(supabase, userId, todayIso());
}

// Bir ayın tüm günlerinde not girilmiş mi girilmemiş mi bilmek için —
// takvim görünümünde hangi günlerin dolu olduğunu göstermede kullanılır.
export async function fetchEntriesForMonth(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number // 0-11
): Promise<DbDailyEntry[]> {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("daily_entries")
    .select("id, date, note_text")
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);
  if (error) throw error;
  return data ?? [];
}

export async function fetchTaskLogs(
  supabase: SupabaseClient,
  dailyEntryId: string
): Promise<DbTaskLog[]> {
  const { data, error } = await supabase
    .from("daily_task_logs")
    .select("task_id, completed, completed_at")
    .eq("daily_entry_id", dailyEntryId);
  if (error) throw error;
  return data ?? [];
}

export async function toggleTaskLog(
  supabase: SupabaseClient,
  dailyEntryId: string,
  taskId: string,
  currentlyCompleted: boolean
): Promise<DbTaskLog> {
  const nextCompleted = !currentlyCompleted;
  const completedAt = nextCompleted ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("daily_task_logs")
    .upsert(
      { daily_entry_id: dailyEntryId, task_id: taskId, completed: nextCompleted, completed_at: completedAt },
      { onConflict: "daily_entry_id,task_id" }
    )
    .select("task_id, completed, completed_at")
    .single();
  if (error) throw error;
  return data;
}

export async function updateDailyNote(supabase: SupabaseClient, dailyEntryId: string, noteText: string) {
  const { error } = await supabase.from("daily_entries").update({ note_text: noteText }).eq("id", dailyEntryId);
  if (error) throw error;
}
