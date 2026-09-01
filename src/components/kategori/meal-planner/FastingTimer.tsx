"use client";

import { useEffect, useState } from "react";
import type { DbFastingSession } from "@hayat-borsasi/shared";
import { ClockIcon, MountainIcon } from "@/components/icons";

// Yazio tasarım dili (2026-08-31, Kategori Bazlı Tasarım Farklılaştırma,
// Bölüm 1) — Aralıklı Oruç, Sağlıklı Beslenme'nin geri kalanından (açık/
// nötr log ekranları) BİLİNÇLİ OLARAK farklı, koyu/atmosferik bir alt-tema
// kullanıyor. Renkler tema tokenlarından (--foreground/--muted, açık/koyu
// tema ile değişir) DEĞİL, sabit değerlerden geliyor — bu ekran tema
// ayarından bağımsız hep koyu kalıyor, bekleme deneyimini farklı hissettirmek
// için kasıtlı bir tasarım kararı.
const FASTING_BG = "#1a2530";
const FASTING_BORDER = "#2a3744";
const FASTING_TEXT = "#f5f7fa";
const FASTING_MUTED = "#8fa2b3";
const FASTING_CHIP_BORDER = "#3a4b5c";
const FASTING_TRACK = "#2a3744";
const FASTING_MAGENTA = "#e91e63";

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
      <div
        className="relative flex flex-col items-center gap-4 overflow-hidden rounded-lg border p-6 text-center"
        style={{ background: FASTING_BG, borderColor: FASTING_BORDER }}
      >
        <MountainIcon
          width={520}
          height={220}
          className="pointer-events-none absolute -bottom-6 left-1/2 -z-0 -translate-x-1/2 opacity-[0.12]"
          style={{ color: FASTING_TEXT }}
        />
        <h2 className="relative z-10 text-lg font-extrabold tracking-tight" style={{ color: FASTING_TEXT }}>
          Aralıklı Oruç
        </h2>
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
          {PRESET_HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setTargetHours(h);
                setCustomOpen(false);
              }}
              className="btn h-8 rounded-lg border-2 px-3 text-xs font-medium"
              style={
                !customOpen && targetHours === h
                  ? { borderColor: "color-mix(in srgb, var(--nutrition-accent) 60%, transparent)", color: "var(--nutrition-accent)" }
                  : { borderColor: FASTING_CHIP_BORDER, color: FASTING_MUTED }
              }
            >
              {h} saat
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomOpen((v) => !v)}
            className="btn h-8 rounded-lg border-2 px-3 text-xs font-medium"
            style={
              customOpen
                ? { borderColor: "color-mix(in srgb, var(--nutrition-accent) 60%, transparent)", color: "var(--nutrition-accent)" }
                : { borderColor: FASTING_CHIP_BORDER, color: FASTING_MUTED }
            }
          >
            Özel
          </button>
        </div>

        {customOpen && (
          <div className="relative z-10 flex items-center gap-2">
            <input
              autoFocus
              type="number"
              min={1}
              max={72}
              placeholder="örn. 24"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="h-9 w-24 rounded-lg border-2 px-3 text-center text-sm outline-none"
              style={{ background: "#141d26", borderColor: FASTING_CHIP_BORDER, color: FASTING_TEXT }}
            />
            <span className="text-xs" style={{ color: FASTING_MUTED }}>
              saat
            </span>
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
          className="btn relative z-10 flex h-11 w-fit items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          style={{ background: FASTING_MAGENTA }}
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
    <div
      className="relative flex flex-col items-center gap-4 overflow-hidden rounded-lg border p-6 text-center"
      style={{ background: FASTING_BG, borderColor: FASTING_BORDER }}
    >
      <MountainIcon
        width={520}
        height={220}
        className="pointer-events-none absolute -bottom-6 left-1/2 -z-0 -translate-x-1/2 opacity-[0.12]"
        style={{ color: FASTING_TEXT }}
      />
      <div className="relative z-10 flex flex-col items-center gap-1">
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: FASTING_TEXT }}>
          Aralıklı Oruç
        </h2>
        <span className="text-xs font-medium" style={{ color: reached ? "var(--nutrition-accent)" : FASTING_MUTED }}>
          Hedef: {session.target_hours} saat{reached ? " — tamamlandı" : ""}
        </span>
      </div>
      <p className="relative z-10 font-mono text-4xl font-semibold tabular-nums" style={{ color: FASTING_TEXT }}>
        {formatDuration(remainingMs)}
      </p>
      <div className="relative z-10 h-1.5 w-full max-w-xs overflow-hidden rounded-full" style={{ background: FASTING_TRACK }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${progress * 100}%`, background: "var(--nutrition-accent)" }}
        />
      </div>
      <button
        type="button"
        onClick={onStop}
        className="btn relative z-10 h-11 w-fit rounded-lg px-5 text-sm font-semibold text-white hover:opacity-90"
        style={{ background: FASTING_MAGENTA }}
      >
        Orucu Bitir
      </button>
    </div>
  );
}
