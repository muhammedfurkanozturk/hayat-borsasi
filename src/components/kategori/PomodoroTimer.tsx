"use client";

import { useEffect, useRef, useState } from "react";
import { fetchFocusSessionsSince, insertFocusSession, todayIso, type DbFocusSession } from "@hayat-borsasi/shared";
import { createClient } from "@/lib/supabase/client";

const FOCUS_MINUTES = 25;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PomodoroTimer({ categoryId }: { categoryId: string }) {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<DbFocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadSessions() {
    const supabase = createClient();
    const rows = await fetchFocusSessionsSince(supabase, categoryId, `${todayIso()}T00:00:00Z`);
    setSessions(rows);
    setLoading(false);
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          void handleComplete();
          return FOCUS_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function handleComplete() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const created = await insertFocusSession(supabase, user.id, categoryId, FOCUS_MINUTES);
    setSessions((prev) => [created, ...prev]);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(FOCUS_SECONDS);
  }

  const todayTotalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Pomodoro</h2>

      <div className="flex flex-col items-center gap-4 py-2">
        <span className="font-mono text-5xl tabular-nums text-foreground">{formatTime(secondsLeft)}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning((v) => !v)}
            className="btn h-10 rounded-lg bg-accent-soft px-6 text-sm font-semibold text-accent hover:bg-accent/25"
          >
            {running ? "Duraklat" : "Başlat"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="btn h-10 rounded-lg border-2 border-muted/30 px-6 text-sm text-muted hover:text-foreground"
          >
            Sıfırla
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border-2 border-muted/20 bg-background-elevated px-4 py-3 text-sm">
        <span className="text-muted">Bugünkü toplam odaklanma</span>
        <span className="font-mono tabular-nums text-foreground">
          {loading ? "…" : `${todayTotalMinutes} dk (${sessions.length} seans)`}
        </span>
      </div>
    </div>
  );
}
