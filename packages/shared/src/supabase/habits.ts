import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskDayCompletion } from "../habits";

export interface DbHabitRelapse {
  id: string;
  date: string;
  note_text: string;
  created_at: string;
}

export interface DbHabitNote {
  id: string;
  note_text: string;
  created_at: string;
}

// daily_entries üzerinden sorguluyoruz (daily_task_logs değil) çünkü
// daily_entries'in RLS politikası doğrudan user_id = auth.uid(), daha
// basit/hızlı. Sadece bu task_id için bir günlük görev kaydı olan
// günler dönüyor — boşluklar (hiç işaretlenmemiş günler) burada YOK,
// çağıran taraf `fillDateRange` ile bunları "tamamlanmadı" olarak
// doldurmalı.
export async function fetchTaskCompletionDates(
  supabase: SupabaseClient,
  taskId: string,
  sinceDate: string
): Promise<TaskDayCompletion[]> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("date, daily_task_logs!inner(completed)")
    .eq("daily_task_logs.task_id", taskId)
    .gte("date", sinceDate);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const logs = row.daily_task_logs as unknown as { completed: boolean }[];
    return { date: row.date as string, completed: logs[0]?.completed ?? false };
  });
}

export async function fetchRelapses(supabase: SupabaseClient, taskId: string): Promise<DbHabitRelapse[]> {
  const { data, error } = await supabase
    .from("habit_relapses")
    .select("id, date, note_text, created_at")
    .eq("task_id", taskId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Aynı gün için tekrar çağrılırsa (kullanıcı iki kez basarsa) unique
// kısıtına (task_id, date) takılır — bu durumda hata fırlatmak yerine
// var olan kaydı güncelleyip (upsert) döndürüyoruz.
export async function upsertRelapse(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  date: string,
  noteText: string
): Promise<DbHabitRelapse> {
  const { data, error } = await supabase
    .from("habit_relapses")
    .upsert(
      { user_id: userId, task_id: taskId, date, note_text: noteText },
      { onConflict: "task_id,date" }
    )
    .select("id, date, note_text, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRelapse(supabase: SupabaseClient, relapseId: string) {
  const { error } = await supabase.from("habit_relapses").delete().eq("id", relapseId);
  if (error) throw error;
}

export async function fetchHabitNotes(supabase: SupabaseClient, taskId: string): Promise<DbHabitNote[]> {
  const { data, error } = await supabase
    .from("habit_notes")
    .select("id, note_text, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertHabitNote(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  noteText: string
): Promise<DbHabitNote> {
  const { data, error } = await supabase
    .from("habit_notes")
    .insert({ user_id: userId, task_id: taskId, note_text: noteText })
    .select("id, note_text, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHabitNote(supabase: SupabaseClient, noteId: string) {
  const { error } = await supabase.from("habit_notes").delete().eq("id", noteId);
  if (error) throw error;
}

export interface DbHabitReward {
  id: string;
  title: string;
  target_amount: number;
}

// Quitzilla'daki (piyasa araştırması) tasarrufa bağlı özel ödül fikri —
// "ulaşıldı mı" durumu burada saklanmıyor, canlı hesaplanan tasarruf
// tutarıyla karşılaştırılarak istemci tarafında türetiliyor.
export async function fetchHabitRewards(supabase: SupabaseClient, taskId: string): Promise<DbHabitReward[]> {
  const { data, error } = await supabase
    .from("habit_rewards")
    .select("id, title, target_amount")
    .eq("task_id", taskId)
    .order("target_amount", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertHabitReward(
  supabase: SupabaseClient,
  userId: string,
  taskId: string,
  title: string,
  targetAmount: number
): Promise<DbHabitReward> {
  const { data, error } = await supabase
    .from("habit_rewards")
    .insert({ user_id: userId, task_id: taskId, title, target_amount: targetAmount })
    .select("id, title, target_amount")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHabitReward(supabase: SupabaseClient, rewardId: string) {
  const { error } = await supabase.from("habit_rewards").delete().eq("id", rewardId);
  if (error) throw error;
}
