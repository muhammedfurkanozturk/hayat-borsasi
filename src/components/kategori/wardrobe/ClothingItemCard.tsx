"use client";

import { useDraggable } from "@dnd-kit/core";
import { PaletteIcon, TrashIcon } from "@/components/icons";
import type { DbClothingItem } from "@hayat-borsasi/shared";

export function ClothingItemCard({
  item,
  photoUrl,
  draggable = true,
  onRemove,
  onOpenDetail,
}: {
  item: DbClothingItem;
  photoUrl?: string;
  draggable?: boolean;
  onRemove: (item: DbClothingItem) => void;
  onOpenDetail?: (item: DbClothingItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !draggable,
  });

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={() => onOpenDetail?.(item)}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 30 }
          : undefined
      }
      className={`group relative flex aspect-[3/4] w-32 shrink-0 flex-col overflow-hidden rounded-lg border border-border-soft bg-background-elevated ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${onOpenDetail ? "cursor-pointer" : ""} ${isDragging ? "opacity-50" : ""}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={item.ai_label} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted/10 text-muted">
          <PaletteIcon width={22} height={22} />
        </div>
      )}
      {/* Galeri/atelier vitrini hissi (SelionAI'den ilham, Bölüm 10) —
          etiket her zaman görünür değil, fotoğrafın altında karanlık bir
          gradyanla hover'da beliren bir başlık. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-1.5 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="line-clamp-2 text-[11px] leading-tight text-white">{item.ai_label || "Parça"}</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item);
        }}
        aria-label="Parçayı kaldır"
        className="btn absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm hover:text-negative group-hover:opacity-100"
      >
        <TrashIcon width={12} height={12} />
      </button>
    </div>
  );
}
