"use client";

import { useState } from "react";
import {
  CLOTHING_CATEGORIES,
  CLOTHING_CATEGORY_LABELS,
  CLOTHING_FORMALITIES,
  CLOTHING_FORMALITY_LABELS,
  CLOTHING_SEASONS,
  CLOTHING_SEASON_LABELS,
  type ClothingItemUpdate,
  type DbClothingItem,
} from "@hayat-borsasi/shared";
import { PaletteIcon, TrashIcon } from "@/components/icons";
import { Modal } from "@/components/ui/Modal";

// SELION.AI'deki (piyasa araştırması) "Review and correct any detail" fikri
// — AI'ın önerdiği etiketleri (kategori/renk/mevsim/resmiyet) burada
// düzeltebiliyorsun. Fiyat opsiyonel — girersen Indyx'teki (piyasa
// araştırması) cost-per-wear fikri gibi giyilme başına maliyet hesaplanır.
export function ClothingItemDetailModal({
  item,
  photoUrl,
  wearCount,
  onClose,
  onSave,
  onDelete,
}: {
  item: DbClothingItem | null;
  photoUrl?: string;
  wearCount: number;
  onClose: () => void;
  onSave: (updates: ClothingItemUpdate) => Promise<void>;
  onDelete: (item: DbClothingItem) => void;
}) {
  return (
    <Modal
      open={item !== null}
      onClose={onClose}
      panelClassName="flex w-full max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-background-elevated"
    >
      {item && (
        <ClothingItemForm
          key={item.id}
          item={item}
          photoUrl={photoUrl}
          wearCount={wearCount}
          onSave={onSave}
          onDelete={onDelete}
        />
      )}
    </Modal>
  );
}

// item.id ile key'lenerek üst bileşenden mount ediliyor — parça
// değiştiğinde React bileşeni sıfırdan kurup formu doğrudan yeni parçanın
// değerleriyle başlatıyor, bir useEffect ile senkronize etmeye gerek yok.
function ClothingItemForm({
  item,
  photoUrl,
  wearCount,
  onSave,
  onDelete,
}: {
  item: DbClothingItem;
  photoUrl?: string;
  wearCount: number;
  onSave: (updates: ClothingItemUpdate) => Promise<void>;
  onDelete: (item: DbClothingItem) => void;
}) {
  const [label, setLabel] = useState(item.ai_label);
  const [category, setCategory] = useState(item.category ?? "");
  const [color, setColor] = useState(item.color ?? "");
  const [season, setSeason] = useState(item.season ?? "");
  const [formality, setFormality] = useState(item.formality ?? "");
  const [price, setPrice] = useState(item.price_try != null ? String(item.price_try) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({
      aiLabel: label.trim() || "Parça",
      category: (category || null) as ClothingItemUpdate["category"],
      color: color.trim() || null,
      season: (season || null) as ClothingItemUpdate["season"],
      formality: (formality || null) as ClothingItemUpdate["formality"],
      priceTry: price.trim() ? Number(price) : null,
    });
    setSaving(false);
  }

  const costPerWear = item.price_try != null && wearCount > 0 ? item.price_try / wearCount : null;

  return (
    <>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={item.ai_label} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-muted/10 text-muted">
          <PaletteIcon width={32} height={32} />
        </div>
      )}

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {wearCount} kez giyildi
            {costPerWear != null && ` · Giyilme başına ${costPerWear.toFixed(2)} ₺`}
          </span>
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label="Parçayı sil"
            className="btn shrink-0 text-muted hover:text-negative"
          >
            <TrashIcon width={16} height={16} />
          </button>
        </div>

        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Etiket"
          className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none focus:border-accent/50"
          >
            <option value="">Kategori seç</option>
            {CLOTHING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CLOTHING_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Renk"
            className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none focus:border-accent/50"
          >
            <option value="">Mevsim seç</option>
            {CLOTHING_SEASONS.map((s) => (
              <option key={s} value={s}>
                {CLOTHING_SEASON_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={formality}
            onChange={(e) => setFormality(e.target.value)}
            className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none focus:border-accent/50"
          >
            <option value="">Resmiyet seç</option>
            {CLOTHING_FORMALITIES.map((f) => (
              <option key={f} value={f}>
                {CLOTHING_FORMALITY_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Fiyat (₺, opsiyonel)"
          inputMode="decimal"
          className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </>
  );
}
