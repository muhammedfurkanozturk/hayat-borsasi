"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { BookIcon, CompassIcon, DumbbellIcon, PulseIcon, ScaleIcon, UserIcon, type IconProps } from "@/components/icons";

const pillSpring = { type: "spring", stiffness: 420, damping: 32, mass: 0.9 } as const;

// MuscleWiki'den (piyasa araştırması) ilham alınan Spor & Vücut zenginleştirme
// turu — Sağlıklı Beslenme'deki NutritionTabBar ile AYNI desen/etkileşim
// dili (bkz. o dosyadaki yorum). 2026-08-29: 6 sekmeyle tamamlandı (Hareketlerim,
// Kas Haritası, Antrenman Oluştur, Kütüphane, Takip, Hesaplayıcılar).
export type SportTab = "workout" | "muscle-map" | "builder" | "library" | "tracking" | "calculators";

const TABS: { value: SportTab; label: string; icon: (props: IconProps) => React.JSX.Element }[] = [
  { value: "workout", label: "Hareketlerim", icon: DumbbellIcon },
  { value: "muscle-map", label: "Kas Haritası", icon: UserIcon },
  { value: "builder", label: "Antrenman Oluştur", icon: CompassIcon },
  { value: "library", label: "Kütüphane", icon: BookIcon },
  { value: "tracking", label: "Takip", icon: PulseIcon },
  { value: "calculators", label: "Hesaplayıcılar", icon: ScaleIcon },
];

export function SportTabBar({ value, onChange }: { value: SportTab; onChange: (value: SportTab) => void }) {
  const instanceId = useId();

  return (
    <div className="flex justify-center overflow-x-auto">
      <div className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--sport-border)] bg-[color:var(--sport-elevated)] p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = value === t.value;
          return (
            <motion.button
              key={t.value}
              layout
              type="button"
              onClick={() => onChange(t.value)}
              aria-pressed={active}
              className={`btn relative flex h-11 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap ${
                active ? "text-[color:var(--sport-accent)]" : "text-[color:var(--sport-muted)] hover:text-[color:var(--sport-text)]"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`sport-tab-pill-${instanceId}`}
                  className="absolute inset-0 rounded-lg bg-[color:var(--sport-accent)]/15"
                  transition={pillSpring}
                />
              )}
              <Icon width={19} height={19} className="relative z-10 shrink-0" />
              {active && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={pillSpring}
                  className="relative z-10 overflow-hidden"
                >
                  {t.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
