"use client";

import { useId, type ReactNode } from "react";
import { motion } from "motion/react";

const pillSpring = { type: "spring", stiffness: 500, damping: 34, mass: 0.9 } as const;

// Uygulama genelinde tekrar eden "pill" seçici deseni (tema, periyot, grafik
// tipi, faturalama vb.) için tek, paylaşılan bileşen. Vurgu katmanı gerçek
// Motion `layoutId` ile paylaşılan bir eleman olarak animasyonlanıyor —
// seçenek değişince yay fiziğiyle bir sonraki butonun altına "akıyor"
// (21st.dev'deki segmented control'lerdeki gibi), CSS transform enterpolasyonu
// değil.
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
}: {
  options: { value: T; label: ReactNode; ariaLabel?: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const instanceId = useId();
  const padding = size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <div
      className={`relative grid items-stretch gap-0 rounded-lg border border-border-soft bg-background-elevated p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-label={option.ariaLabel}
            aria-pressed={active}
            className={`btn relative flex items-center justify-center gap-1.5 rounded-md text-center font-medium whitespace-nowrap ${padding} ${
              active ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`segmented-pill-${instanceId}`}
                className="absolute inset-0 rounded-md bg-accent-soft"
                transition={pillSpring}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
