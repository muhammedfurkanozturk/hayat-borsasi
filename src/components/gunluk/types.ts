// Arşivden ("Günlükler") bir günün notunu düzenlemek için üst kutuya
// gönderilen hedef. entryId today için null'dur — bugünün notu
// AppDataProvider context'i (setDailyNote) üzerinden kaydedilir, diğer
// günler kendi daily_entries satırına doğrudan yazılır.
export interface EditTarget {
  date: string;
  dateLabel: string;
  entryId: string | null;
  noteText: string;
}
