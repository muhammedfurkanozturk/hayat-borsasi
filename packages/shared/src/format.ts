export function formatTodayLong(): string {
  const now = new Date();
  const day = new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(now);
  const month = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(now);
  const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(now);
  return `${day} ${month} ${weekday}`;
}

// FoodLens/OpenNutriTracker'daki (piyasa araştırması) kart üstü "3 gün
// önce" etiketi için — sadece tarih (YYYY-MM-DD) farkını gün cinsinden
// okunur Türkçe metne çevirir, saat bilgisiyle ilgilenmiyor.
export function formatDaysAgo(dateIso: string, todayIso: string): string {
  const diffMs = new Date(`${todayIso}T00:00:00Z`).getTime() - new Date(`${dateIso}T00:00:00Z`).getTime();
  const days = Math.round(diffMs / 86400000);
  if (days <= 0) return "Bugün";
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} ${month}, ${time}`;
}

// Dashboard'daki "Bugünün Aktiviteleri" ledger-row listesi için — "2 dk önce"
// tarzı kısa göreli zaman. Aynı gün içindeki tamamlanmalar için tasarlandı,
// bu yüzden bir gün öncesine gidince göreli sayım yerine saat/tarihe düşer.
export function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const diffMs = nowMs - new Date(iso).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "az önce";
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  return formatDateTime(iso);
}
