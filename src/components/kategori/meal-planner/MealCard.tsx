"use client";

import { useDraggable } from "@dnd-kit/core";
import { UtensilsIcon, TrashIcon } from "@/components/icons";
import type { DbMealLog, DbSavedFood } from "@hayat-borsasi/shared";
import { matchFoodIcon } from "./food-icon-match";

export function MealCard({
  food,
  dragId,
  photoUrl,
  onOpenDetail,
  onDelete,
}: {
  food: DbMealLog | DbSavedFood;
  // 2026-08-26: kaynağın kütüphane mi (lib:) yoksa bugünkü bir öğün kaydı mı
  // (log:) olduğunu MealPlannerBoard'ın drag-end'de ayırt edebilmesi için
  // gerçek food.id'den ayrı bir sürükleme id'si — bkz. MealPlannerBoard.tsx.
  dragId: string;
  photoUrl?: string;
  onOpenDetail: (food: DbMealLog | DbSavedFood) => void;
  onDelete: (food: DbMealLog | DbSavedFood) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: dragId });
  const MatchedIcon = photoUrl ? null : matchFoodIcon(food.description || "");
  // Sadece meal_logs kayıtlarında anlamlı (bkz. insertMealLogFromSavedFood'un
  // miktar-birleştirme mantığı) — kütüphane kartlarında (DbSavedFood) yok.
  const quantity = "date" in food ? food.quantity : undefined;

  const hasBadge = Boolean(quantity && quantity > 1);

  return (
    // 2026-08-29 (kullanıcı bulgusu): rozet önceden asıl kartın İÇİNDEYDİ,
    // kartın kendi overflow-hidden'ı (rounded-lg köşe için gerekli)
    // rozetin sol-üstten taşan kısmını kırpıyordu — daire hiç tam
    // görünmüyordu. Çözüm: rozet artık bu DIŞ sarmalayıcının çocuğu (kartla
    // KARDEŞ, kartın overflow-hidden'ının dışında), sarmalayıcı da rozete
    // yer açacak kadar boşluk (pl-2.5 pt-2.5) bırakıyor — çerçeve çizgisi
    // YOK, sadece görünmez bir boşluk/marj. Böylece: en önde rozet, arkada
    // (görsel olarak alt katmanda) yemek kartı.
    <div className={`relative shrink-0 ${hasBadge ? "pl-2.5 pt-2.5" : ""}`}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={() => onOpenDetail(food)}
        style={
          transform
            ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 30 }
            : undefined
        }
        className={`group btn relative flex aspect-square w-24 cursor-grab flex-col overflow-hidden rounded-lg border-2 border-muted/25 bg-background-elevated text-left active:cursor-grabbing ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={food.description} className="h-14 w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-14 w-full items-center justify-center bg-accent-soft text-accent">
            {/* matchFoodIcon her zaman food-icon-match.ts'teki sabit, modül
                seviyesinde tanımlı ikonlardan birine referans döndürüyor —
                render sırasında yeni bir component OLUŞTURMUYOR. */}
            {/* eslint-disable-next-line react-hooks/static-components */}
            {MatchedIcon ? <MatchedIcon width={22} height={22} /> : <UtensilsIcon width={20} height={20} />}
          </div>
        )}
        <span className="line-clamp-2 flex-1 px-1.5 py-1 text-[11px] leading-tight text-foreground">
          {food.description || "Yemek"}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(food);
          }}
          aria-label="Yemeği sil"
          className="btn absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-md bg-background/80 text-muted opacity-0 backdrop-blur-sm hover:text-negative group-hover:opacity-100"
        >
          <TrashIcon width={11} height={11} />
        </button>
      </div>
      {hasBadge && (
        <span className="absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-positive font-mono text-xs font-bold tabular-nums text-background shadow-md">
          ×{quantity}
        </span>
      )}
    </div>
  );
}
