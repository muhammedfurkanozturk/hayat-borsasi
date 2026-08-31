"use client";

import { useState } from "react";
import { CheckMark } from "@/components/CheckMark";
import { CLOTHING_CATEGORY_LABELS, type ClothingCategory, type ClothingFormality, type ClothingSeason } from "@hayat-borsasi/shared";
import { Modal } from "@/components/ui/Modal";
import { cropImageToBox, removeBackgroundFromBlob } from "@/lib/wardrobe/smart-detect";

export interface DetectedClothingItem {
  label: string;
  category: ClothingCategory | null;
  color: string | null;
  season: ClothingSeason | null;
  formality: ClothingFormality | null;
  box: { x: number; y: number; width: number; height: number };
}

interface ProcessedItem {
  detected: DetectedClothingItem;
  previewUrl: string | null;
  blob: Blob | null;
  included: boolean;
  failed: boolean;
}

function fileToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, data] = result.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      resolve({ data, mediaType });
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

// Acloset'in "Smart Detector" özelliğinden (piyasa araştırması) ilham —
// tek bir ayna selfisinden birden fazla parçayı otomatik tespit edip,
// her birini (kullanıcıya sorulup onaylanan) istemci-taraflı arka plan
// kaldırma ile temiz bir ürün görseline dönüştürüyor. onConfirm sadece
// kullanıcının işaretlediği parçaları döndürür — asıl kayıt (Storage
// upload + insertClothingItem) WardrobePanel'de, mevcut tek-parça akışıyla
// AYNI yolu kullanıyor.
export function MirrorSelfieDetector({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (items: { blob: Blob; detected: DetectedClothingItem }[]) => Promise<void>;
}) {
  const [stage, setStage] = useState<"pick" | "detecting" | "processing" | "review">("pick");
  const [items, setItems] = useState<ProcessedItem[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setStage("detecting");
    try {
      const { data, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/mirror-selfie-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: data, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analiz başarısız oldu.");

      const detected: DetectedClothingItem[] = json.items;
      setStage("processing");
      setProgress({ done: 0, total: detected.length });

      const processed: ProcessedItem[] = [];
      for (const det of detected) {
        try {
          const cropped = await cropImageToBox(file, det.box);
          const clean = await removeBackgroundFromBlob(cropped);
          processed.push({ detected: det, blob: clean, previewUrl: URL.createObjectURL(clean), included: true, failed: false });
        } catch {
          processed.push({ detected: det, blob: null, previewUrl: null, included: false, failed: true });
        }
        setProgress((p) => ({ ...p, done: p.done + 1 }));
        setItems([...processed]);
      }
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analiz başarısız oldu.");
      setStage("pick");
    }
  }

  function toggleIncluded(index: number) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, included: !it.included } : it)));
  }

  async function handleCommit() {
    const toSave = items.filter((i) => i.included && i.blob);
    if (toSave.length === 0) return;
    setCommitting(true);
    await onConfirm(toSave.map((i) => ({ blob: i.blob!, detected: i.detected })));
    setCommitting(false);
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      panelClassName="flex max-h-[85vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg border border-border bg-background-elevated p-5"
    >
      <div>
        <h3 className="text-sm font-medium text-foreground">Ayna Selfisinden Otomatik Tespit</h3>
        <p className="text-xs text-muted">
          Üzerindeki bir kombinle çektiğin bir fotoğraf yükle, her parçayı ayrı ayrı tespit edip gardırobuna eklemene yardım edelim.
          Konum tahmini kesin değil, yanlış kırpılan bir parça olursa işaretini kaldırıp elle tek tek de ekleyebilirsin.
        </p>
      </div>

      {stage === "pick" && (
        <label
          className="btn flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed text-sm font-medium hover:brightness-110"
          style={{ borderColor: "color-mix(in srgb, var(--stil-accent) 40%, transparent)", color: "var(--stil-accent)" }}
        >
          Fotoğraf Seç
          <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </label>
      )}

      {stage === "detecting" && <p className="py-6 text-center text-sm text-muted">Fotoğraf inceleniyor...</p>}

      {stage === "processing" && (
        <p className="py-6 text-center text-sm text-muted">
          Parçalar işleniyor ({progress.done}/{progress.total}) — arka plan temizleniyor, biraz sürebilir...
        </p>
      )}

      {stage === "review" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => !item.failed && toggleIncluded(i)}
                disabled={item.failed}
                className={`btn flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center ${
                  item.included ? "border-[color:var(--stil-accent)]/60" : "border-muted/25 opacity-50"
                } disabled:pointer-events-none`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[10px] text-muted">{item.detected.category ? CLOTHING_CATEGORY_LABELS[item.detected.category] : ""}</span>
                  {!item.failed && <CheckMark checked={item.included} size={16} />}
                </div>
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.previewUrl} alt={item.detected.label} className="aspect-square w-full rounded-md bg-background object-contain" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-md bg-background text-[10px] text-negative">İşlenemedi</div>
                )}
                <span className="line-clamp-1 text-[11px] text-foreground">{item.detected.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={committing || items.every((i) => !i.included || !i.blob)}
            onClick={handleCommit}
            className="btn h-10 rounded-lg px-4 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
            style={{ backgroundColor: "var(--stil-accent)" }}
          >
            {committing ? "Ekleniyor..." : "Seçilenleri Gardırobuma Ekle"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-negative">{error}</p>}
    </Modal>
  );
}
