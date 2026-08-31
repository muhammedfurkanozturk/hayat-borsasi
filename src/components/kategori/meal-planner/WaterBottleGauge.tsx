"use client";

import { motion, useReducedMotion } from "motion/react";

const BOTTLE_PATH =
  "M20 4h20v10c0 2 4 3 4 8v66a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V22c0-5 4-6 4-8V4z";
const INNER_TOP = 14;
const INNER_BOTTOM = 92;

// 2026-08-29 (kullanıcı bulgusu, üç turda düzeltildi): dolgu ve dalga aynı
// fillOpacity'e alınmıştı ama dalga `translate(0,-8)` ile YUKARI kaydığı
// için tepe noktaları gövdenin üst kenarının (y=0) DA ÜSTÜNE taşıyordu —
// orada gövde olmadığından SADECE dalga (tek katman) görünüyor, bu da
// kullanıcının fark ettiği gibi gövdeyle birebir aynı tonda (aynı tek
// katman) bir "üst açık mavi" şerit yaratıyordu. Kaldırılan `translate`
// ile dalga artık y=0'ın üstüne HİÇ taşmıyor — tepe noktaları tam y=0'da
// (gövdenin üst kenarıyla aynı hizada), çukur noktaları y=4'te (gövdeyle
// 4 birim ek örtüşme) — bu örtüşen kısım iki katman üst üste bindiği için
// koyulaşıp dalganın kendisini oluşturuyor, üstünde açık kalan bir şerit
// kalmıyor.
const WAVE_PATH = "M0,4 Q7.5,0 15,4 T30,4 T45,4 T60,4 T75,4 T90,4 V12 H0 Z";
const FILL_OPACITY = 0.6;

// Damla ikonları yerine — bugünkü toplam su tüketiminin hedefe oranını,
// alttan yukarı `clipPath` ile dolan bir şişe silüetiyle gösteriyor.
// 2026-08-28 (kullanıcı isteği): büyütüldü + su yüzeyine basit bir dalga
// animasyonu eklendi. 2026-08-29: "taşma" damla animasyonu (celebrateKey)
// kullanıcı isteğiyle KALDIRILDI — kalitesiz bulundu, hedefe ulaşma artık
// sadece WaterTracker'daki ayrı bir rozetle gösteriliyor.
export function WaterBottleGauge({ percent, size = 96 }: { percent: number; size?: number }) {
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const fillHeight = ((INNER_BOTTOM - INNER_TOP) * clamped) / 100;
  const fillY = INNER_BOTTOM - fillHeight;
  const height = Math.round(size * (100 / 60));

  return (
    <svg viewBox="0 0 60 100" width={size} height={height} className="shrink-0" aria-hidden>
      <defs>
        <clipPath id="water-bottle-clip">
          <path d={BOTTLE_PATH} />
        </clipPath>
      </defs>

      <path d={BOTTLE_PATH} fill="var(--background-elevated)" />

      <g clipPath="url(#water-bottle-clip)">
        <motion.g
          initial={prefersReducedMotion ? false : { y: INNER_BOTTOM }}
          animate={{ y: fillY }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Sabit büyük yükseklik — grup zaten fillY'e kaydırılıyor,
              clipPath şişenin gerçek dışına taşan kısmı zaten kırpıyor,
              bu yüzden fillHeight ile birebir eşleşmesi gerekmiyor. */}
          <rect x={0} y={0} width={60} height={200} fill="var(--accent)" fillOpacity={FILL_OPACITY} />
          {!prefersReducedMotion && clamped > 0 && (
            <motion.path
              d={WAVE_PATH}
              fill="var(--accent)"
              fillOpacity={FILL_OPACITY}
              animate={{ x: [0, -30] }}
              transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
            />
          )}
        </motion.g>
      </g>

      <path d={BOTTLE_PATH} fill="none" stroke="var(--border)" strokeWidth={2} />
    </svg>
  );
}
