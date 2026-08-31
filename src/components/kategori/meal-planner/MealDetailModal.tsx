"use client";

import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon, UtensilsIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";
import type { DbMealLog, DbSavedFood, NutritionValuesPatch } from "@hayat-borsasi/shared";
import { matchFoodIcon } from "./food-icon-match";

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none focus:border-accent/50"
      />
    </label>
  );
}

// 2026-08-28 (kullanıcı bulgusu — "260 kcal görünüyor ama gerçeği 265"):
// besin değerleri artık burada elle düzeltilebiliyor. Sadece bu satırı
// günceller — kütüphanedeki/başka güne sürüklenmiş kopyaları veya genel
// USDA/OFF verisini etkilemez (bkz. handleUpdateFood, MealLogPanel.tsx).
export function MealDetailModal({
  food,
  photoUrl,
  onClose,
  onDelete,
  onUpdate,
}: {
  food: DbMealLog | DbSavedFood | null;
  photoUrl?: string;
  onClose: () => void;
  onDelete: (food: DbMealLog | DbSavedFood) => void;
  onUpdate: (food: DbMealLog | DbSavedFood, patch: NutritionValuesPatch) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditing(false);
    if (food) {
      setCalories(food.calories?.toString() ?? "");
      setProteinG(food.protein_g?.toString() ?? "");
      setCarbsG(food.carbs_g?.toString() ?? "");
      setFatG(food.fat_g?.toString() ?? "");
    }
  }, [food]);

  async function handleSave() {
    if (!food) return;
    setSaving(true);
    await onUpdate(food, {
      calories: calories.trim() === "" ? null : Number(calories),
      proteinG: proteinG.trim() === "" ? null : Number(proteinG),
      carbsG: carbsG.trim() === "" ? null : Number(carbsG),
      fatG: fatG.trim() === "" ? null : Number(fatG),
    });
    setSaving(false);
    setEditing(false);
  }

  return (
    <Modal
      open={food !== null}
      onClose={onClose}
      panelClassName="flex w-full max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-background-elevated"
    >
      {food && (
        <>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={food.description} className="h-48 w-full object-cover" />
          ) : (
            <div className="flex h-32 w-full items-center justify-center bg-accent-soft text-accent">
              {(() => {
                const MatchedIcon = matchFoodIcon(food.description || "");
                return MatchedIcon ? <MatchedIcon width={36} height={36} /> : <UtensilsIcon width={32} height={32} />;
              })()}
            </div>
          )}

          <div className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">{food.description || "Yemek"}</h3>
              <div className="flex shrink-0 items-center gap-1">
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label="Besin değerlerini düzenle"
                    className="btn flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground"
                  >
                    <PencilIcon width={15} height={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(food)}
                  aria-label="Yemeği sil"
                  className="btn flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-negative/10 hover:text-negative"
                >
                  <TrashIcon width={15} height={15} />
                </button>
              </div>
            </div>

            {food.ai_summary && <p className="text-sm italic text-muted">{food.ai_summary}</p>}

            {editing ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <NumberField label="Kalori (kcal)" value={calories} onChange={setCalories} />
                  <NumberField label="Protein (g)" value={proteinG} onChange={setProteinG} />
                  <NumberField label="Karbonhidrat (g)" value={carbsG} onChange={setCarbsG} />
                  <NumberField label="Yağ (g)" value={fatG} onChange={setFatG} />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="btn h-9 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="btn h-9 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 font-mono text-sm tabular-nums text-foreground">
                <span>Kalori: {food.calories ?? "—"}</span>
                <span>Protein: {food.protein_g ?? "—"}g</span>
                <span>Karbonhidrat: {food.carbs_g ?? "—"}g</span>
                <span>Yağ: {food.fat_g ?? "—"}g</span>
              </div>
            )}

            {food.portion_text && <p className="text-xs text-muted">Porsiyon: {food.portion_text}</p>}
            {"date" in food ? (
              <p className="text-xs text-muted">{food.date}</p>
            ) : (
              <p className="text-xs text-muted">Kaydedilen Yemekler kütüphanesinde</p>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
