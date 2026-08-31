"use client";

import { useEffect, useState } from "react";

function formatPrecise(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}g ${hours}s ${minutes}d ${seconds}sn`;
}

// Quitzilla'daki (piyasa araştırması) saniyeye kadar hassas sayaç fikri —
// `since` son nükseme zamanı (yoksa görevin oluşturulma zamanı), her
// saniye canlı güncelleniyor.
export function PreciseCounter({ since }: { since: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - new Date(since).getTime();
  return <span className="font-mono text-sm tabular-nums text-foreground">{formatPrecise(elapsed)}</span>;
}
