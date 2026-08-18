"use client";

import { useState } from "react";
import { AppIcon, iconPalette, type IconKey } from "@/components/icons";
import { PopoverPanel } from "@/components/ui/PopoverPanel";
import { useAppData } from "@/lib/supabase/app-data-context";

const iconOptions = Object.keys(iconPalette) as IconKey[];

export function CategoryIconEditor({ categoryId, icon }: { categoryId: string; icon: IconKey }) {
  const { changeCategoryIcon } = useAppData();
  const [open, setOpen] = useState(false);

  async function handlePick(key: IconKey) {
    setOpen(false);
    if (key === icon) return;
    await changeCategoryIcon(categoryId, key);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Sembolü değiştir"
        className="btn flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent hover:bg-accent/25"
      >
        <AppIcon name={icon} width={30} height={30} />
      </button>

      <PopoverPanel
        open={open}
        onClose={() => setOpen(false)}
        className="mt-2 w-80 rounded-2xl border border-border bg-background-elevated p-3 shadow-xl"
      >
        <span className="mb-2 block text-xs text-muted">Sembol seç</span>
        <div className="grid max-h-64 grid-cols-6 gap-2 overflow-y-auto pr-1">
          {iconOptions.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePick(key)}
              className={`btn flex h-10 w-10 items-center justify-center rounded-lg border ${
                icon === key
                  ? "border-accent/50 bg-accent-soft text-accent"
                  : "border-border-soft text-muted hover:border-border hover:text-foreground"
              }`}
            >
              <AppIcon name={key} width={18} height={18} />
            </button>
          ))}
        </div>
      </PopoverPanel>
    </div>
  );
}
