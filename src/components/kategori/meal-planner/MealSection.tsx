"use client";

import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
import { PencilIcon, StarIcon, TrashIcon } from "@/components/icons";
import type { DbMealLog, DbSavedFood } from "@hayat-borsasi/shared";
import { MealCard } from "./MealCard";

export interface MealTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function MealSection({
  id,
  title,
  editable = false,
  kind,
  idPrefix,
  foods,
  photoUrls,
  totals,
  onOpenDetail,
  onDeleteFood,
  onRename,
  onDelete,
  onSaveAsPreset,
}: {
  id: string;
  title: string;
  editable?: boolean;
  // 2026-08-26: "library" = Kaydedilen Yemekler havuzu (saved_foods, kalıcı),
  // "log" = bir öğüne bugün sürüklenmiş kopyalar (meal_logs). idPrefix,
  // sürükleme id'sine eklenip MealPlannerBoard'ın drag-end'de hangi türle
  // uğraştığını ayırt etmesini sağlıyor.
  kind: "library" | "log";
  idPrefix: string;
  foods: (DbMealLog | DbSavedFood)[];
  photoUrls: Record<string, string>;
  totals: MealTotals;
  onOpenDetail: (food: DbMealLog | DbSavedFood) => void;
  onDeleteFood: (food: DbMealLog | DbSavedFood) => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  // 2026-08-28 (Bölüm 2e) — bu öğünün o anki içeriğini isimli bir "Sık
  // Yapılan Öğün" şablonu olarak kaydeder, sadece foods.length > 0 iken
  // gösteriliyor (boş bir öğünü kaydetmenin anlamı yok).
  onSaveAsPreset?: (name: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(title);
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");

  function submitRename() {
    setRenaming(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== title) onRename?.(trimmed);
    else setName(title);
  }

  function submitPresetName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = presetName.trim();
    if (!trimmed) return;
    onSaveAsPreset?.(trimmed);
    setPresetName("");
    setSavingPreset(false);
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-lg border-2 p-3 transition-colors ${
        isOver ? "border-accent/60 bg-accent-soft/40" : "border-muted/25"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
            className="h-8 flex-1 rounded-lg border-2 border-accent/40 bg-surface px-2 text-sm text-foreground outline-none"
          />
        ) : (
          <span className="text-sm font-medium text-foreground">{title}</span>
        )}

        {editable && !renaming && (
          <div className="flex items-center gap-1">
            {onSaveAsPreset && foods.length > 0 && (
              <button
                type="button"
                onClick={() => setSavingPreset(true)}
                aria-label="Bu öğünü sık kullanılan yap"
                className="btn flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-accent"
              >
                <StarIcon width={15} height={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setRenaming(true)}
              aria-label="Öğünü yeniden adlandır"
              className="btn flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <PencilIcon width={15} height={15} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label="Öğünü sil"
              className="btn flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-negative/10 hover:text-negative"
            >
              <TrashIcon width={15} height={15} />
            </button>
          </div>
        )}
      </div>

      {savingPreset && (
        <form onSubmit={submitPresetName} className="flex gap-2">
          <input
            autoFocus
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="örn. Kahvaltım"
            className="h-8 flex-1 rounded-lg border-2 border-accent/40 bg-surface px-2 text-sm text-foreground outline-none"
          />
          <button
            type="submit"
            disabled={!presetName.trim()}
            className="btn h-8 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
          >
            Kaydet
          </button>
          <button
            type="button"
            onClick={() => {
              setSavingPreset(false);
              setPresetName("");
            }}
            className="btn h-8 rounded-lg border-2 border-muted/30 px-3 text-xs text-muted hover:text-foreground"
          >
            Vazgeç
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {foods.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted">
            {kind === "library" ? "Analiz ettiğin/eklediğin yemekler burada birikir." : "Buraya bir yemek kartı sürükle."}
          </p>
        )}
        {foods.map((food) => (
          <MealCard
            key={food.id}
            food={food}
            dragId={`${idPrefix}${food.id}`}
            photoUrl={photoUrls[food.id]}
            onOpenDetail={onOpenDetail}
            onDelete={onDeleteFood}
          />
        ))}
      </div>

      {foods.length > 0 && (
        <p className="font-mono text-[11px] tabular-nums text-muted">
          Toplam: {Math.round(totals.calories)} kcal · {Math.round(totals.proteinG)}g protein ·{" "}
          {Math.round(totals.carbsG)}g karb · {Math.round(totals.fatG)}g yağ
        </p>
      )}
    </div>
  );
}
