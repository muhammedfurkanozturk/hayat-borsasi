"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { ScaleIcon, SearchIcon, TrendUpIcon, WalletIcon, type IconProps } from "@/components/icons";

const pillSpring = { type: "spring", stiffness: 420, damping: 32, mass: 0.9 } as const;

// Sağlıklı Beslenme/Spor & Vücut'taki sekmeli alt-sayfa deseniyle AYNI —
// Madde 4 (Simply Wall St) turunda Finans & Portföy'e eklendi, Madde 5
// (Sharesight) "Vergi & Araçlar" sekmesini ekledi.
export type FinanceTab = "markets" | "portfolio" | "screener" | "tools";

const TABS: { value: FinanceTab; label: string; icon: (props: IconProps) => React.JSX.Element }[] = [
  { value: "markets", label: "Piyasalar", icon: TrendUpIcon },
  { value: "portfolio", label: "Portföyüm", icon: WalletIcon },
  { value: "screener", label: "Hisse Tarama", icon: SearchIcon },
  { value: "tools", label: "Vergi & Araçlar", icon: ScaleIcon },
];

export function FinanceTabBar({ value, onChange }: { value: FinanceTab; onChange: (value: FinanceTab) => void }) {
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
                active ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`finance-tab-pill-${instanceId}`}
                  className="absolute inset-0 rounded-lg bg-accent-soft"
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
