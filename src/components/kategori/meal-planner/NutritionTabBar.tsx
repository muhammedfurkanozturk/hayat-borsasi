"use client";

import { useId } from "react";
import { motion } from "motion/react";
import {
  ClockIcon,
  DropletIcon,
  LightbulbIcon,
  ListCheckIcon,
  TargetIcon,
  UtensilsIcon,
  type IconProps,
} from "@/components/icons";

const pillSpring = { type: "spring", stiffness: 420, damping: 32, mass: 0.9 } as const;

export type NutritionTab = "checklist" | "log" | "water" | "fasting" | "calorie" | "recipes";

const TABS: { value: NutritionTab; label: string; icon: (props: IconProps) => React.JSX.Element }[] = [
  { value: "checklist", label: "Checklist", icon: ListCheckIcon },
  { value: "log", label: "Öğün Kaydı", icon: UtensilsIcon },
  { value: "water", label: "Su", icon: DropletIcon },
  { value: "fasting", label: "Aralıklı Oruç", icon: ClockIcon },
  { value: "calorie", label: "Kalori Takibi", icon: TargetIcon },
  { value: "recipes", label: "Tarifler", icon: LightbulbIcon },
];

// Kullanıcının verdiği referans component'in (bottom-nav-bar — ikon her
// zaman görünür, etiket sadece aktif sekmede genişleyerek belirir)
// ETKİLEŞİM dilini alıyor — ama lucide-react/framer-motion yerine sitenin
// kendi ikon setini (icons.tsx) ve motion kütüphanesini kullanıyor, pill
// rengi tek vurgu (accent) token'ından geliyor, köşe `rounded-lg` tavanını
// koruyor (2026-09-01 Terminal Ledger kuralı — referansın rounded-full'ü
// birebir alınmadı). Sayfa ortasında durması ve öncekinden büyükçe olması
// (2026-08-28, kullanıcı isteği) için ayrı, özel bir component.
export function NutritionTabBar({ value, onChange }: { value: NutritionTab; onChange: (value: NutritionTab) => void }) {
  const instanceId = useId();

  return (
    <div className="flex justify-center overflow-x-auto">
      <div className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-background-elevated p-1.5">
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
                active ? "text-[color:var(--nutrition-accent)]" : "text-muted hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`nutrition-tab-pill-${instanceId}`}
                  className="absolute inset-0 rounded-lg bg-[color:var(--nutrition-accent)]/15"
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
