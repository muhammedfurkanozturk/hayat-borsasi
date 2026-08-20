"use client";

import { useEffect, useState } from "react";
import {
  daysAgoIso,
  deleteDigitalFocusLog,
  fetchDigitalFocusLogs,
  insertDigitalFocusLog,
  todayIso,
  type DbDigitalFocusLog,
} from "@hayat-borsasi/shared";
import { TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

const HISTORY_WINDOW_DAYS = 14;

export function DigitalFocusPanel({ categoryId }: { categoryId: string }) {
  const [logs, setLogs] = useState<DbDigitalFocusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteName, setSiteName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const rows = await fetchDigitalFocusLogs(supabase, categoryId, daysAgoIso(HISTORY_WINDOW_DAYS));
    setLogs(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mins = Number(minutes);
    if (!siteName.trim() || !(mins > 0)) return;

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertDigitalFocusLog(supabase, user.id, categoryId, todayIso(), siteName.trim(), mins);
      setLogs((prev) => [created, ...prev]);
      setSiteName("");
      setMinutes("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await deleteDigitalFocusLog(supabase, id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  }

  const today = todayIso();
  const todayTotal = logs.filter((l) => l.date === today).reduce((sum, l) => sum + l.minutes, 0);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Dijital Gelişim</h2>
      <p className="text-xs text-muted">
        Bir web sayfası başka sekmelerde ne yaptığını göremez — bu yüzden üretken sitelerde geçirdiğin
        süreyi kendin giriyorsun.
      </p>

      <div className="flex items-center justify-between rounded-lg border-2 border-muted/20 bg-background-elevated px-4 py-3 text-sm">
        <span className="text-muted">Bugünkü toplam</span>
        <span className="font-mono tabular-nums text-foreground">{todayTotal} dk</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border-2 border-muted/30 p-3 sm:flex-row sm:items-center">
        <input
          value={siteName}
          onChange={(e) => setSiteName(e.target.value)}
          placeholder="Site/uygulama (örn. GitHub)"
          className="h-10 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        <input
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="Dakika"
          inputMode="numeric"
          className="h-10 w-28 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn h-10 shrink-0 rounded-lg bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Ekleniyor..." : "Ekle"}
        </button>
      </form>

      {!loading && logs.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {logs.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 rounded-lg border-2 border-muted/20 px-3 py-2 text-sm">
              <span className="flex-1 text-foreground">{entry.site_name}</span>
              <span className="font-mono text-xs tabular-nums text-muted">{entry.minutes} dk</span>
              <span className="text-xs text-muted">{entry.date}</span>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                aria-label="Kaydı sil"
                className="btn text-muted hover:text-negative"
              >
                <TrashIcon width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
