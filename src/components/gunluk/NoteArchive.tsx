"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { ArchivedNoteView } from "@/components/gunluk/ArchivedNoteView";
import type { EditTarget } from "@/components/gunluk/types";
import { createClient } from "@/lib/supabase/client";
import { fetchEntriesForMonth, todayIso } from "@/lib/supabase/daily";

const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

type View = "months" | "day" | "note";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Yıl her zaman görünür (tıklamaya gerek yok, ok tuşlarıyla değişir), altında
// ayları gösterir. Bir aya tıklayınca o ayın günleri, bir güne tıklayınca o
// tarihin notu açılır. Notu olan günler işaretlenir.
export function NoteArchive({ onEdit }: { onEdit: (target: EditTarget) => void }) {
  const [view, setView] = useState<View>("months");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [daysWithNotes, setDaysWithNotes] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (view !== "day" || month === null) return;
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || month === null) return;

      const entries = await fetchEntriesForMonth(supabase, user.id, year, month);
      if (!cancelled) {
        const withNotes = new Set(
          entries.filter((e) => e.note_text.trim().length > 0).map((e) => Number(e.date.slice(8, 10)))
        );
        setDaysWithNotes(withNotes);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [view, year, month]);

  if (view === "note" && month !== null && day !== null) {
    const dateIso = `${year}-${pad(month + 1)}-${pad(day)}`;
    const label = `${day} ${monthNames[month]} ${year} nasıl geçti?`;
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setView("day")}
          className="flex w-fit items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeftIcon width={16} height={16} />
          {monthNames[month]} {year}
        </button>
        <ArchivedNoteView
          date={dateIso}
          dateLabel={label}
          onEdit={(target) => {
            onEdit(target);
            setView("day");
          }}
        />
      </div>
    );
  }

  if (view === "day" && month !== null) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();
    const todayDay = Number(todayIso().slice(8, 10));

    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
        <button
          type="button"
          onClick={() => setView("months")}
          className="flex w-fit items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeftIcon width={16} height={16} />
          {year}
        </button>
        <h2 className="text-sm font-medium text-foreground">{monthNames[month]}</h2>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
          {days.map((d) => {
            const isFuture = `${year}-${pad(month + 1)}-${pad(d)}` > todayIso();
            return (
              <button
                key={d}
                type="button"
                disabled={isFuture}
                onClick={() => {
                  setDay(d);
                  setView("note");
                }}
                className={`relative flex h-12 items-center justify-center rounded-lg border-2 font-mono text-sm tabular-nums transition-colors ${
                  isFuture
                    ? "cursor-not-allowed border-border-soft text-muted-soft opacity-40"
                    : isCurrentMonth && d === todayDay
                      ? "border-accent/60 bg-accent-soft text-accent"
                      : "border-muted/30 bg-background-elevated text-foreground hover:border-accent/50"
                }`}
              >
                {d}
                {daysWithNotes.has(d) && (
                  <span className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-positive" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Günlükler Arşivi</h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-muted/30 bg-background-elevated text-muted hover:border-accent/50"
          aria-label="Önceki yıl"
        >
          ‹
        </button>
        <div className="flex h-11 flex-1 items-center justify-center rounded-lg border-2 border-muted/30 bg-background-elevated font-mono text-lg font-semibold text-foreground">
          {year}
        </div>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-muted/30 bg-background-elevated text-muted hover:border-accent/50"
          aria-label="Sonraki yıl"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {monthNames.map((name, idx) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setMonth(idx);
              setView("day");
            }}
            className="flex h-14 items-center justify-center rounded-lg border-2 border-muted/30 bg-background-elevated text-sm font-medium text-foreground hover:border-accent/50"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
