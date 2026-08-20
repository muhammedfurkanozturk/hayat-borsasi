"use client";

import { useEffect, useState } from "react";
import {
  calculateStreak,
  daysAgoIso,
  deleteHabitNote,
  fetchHabitNotes,
  fetchRelapses,
  fetchTaskCompletionDates,
  fillDateRange,
  insertHabitNote,
  todayIso,
  upsertRelapse,
  type DbHabitNote,
  type DbHabitRelapse,
} from "@hayat-borsasi/shared";
import { ChevronDownIcon, FlameIcon, TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { useAppData, type Task } from "@/lib/supabase/app-data-context";

const STREAK_WINDOW_DAYS = 120;

export function HabitBreakCard({ task }: { task: Task }) {
  const { toggleTask } = useAppData();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [relapses, setRelapses] = useState<DbHabitRelapse[]>([]);
  const [notes, setNotes] = useState<DbHabitNote[]>([]);
  const [relapseNote, setRelapseNote] = useState("");
  const [loggingRelapse, setLoggingRelapse] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function loadDetails() {
    const supabase = createClient();
    const since = daysAgoIso(STREAK_WINDOW_DAYS);
    const [dates, relapseRows, noteRows] = await Promise.all([
      fetchTaskCompletionDates(supabase, task.id, since),
      fetchRelapses(supabase, task.id),
      fetchHabitNotes(supabase, task.id),
    ]);
    setStreak(calculateStreak(fillDateRange(dates, since, todayIso())));
    setRelapses(relapseRows);
    setNotes(noteRows);
    setLoading(false);
  }

  useEffect(() => {
    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  async function handleRelapse() {
    setLoggingRelapse(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await upsertRelapse(supabase, user.id, task.id, todayIso(), relapseNote.trim());
      if (task.completed) await toggleTask(task.id);
      await loadDetails();
      setRelapseNote("");
    }
    setLoggingRelapse(false);
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertHabitNote(supabase, user.id, task.id, newNote.trim());
      setNotes((prev) => [created, ...prev]);
      setNewNote("");
    }
    setSavingNote(false);
  }

  async function handleDeleteNote(noteId: string) {
    const supabase = createClient();
    await deleteHabitNote(supabase, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  return (
    <div className="rounded-xl border-2 border-muted/30 bg-background-elevated">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="btn flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <FlameIcon width={18} height={18} className="shrink-0 text-accent" />
        <span className="flex-1 text-sm font-medium text-foreground">{task.title}</span>
        {!loading && (
          <span className="flex items-center gap-3 font-mono text-xs tabular-nums text-muted">
            <span>🔥 {streak.current} gün</span>
            <span>🏆 {streak.longest} gün</span>
          </span>
        )}
        <ChevronDownIcon
          width={18}
          height={18}
          className={`shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t-2 border-muted/20 px-4 py-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Bugün nüksettim</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={relapseNote}
                onChange={(e) => setRelapseNote(e.target.value)}
                placeholder="Ne oldu, tetikleyici neydi? (opsiyonel)"
                className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
              />
              <button
                type="button"
                onClick={handleRelapse}
                disabled={loggingRelapse}
                className="btn h-10 shrink-0 rounded-lg border-2 border-negative/30 px-4 text-sm font-medium text-negative hover:bg-negative/10 disabled:pointer-events-none disabled:opacity-50"
              >
                {loggingRelapse ? "Kaydediliyor..." : "Nüksetmeyi Kaydet"}
              </button>
            </div>
            {relapses.length > 0 && (
              <p className="px-1 text-xs text-muted">
                Son nüksetme: {relapses[0].date}
                {relapses[0].note_text && ` — "${relapses[0].note_text}"`}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Motivasyon Notların
            </span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Neden bırakıyorsun? Kendine bir not bırak..."
                className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={savingNote || !newNote.trim()}
                className="btn h-10 shrink-0 rounded-lg bg-accent-soft px-4 text-sm font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
              >
                Ekle
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="px-1 text-sm text-muted">Henüz not yok.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-start gap-2 rounded-lg border-2 border-muted/20 bg-surface px-3 py-2 text-sm text-foreground"
                  >
                    <span className="flex-1">{note.note_text}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label="Notu sil"
                      className="btn shrink-0 text-muted hover:text-negative"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
