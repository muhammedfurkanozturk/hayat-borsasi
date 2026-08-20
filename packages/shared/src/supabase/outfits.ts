import type { SupabaseClient } from "@supabase/supabase-js";

export interface DbOutfitLog {
  id: string;
  date: string;
  note_text: string;
  photo_path: string | null;
}

export async function fetchOutfitLogs(supabase: SupabaseClient, categoryId: string): Promise<DbOutfitLog[]> {
  const { data, error } = await supabase
    .from("outfit_logs")
    .select("id, date, note_text, photo_path")
    .eq("category_id", categoryId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// photo_path'in kendisi burada yüklenmiyor — dosya yükleme (Storage) client
// tarafında (web/mobil) platforma özgü File/Blob API'leriyle yapılıyor, bu
// fonksiyon sadece yüklendikten sonraki yolu DB satırına yazıyor.
export async function insertOutfitLog(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  date: string,
  noteText: string,
  photoPath: string | null
): Promise<DbOutfitLog> {
  const { data, error } = await supabase
    .from("outfit_logs")
    .insert({ user_id: userId, category_id: categoryId, date, note_text: noteText, photo_path: photoPath })
    .select("id, date, note_text, photo_path")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteOutfitLog(supabase: SupabaseClient, outfitLogId: string) {
  const { error } = await supabase.from("outfit_logs").delete().eq("id", outfitLogId);
  if (error) throw error;
}
