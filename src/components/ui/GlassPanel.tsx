"use client";

import { motion, type MotionStyle } from "motion/react";
import type { ReactNode } from "react";

// Landing sayfasındaki her tam-ekran bölümün paylaştığı camsı panel kabuğu.
// 2026-08-25: kullanıcı isteğiyle büyük köşe yuvarlaması + renkli gradient
// dolgu (Terminal Ledger turunda kaldırılmıştı) TAM olarak geri getirildi —
// bir önceki turda sadece blur/saydamlık geri getirilmişti, bu sefer eski
// hâliyle birebir (kenarlık yok, çerçeve hissi bilerek yok — sadece blur +
// bölüme özel renk geçişli dolgu + yumuşak gölge panelin "yüzdüğü" hissini
// veriyor).
export function GlassPanel({
  children,
  gradient,
  motionStyle,
  className = "",
}: {
  children: ReactNode;
  gradient: string;
  motionStyle?: MotionStyle;
  className?: string;
}) {
  return (
    <motion.div
      style={{ ...motionStyle, boxShadow: "var(--glass-shadow)" }}
      className={`relative flex w-full flex-col overflow-hidden rounded-[1.75rem] backdrop-blur-lg sm:rounded-[2.5rem] ${className}`}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: gradient }} aria-hidden />
      {/* flex-1 + justify-center: içerik panelin min-height'ından kısa kalsa
          bile (ör. metin/görsel bloğu tam 78vh etmiyorsa) kalan boşluk üste/
          alta simetrik dağılır — hepsi altta birikip panelin dibinde boş bir
          alan bırakmaz. */}
      <div className="relative flex flex-1 flex-col justify-center">{children}</div>
    </motion.div>
  );
}
