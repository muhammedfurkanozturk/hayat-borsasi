"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import type { TaskFrequency } from "@/lib/supabase/app-data-context";

const frequencyOptions: { value: TaskFrequency; label: string }[] = [
  { value: "daily", label: "Günlük" },
  { value: "weekly", label: "Haftalık" },
  { value: "monthly", label: "Aylık" },
];

// Görev periyodunu (Günlük/Haftalık/Aylık) hem yeni görev eklerken hem de
// mevcut bir görevi düzenlerken aynı mantıkla seçmek için kullanılan
// paylaşılan aşağı-açılır bileşen.
export function FrequencyDropdown({
  value,
  onChange,
}: {
  value: TaskFrequency;
  onChange: (value: TaskFrequency) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = frequencyOptions.find((option) => option.value === value)?.label ?? "Günlük";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-10 items-center gap-2 rounded-lg border-2 border-muted/30 bg-background-elevated px-3 text-sm text-foreground hover:border-accent/50"
      >
        {label}
        <ChevronDownIcon
          width={14}
          height={14}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-background-elevated p-1 shadow-xl">
            {frequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                  value === option.value ? "bg-accent-soft text-accent" : "text-foreground hover:bg-surface-hover"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
