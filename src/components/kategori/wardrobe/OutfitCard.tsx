"use client";

import { CheckIcon, TrashIcon } from "@/components/icons";
import type { DbClothingItem, DbOutfit } from "@hayat-borsasi/shared";

// Indyx'teki (piyasa araştırması) giyilme takvimi/cost-per-wear fikri —
// "bugün giydim" işaretlemesi tek tıkla, tarih seçici yok (v1'de sadece
// bugün). wearCount toplam giyilme sayısı, cost-per-wear parçaların detay
// modalında gösteriliyor (fiyat parça bazlı).
export function OutfitCard({
  outfit,
  items,
  photoUrls,
  wearCount,
  onDelete,
  onMarkWorn,
}: {
  outfit: DbOutfit;
  items: DbClothingItem[];
  photoUrls: Record<string, string>;
  wearCount: number;
  onDelete: (outfit: DbOutfit) => void;
  onMarkWorn: (outfit: DbOutfit) => void;
}) {
  return (
    <div className="group relative flex flex-col gap-2.5 rounded-lg border border-border-soft bg-background-elevated p-3">
      <div className="flex gap-1">
        {items.slice(0, 4).map((item) =>
          photoUrls[item.id] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={item.id}
              src={photoUrls[item.id]}
              alt={item.ai_label}
              className="aspect-[3/4] flex-1 rounded-lg object-cover"
            />
          ) : (
            <div key={item.id} className="aspect-[3/4] flex-1 rounded-lg bg-muted/10" />
          )
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums"
          style={{ color: "var(--stil-accent)", borderColor: "color-mix(in srgb, var(--stil-accent) 50%, transparent)" }}
        >
          {outfit.ai_score != null ? `${outfit.ai_score}/10` : "—"}
        </span>
        <button
          type="button"
          onClick={() => onDelete(outfit)}
          aria-label="Kombini sil"
          className="btn text-muted opacity-0 hover:text-negative group-hover:opacity-100"
        >
          <TrashIcon width={14} height={14} />
        </button>
      </div>
      {outfit.ai_comment && <p className="line-clamp-3 text-xs text-muted">{outfit.ai_comment}</p>}
      <button
        type="button"
        onClick={() => onMarkWorn(outfit)}
        className="btn flex items-center justify-center gap-1 rounded-lg border border-border-soft py-1.5 text-[11px] font-medium text-muted hover:border-positive/40 hover:text-positive"
      >
        <CheckIcon width={11} height={11} />
        Bugün Giydim {wearCount > 0 && `· ${wearCount}`}
      </button>
    </div>
  );
}
