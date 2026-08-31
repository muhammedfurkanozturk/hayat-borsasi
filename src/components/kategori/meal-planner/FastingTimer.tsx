"use client";

import { useEffect, useState } from "react";
import type { DbFastingSession } from "@hayat-borsasi/shared";
import { ClockIcon } from "@/components/icons";

const PRESET_HOURS = [14, 16, 18, 20];

// 2026-08-28 (kullanıcı isteği): sayaç artık saniyeye kadar (saat:dk:sn)
// canlı güncelleniyor — önceki 30sn'lik interval bunun için yetersizdi,
// 1sn'ye indirildi.
function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}s ${String(m).padStart(2, "0")}dk ${String(s).padStart(2, "0")}sn`;
}

// OpenNutriTracker'daki (piyasa araştırması) aralıklı oruç zamanlayıcısı
// fikri — sunucudaki fasting_sessions.start_at'a göre istemci tarafında
// canlı sayan basit bir sayaç, ekstra bir arka plan job'u yok.
export function FastingTimer({
  session,
  onStart,
  onStop,
  starting,
}: {
  session: DbFastingSession | null;
  onStart: (targetHours: number) => void;
  onStop: () => void;
  starting: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [targetHours, setTargetHours] = useState(16);
  const [customOpen, setCustomOpen] = useState(false);
  const [customHours, setCustomHours] = useState("");

  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface shadow-card p-6 text-center">
        <h2 className="text-sm font-medium text-foreground">Aralıklı Oruç</h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PRESET_HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setTargetHours(h);
                setCustomOpen(false);
              }}
              className={`btn h-8 rounded-lg border-2 px-3 text-xs font-medium ${
                !customOpen && targetHours === h
                  ? "border-accent/50 text-accent"
                  : "border-muted/30 text-muted hover:text-foreground"
              }`}
            >
              {h} saat
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomOpen((v) => !v)}
            className={`btn h-8 rounded-lg border-2 px-3 text-xs font-medium ${
              customOpen ? "border-accent/50 text-accent" : "border-muted/30 text-muted hover:text-foreground"
            }`}
          >
            Özel
          </button>
        </div>

        {customOpen && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="number"
              min={1}
              max={72}
              placeholder="örn. 24"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="h-9 w-24 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 text-center text-sm text-foreground outline-none focus:border-accent/50"
            />
            <span className="text-xs text-muted">saat</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            const custom = Math.round(Number(customHours));
            const hours = customOpen && custom > 0 ? custom : targetHours;
            onStart(hours);
          }}
          disabled={starting || (customOpen && !(Math.round(Number(customHours)) > 0))}
          className="btn flex h-11 w-fit items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          <ClockIcon width={16} height={16} />
          Orucu Başlat
        </button>
      </div>
    );
  }

  const elapsedMs = now - new Date(session.start_at).getTime();
  const targetMs = session.target_hours * 3600000;
  const progress = Math.min(1, elapsedMs / targetMs);
  const reached = progress >= 1;
  // 2026-08-28 (kullanıcı bulgusu): sayaç yukarı değil, hedefe kalan süreyi
  // gösterecek şekilde AŞAĞI saymalı.
  const remainingMs = Math.max(0, targetMs - elapsedMs);

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface shadow-card p-6 text-center">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-sm font-medium text-foreground">Aralıklı Oruç</h2>
        <span className={`text-xs font-medium ${reached ? "text-positive" : "text-muted"}`}>
          Hedef: {session.target_hours} saat{reached ? " — tamamlandı" : ""}
        </span>
      </div>
      <p className="font-mono text-4xl font-semibold tabular-nums text-foreground">{formatDuration(remainingMs)}</p>
      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-border-soft">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${reached ? "bg-positive" : "bg-accent"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onStop}
        className="btn h-9 w-fit rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground"
      >
        Orucu Bitir
      </button>
    </div>
  );
}
