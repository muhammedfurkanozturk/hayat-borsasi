"use client";

import { useState } from "react";

export interface EditableFoodValues {
  description: string;
  portion: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

type NutrientKey = "calories" | "proteinG" | "carbsG" | "fatG";

const QUANTITY_STEP = 0.5;
const MIN_QUANTITY = 0.25;

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// 2026-08-27 — AI analizi/arama sonrası artık direkt "Evet/Hayır" değil,
// düzenlenebilir bir onay ekranı (kullanıcı bulgusu: "yumurta kaç adet
// yedin mesela o önemli" — AI'ın tahmini yanlış olabilir). Miktar
// değişince kcal/protein/karb/yağ, ANALİZ ANINDAKİ değerler (quantity=1
// referansı) baz alınarak ORANTILI yeniden hesaplanır — ama kullanıcı
// herhangi bir besin alanını elle değiştirirse, o alan artık miktar
// değişiminden ETKİLENMEZ (touched Set'i) — otomatik hesaplama bir
// kolaylık, elle düzeltmenin üzerine yazmıyor.
export function PendingFoodEditor({
  initial,
  summary,
  onConfirm,
  onCancel,
  saving,
  confirmLabel = "Evet, ekle",
}: {
  initial: EditableFoodValues;
  summary?: string;
  onConfirm: (values: EditableFoodValues) => void;
  onCancel: () => void;
  saving: boolean;
  confirmLabel?: string;
}) {
  const [description, setDescription] = useState(initial.description);
  const [portion, setPortion] = useState(initial.portion ?? "");
  const [quantity, setQuantity] = useState(1);
  const [base] = useState({
    calories: initial.calories,
    proteinG: initial.proteinG,
    carbsG: initial.carbsG,
    fatG: initial.fatG,
  });
  const [calories, setCalories] = useState(initial.calories);
  const [proteinG, setProteinG] = useState(initial.proteinG);
  const [carbsG, setCarbsG] = useState(initial.carbsG);
  const [fatG, setFatG] = useState(initial.fatG);
  const [touched, setTouched] = useState<Set<NutrientKey>>(new Set());

  function applyQuantity(nextQuantity: number) {
    const q = Math.max(MIN_QUANTITY, nextQuantity);
    setQuantity(q);
    if (!touched.has("calories") && base.calories != null) setCalories(round(base.calories * q, 0));
    if (!touched.has("proteinG") && base.proteinG != null) setProteinG(round(base.proteinG * q, 1));
    if (!touched.has("carbsG") && base.carbsG != null) setCarbsG(round(base.carbsG * q, 1));
    if (!touched.has("fatG") && base.fatG != null) setFatG(round(base.fatG * q, 1));
  }

  function markTouched(key: NutrientKey, setter: (v: number | null) => void, raw: string) {
    setTouched((prev) => new Set(prev).add(key));
    setter(raw === "" ? null : Number(raw));
  }

  function handleConfirm() {
    onConfirm({
      description: description.trim() || "Yemek",
      portion: portion.trim() || null,
      calories,
      proteinG,
      carbsG,
      fatG,
    });
  }

  const numberInputClass =
    "h-10 w-full rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none focus:border-accent/50";

  return (
    <div className="flex flex-col gap-3">
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Yemek adı"
        className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm font-medium text-foreground outline-none focus:border-accent/50"
      />
      {summary && <p className="text-xs italic text-muted">{summary}</p>}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Miktar</label>
          <div className="flex h-10 items-center overflow-hidden rounded-lg border-2 border-muted/30 bg-surface">
            <button
              type="button"
              onClick={() => applyQuantity(quantity - QUANTITY_STEP)}
              className="btn flex h-full w-9 shrink-0 items-center justify-center text-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Miktarı azalt"
            >
              −
            </button>
            <span className="flex-1 text-center font-mono text-sm tabular-nums text-foreground">{quantity}×</span>
            <button
              type="button"
              onClick={() => applyQuantity(quantity + QUANTITY_STEP)}
              className="btn flex h-full w-9 shrink-0 items-center justify-center text-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Miktarı artır"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Porsiyon</label>
          <input
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
            placeholder="örn. 2 adet"
            className={numberInputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Kalori</label>
          <input
            type="number"
            value={calories ?? ""}
            onChange={(e) => markTouched("calories", setCalories, e.target.value)}
            className={numberInputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Protein (g)</label>
          <input
            type="number"
            value={proteinG ?? ""}
            onChange={(e) => markTouched("proteinG", setProteinG, e.target.value)}
            className={numberInputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Karb (g)</label>
          <input
            type="number"
            value={carbsG ?? ""}
            onChange={(e) => markTouched("carbsG", setCarbsG, e.target.value)}
            className={numberInputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted">Yağ (g)</label>
          <input
            type="number"
            value={fatG ?? ""}
            onChange={(e) => markTouched("fatG", setFatG, e.target.value)}
            className={numberInputClass}
          />
        </div>
      </div>

      <p className="text-sm text-foreground">Bu yemeği kaydetmek ister misin?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className="btn h-10 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="btn h-10 flex-1 rounded-lg border-2 border-muted/30 text-sm text-muted hover:text-foreground"
        >
          Hayır, sadece bakıyordum
        </button>
      </div>
    </div>
  );
}
