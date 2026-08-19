export function formatTodayLong(): string {
  const now = new Date();
  const day = new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(now);
  const month = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(now);
  const weekday = new Intl.DateTimeFormat("tr-TR", { weekday: "long" }).format(now);
  return `${day} ${month} ${weekday}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("tr-TR", { month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${day} ${month}, ${time}`;
}
