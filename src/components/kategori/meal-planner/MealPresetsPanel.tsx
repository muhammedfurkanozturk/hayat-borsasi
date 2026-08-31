"use client";

import { useState } from "react";
import { StarIcon, TrashIcon } from "@/components/icons";
import type { DbMeal, DbMealPreset, DbMealPresetItem } from "@hayat-borsasi/shared";

// "Sık Yapılan Öğünler" (2026-08-28, Bölüm 2e) — MealSection'daki yıldız
// butonuyla kaydedilen şablonları listeler. Bir şablona tıklayınca o günün
// öğünlerinden hangisine ekleneceği soruluyor (FastingTimer'daki hazır-süre
// buton dizisiyle aynı basit desen).
export function MealPresetsPanel({
  presets,
  items,
  meals,
  onApply,
  onDelete,
}: {
  presets: DbMealPreset[];
  items: DbMealPresetItem[];
  meals: DbMeal[];
  onApply: (presetId: string, mealId: string) => void;
  onDelete: (presetId: string) => void;
}) {
  const [openPresetId, setOpenPresetId] = useState<string | null>(null);

  if (presets.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border-2 border-muted/25 p-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">Sık Yapılan Öğünler</span>
      <div className="flex flex-col gap-2">
        {presets.map((preset) => {
          const itemCount = items.filter((i) => i.preset_id === preset.id).length;
          const open = openPresetId === preset.id;
          return (
            <div key={preset.id} className="flex flex-col gap-2 rounded-lg border border-border-soft bg-surface p-2.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setOpenPresetId(open ? null : preset.id)}
                  className="btn flex flex-1 items-center gap-2 text-left"
                >
                  <StarIcon width={14} height={14} className="shrink-0 text-accent" />
                  <span className="text-sm text-foreground">{preset.name}</span>
                  <span className="font-mono text-[11px] tabular-nums text-muted">{itemCount} yemek</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(preset.id)}
                  aria-label={`${preset.name} şablonunu sil`}
                  className="btn flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-negative/10 hover:text-negative"
                >
                  <TrashIcon width={13} height={13} />
                </button>
              </div>
              {open && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-border-soft pt-2">
                  <span className="text-xs text-muted">Hangi öğüne eklensin:</span>
                  {meals.map((meal) => (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => {
                        onApply(preset.id, meal.id);
                        setOpenPresetId(null);
                      }}
                      className="btn h-7 rounded-lg border-2 border-muted/30 px-2.5 text-xs text-muted hover:border-accent/50 hover:text-accent"
                    >
                      {meal.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
