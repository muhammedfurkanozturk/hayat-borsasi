"use client";

import { motion } from "motion/react";

export interface TickerItem {
  id: string;
  label: string;
  delta: number;
}

// DESIGN.md'deki imza öğe — köşedeki bulanık glow'un yerini alan, tek
// "cesur" öğe. Kategori kutucuklarıyla aynı yıllık katkı oranını (delta)
// borsa ticker formatında gösteriyor; ikinci bir "günlük değişim" metriği
// icat etmiyor (bilinçli karar — bölüm 5'teki dünle-kıyaslama yerine
// yıllık katkıya geçiş kararıyla tutarlı kalması için).
//
// Dashboard'un TEK koreografili yükleme animasyonunun ilk adımı burada
// başlıyor (bkz. DESIGN.md "Terminal Ledger" — Aşama 3): şerit yukarıdan
// kayarak belirir, ardından PeriodIndexCard'daki sayı sayarak, ardından
// kategori kutucukları sırayla beliriyor. prefers-reduced-motion'da
// globals.css'teki genel kural bu geçişi de anında bitiriyor.
export function MarketTicker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;
  // Kesintisiz döngü için liste iki kez art arda basılıyor, track %50
  // kayınca (bkz. globals.css .ticker-track) sıfıra dönmüş gibi görünüyor.
  const doubled = [...items, ...items];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full min-w-0 overflow-hidden border-b border-border bg-surface"
      aria-hidden="true"
    >
      <div className="ticker-track flex w-max items-center gap-8 whitespace-nowrap px-4 py-2">
        {doubled.map((item, i) => (
          <span key={`${item.id}-${i}`} className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            <span className="font-semibold uppercase tracking-wider text-muted">{item.label}</span>
            <span className={item.delta >= 0 ? "text-positive" : "text-negative"}>
              {item.delta >= 0 ? "▲" : "▼"} {Math.abs(item.delta).toFixed(1)}%
            </span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}
