"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { ArchivedNoteView } from "@/components/gunluk/ArchivedNoteView";
import { GunlukCalendar } from "@/components/gunluk/GunlukCalendar";
import type { EditTarget } from "@/components/gunluk/types";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesForMonth, todayIso } from "@/lib/supabase/daily";
import type { DbDailyEntry } from "@hayat-borsasi/shared";

const monthNames = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Ardışık ISO tarihlerden (bu ayki not tutulan günler) en uzun kesintisiz
// seriyi hesaplıyor — habits.ts'teki calculateStreak'ten kasıtlı olarak
// ayrı: o "bugünden geriye kesintisiz seri" (relapse mantığı) hesaplıyor,
// bu ise sadece görüntülenen ay içinde en uzun ardışık bloğu buluyor —
// farklı bir soru, ayrı bir fonksiyon.
function longestStreakInMonth(isoDates: string[]): number {
  if (isoDates.length === 0) return 0;
  const sorted = [...isoDates].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round(
      (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86_400_000
    );
    current = diffDays === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

// Bölüm 8 (2026-08-25) — önceki "ay listesi → gün ızgarası → not" 3
// katmanlı arşiv, Day-One tarzı TEK bir sürekli takvime indirildi
// (react-day-picker, bkz. GunlukCalendar.tsx): ay geçişleri artık ayrı bir
// ekran değil, takvimin kendi ok tuşlarıyla oluyor. Bir güne tıklamak
// doğrudan o günün notunu açıyor — geri dönünce aynı takvime (aynı ay/gün
// seçili) dönülüyor.
//
// 2026-08-26: takvim kendi doğal genişliğinde (~320px) kalırken kart tüm
// sayfa genişliğini kaplıyordu, sağda büyük boş alan kalıyordu. Kullanıcının
// önerdiği 3 seçenekten C'yi (boşluğu anlamlı içerikle doldur) uyguladık:
// takvimin yanına o ayki not istatistikleri (gün sayısı, en uzun seri) +
// son notun küçük bir önizlemesi eklendi.
export function NoteArchive({ onEdit }: { onEdit: (target: EditTarget) => void }) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthEntries, setMonthEntries] = useState<DbDailyEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const entries = await fetchEntriesForMonth(supabase, user.id, month.getFullYear(), month.getMonth());
      if (!cancelled) {
        setMonthEntries(entries);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const notesThisMonth = monthEntries.filter((e) => e.note_text.trim().length > 0);
  const daysWithNotes = new Set(notesThisMonth.map((e) => e.date));
  const longestStreak = longestStreakInMonth([...daysWithNotes]);
  const latestNote = [...notesThisMonth].sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null;

  if (selectedDate) {
    const dateIso = toIso(selectedDate);
    const label = `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()} nasıl geçti?`;
    return (
      <div className="modal-in flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setSelectedDate(null)}
          className="btn flex w-fit items-center gap-2 rounded-md text-sm text-muted hover:text-foreground"
        >
          <ArrowLeftIcon width={16} height={16} />
          Takvime dön
        </button>
        <ArchivedNoteView
          date={dateIso}
          dateLabel={label}
          onEdit={(target) => {
            onEdit(target);
            setSelectedDate(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface shadow-card p-5 lg:flex-row lg:items-start">
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-foreground">Günlükler Arşivi</h2>
        <GunlukCalendar
          month={month}
          onMonthChange={setMonth}
          onSelectDay={setSelectedDate}
          daysWithNotes={daysWithNotes}
          disabledAfter={new Date(`${todayIso()}T23:59:59`)}
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 border-border-soft pt-2 lg:border-l lg:pl-6 lg:pt-9">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-lg border border-border-soft bg-background-elevated p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Bu Ay Not Tutulan Gün</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {notesThisMonth.length}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border-soft bg-background-elevated p-4">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">En Uzun Seri</span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {longestStreak} <span className="text-sm font-normal text-muted">gün</span>
            </span>
          </div>
        </div>

        {latestNote ? (
          <button
            type="button"
            onClick={() => {
              const [y, m, d] = latestNote.date.split("-").map(Number);
              setSelectedDate(new Date(y, m - 1, d));
            }}
            className="btn flex flex-col items-start gap-1.5 rounded-lg border border-border-soft bg-background-elevated p-4 text-left hover:border-accent/40"
          >
            <span className="text-xs font-medium text-muted">
              Son not — {new Date(`${latestNote.date}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
            </span>
            <p className="line-clamp-3 text-sm text-foreground">{latestNote.note_text}</p>
          </button>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-soft p-4 text-center text-sm text-muted">
            Bu ay henüz not yok — bir güne tıklayıp yazmaya başlayabilirsin.
          </div>
        )}
      </div>
    </div>
  );
}
