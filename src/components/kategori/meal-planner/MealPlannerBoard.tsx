"use client";

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useMemo, useState } from "react";
import type { DbMeal, DbMealLog, DbSavedFood } from "@hayat-borsasi/shared";
import { MealCard } from "./MealCard";
import { MealSection, type MealTotals } from "./MealSection";

const EMPTY_TOTALS: MealTotals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
// Sürüklenen kartın kütüphaneden mi (saved_foods) yoksa bugünkü bir
// öğün kaydından mı (meal_logs) geldiğini ayırt etmek için id öneki —
// 2026-08-26: "Kaydedilen Yemekler" artık kalıcı bir kütüphane, bir öğüne
// sürüklemek KOPYALAMALI (taşımamalı), bu yüzden hangi tür sürüklendiği
// drag-end'de bilinmeli.
const LIB_PREFIX = "lib:";
const LOG_PREFIX = "log:";

// `quantity` sadece meal_logs kayıtlarında var (kütüphane kartları hep 1
// sayılır) — miktar birleştirmesiyle (bkz. insertMealLogFromSavedFood)
// aynı karttaki değerler artık N ile çarpılarak toplama katılmalı.
function sumTotals(
  items: { calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; quantity?: number }[]
): MealTotals {
  return items.reduce((acc, f) => {
    const qty = f.quantity ?? 1;
    return {
      calories: acc.calories + (f.calories ?? 0) * qty,
      proteinG: acc.proteinG + (f.protein_g ?? 0) * qty,
      carbsG: acc.carbsG + (f.carbs_g ?? 0) * qty,
      fatG: acc.fatG + (f.fat_g ?? 0) * qty,
    };
  }, EMPTY_TOTALS);
}

type ActiveCard = { kind: "library"; food: DbSavedFood } | { kind: "log"; food: DbMealLog };

export function MealPlannerBoard({
  meals,
  savedFoods,
  foods,
  photoUrls,
  onAssignFromLibrary,
  onMoveLogEntry,
  onRemoveFromMeal,
  onOpenDetail,
  onDeleteSavedFood,
  onDeleteMealLog,
  onRenameMeal,
  onDeleteMeal,
  onSaveMealAsPreset,
}: {
  meals: DbMeal[];
  savedFoods: DbSavedFood[];
  foods: DbMealLog[];
  photoUrls: Record<string, string>;
  onAssignFromLibrary: (savedFoodId: string, mealId: string) => void;
  onMoveLogEntry: (mealLogId: string, mealId: string) => void;
  onRemoveFromMeal: (mealLogId: string) => void;
  onOpenDetail: (food: DbMealLog | DbSavedFood) => void;
  onDeleteSavedFood: (food: DbSavedFood) => void;
  onDeleteMealLog: (food: DbMealLog) => void;
  onRenameMeal: (mealId: string, name: string) => void;
  onDeleteMeal: (mealId: string) => void;
  onSaveMealAsPreset: (mealId: string, name: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeCard, setActiveCard] = useState<ActiveCard | null>(null);

  const byMeal = useMemo(() => {
    const map = new Map<string, DbMealLog[]>();
    for (const meal of meals) map.set(meal.id, []);
    for (const food of foods) {
      if (food.meal_id && map.has(food.meal_id)) map.get(food.meal_id)!.push(food);
    }
    return map;
  }, [meals, foods]);

  const dayTotals = useMemo(() => sumTotals(foods), [foods]);

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    if (id.startsWith(LIB_PREFIX)) {
      const realId = id.slice(LIB_PREFIX.length);
      const food = savedFoods.find((f) => f.id === realId);
      setActiveCard(food ? { kind: "library", food } : null);
    } else if (id.startsWith(LOG_PREFIX)) {
      const realId = id.slice(LOG_PREFIX.length);
      const food = foods.find((f) => f.id === realId);
      setActiveCard(food ? { kind: "log", food } : null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const targetMealId = over.id === "pool" ? null : String(over.id);

    if (activeId.startsWith(LIB_PREFIX)) {
      const savedFoodId = activeId.slice(LIB_PREFIX.length);
      // Kütüphaneden bir öğüne bırakmak KOPYALAR; havuzun üzerine
      // bırakmak (zaten oradaysa) hiçbir şey yapmaz.
      if (targetMealId) onAssignFromLibrary(savedFoodId, targetMealId);
      return;
    }

    if (activeId.startsWith(LOG_PREFIX)) {
      const mealLogId = activeId.slice(LOG_PREFIX.length);
      const food = foods.find((f) => f.id === mealLogId);
      if (!food) return;
      if (targetMealId === null) {
        // Bir öğünden havuza geri sürüklemek — kütüphanedeki orijinal
        // zaten duruyor, günlük kopya siliniyor.
        onRemoveFromMeal(mealLogId);
      } else if (food.meal_id !== targetMealId) {
        onMoveLogEntry(mealLogId, targetMealId);
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <MealSection
          id="pool"
          title="Kaydedilen Yemekler"
          kind="library"
          idPrefix={LIB_PREFIX}
          foods={savedFoods}
          photoUrls={photoUrls}
          totals={sumTotals(savedFoods)}
          onOpenDetail={onOpenDetail}
          onDeleteFood={(f) => onDeleteSavedFood(f as DbSavedFood)}
        />

        {meals.map((meal) => (
          <MealSection
            key={meal.id}
            id={meal.id}
            title={meal.name}
            editable
            kind="log"
            idPrefix={LOG_PREFIX}
            foods={byMeal.get(meal.id) ?? []}
            photoUrls={photoUrls}
            totals={sumTotals(byMeal.get(meal.id) ?? [])}
            onOpenDetail={onOpenDetail}
            onDeleteFood={(f) => onDeleteMealLog(f as DbMealLog)}
            onRename={(name) => onRenameMeal(meal.id, name)}
            onDelete={() => onDeleteMeal(meal.id)}
            onSaveAsPreset={(name) => onSaveMealAsPreset(meal.id, name)}
          />
        ))}

        {foods.length > 0 && (
          <p className="rounded-lg border-2 border-muted/25 px-3 py-2 font-mono text-xs tabular-nums text-muted">
            Günün Toplamı: {Math.round(dayTotals.calories)} kcal · {Math.round(dayTotals.proteinG)}g protein ·{" "}
            {Math.round(dayTotals.carbsG)}g karb · {Math.round(dayTotals.fatG)}g yağ
          </p>
        )}
      </div>

      <DragOverlay>
        {activeCard ? (
          <MealCard
            food={activeCard.food}
            dragId="overlay"
            photoUrl={photoUrls[activeCard.food.id]}
            onOpenDetail={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
