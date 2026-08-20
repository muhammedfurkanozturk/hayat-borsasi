import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbDigitalFocusLog {
  id: string;
  date: string;
  site_name: string;
  minutes: number;
}

export async function fetchDigitalFocusLogs(
  supabase: SupabaseClient,
  categoryId: string,
  sinceDate: string
): Promise<DbDigitalFocusLog[]> {
  const { data, error } = await supabase
    .from("digital_focus_logs")
    .select("id, date, site_name, minutes")
    .eq("category_id", categoryId)
    .gte("date", sinceDate)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertDigitalFocusLog(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  date: string,
  siteName: string,
  minutes: number
): Promise<DbDigitalFocusLog> {
  const { data, error } = await supabase
    .from("digital_focus_logs")
    .insert({ user_id: userId, category_id: categoryId, date, site_name: siteName, minutes })
    .select("id, date, site_name, minutes")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDigitalFocusLog(supabase: SupabaseClient, logId: string) {
  const { error } = await supabase.from("digital_focus_logs").delete().eq("id", logId);
  if (error) throw error;
}
