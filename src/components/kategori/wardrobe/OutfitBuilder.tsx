"use client";

import { useDroppable } from "@dnd-kit/core";
import type { DbClothingItem } from "@hayat-borsasi/shared";
import { ClothingItemCard } from "./ClothingItemCard";

export interface OutfitScoreState {
  score: number;
  comment: string;
}

export function OutfitBuilder({
  id,
  items,
  photoUrls,
  onRemoveItem,
  scoring,
  scoreError,
  result,
  saving,
  onScoreClick,
  onSaveClick,
  onDiscardClick,
}: {
  id: string;
  items: DbClothingItem[];
  photoUrls: Record<string, string>;
  onRemoveItem: (item: DbClothingItem) => void;
  scoring: boolean;
  scoreError: string | null;
  result: OutfitScoreState | null;
  saving: boolean;
  onScoreClick: () => void;
  onSaveClick: () => void;
  onDiscardClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 rounded-lg border-2 p-3 transition-colors ${
        isOver ? "border-accent/60 bg-accent-soft/40" : "border-muted/25"
      }`}
    >
      <span className="text-sm font-medium text-foreground">Kombin Oluştur</span>

      <div className="flex flex-wrap gap-2">
        {items.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted">Gardırobundan buraya en az 2 parça sürükle.</p>
        )}
        {items.map((item) => (
          <ClothingItemCard key={item.id} item={item} photoUrl={photoUrls[item.id]} draggable={false} onRemove={onRemoveItem} />
        ))}
      </div>

      {scoreError && <p className="text-xs text-negative">{scoreError}</p>}

      {result ? (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-accent/40 bg-accent-soft/30 p-3">
          <p className="text-sm font-semibold text-foreground">Uyum Puanı: {result.score}/10</p>
          {result.comment && <p className="text-xs text-muted">{result.comment}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveClick}
              disabled={saving}
              className="btn h-9 flex-1 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Bu kombini kaydet"}
            </button>
            <button
              type="button"
              onClick={onDiscardClick}
              disabled={saving}
              className="btn h-9 rounded-lg border-2 border-muted/30 px-4 text-xs text-muted hover:text-foreground"
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onScoreClick}
          disabled={items.length < 2 || scoring}
          className="btn h-10 w-fit rounded-lg bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
        >
          {scoring ? "Puanlanıyor..." : "Bu kombini puanla"}
        </button>
      )}
    </div>
  );
}
