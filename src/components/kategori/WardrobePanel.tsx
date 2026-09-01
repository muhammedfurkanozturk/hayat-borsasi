"use client";

import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import {
  CLOTHING_CATEGORIES,
  CLOTHING_CATEGORY_LABELS,
  deleteClothingItem,
  deleteOutfit,
  deleteOutfitWear,
  fetchClothingItems,
  fetchOutfitWears,
  fetchOutfits,
  fetchStyleProfile,
  insertClothingItem,
  insertOutfit,
  insertOutfitWear,
  todayIso,
  updateClothingItem,
  upsertStyleProfile,
  type ClothingCategory,
  type ClothingItemUpdate,
  type DbClothingItem,
  type DbOutfit,
  type DbOutfitWear,
  type DbStyleProfile,
} from "@hayat-borsasi/shared";
import { createClient } from "@/lib/supabase/client";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ClothingItemCard } from "./wardrobe/ClothingItemCard";
import { ClothingItemDetailModal } from "./wardrobe/ClothingItemDetailModal";
import { MirrorSelfieDetector, type DetectedClothingItem } from "./wardrobe/MirrorSelfieDetector";
import { OutfitBuilder, type OutfitScoreState } from "./wardrobe/OutfitBuilder";
import { OutfitCard } from "./wardrobe/OutfitCard";
import { StyleAdvicePanel } from "./wardrobe/StyleAdvicePanel";
import { StyleCalendarPanel } from "./wardrobe/StyleCalendarPanel";
import { TravelPackingPanel } from "./wardrobe/TravelPackingPanel";

const CATEGORY_FILTERS = ["hepsi", ...CLOTHING_CATEGORIES] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

const BUCKET = "clothing-photos";
const SIGNED_URL_TTL_SECONDS = 3600;
const BUILDER_ID = "outfit-builder";

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

export function WardrobePanel({ categoryId }: { categoryId: string }) {
  const [items, setItems] = useState<DbClothingItem[]>([]);
  const [outfits, setOutfits] = useState<DbOutfit[]>([]);
  const [outfitWears, setOutfitWears] = useState<DbOutfitWear[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [builderItemIds, setBuilderItemIds] = useState<string[]>([]);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<OutfitScoreState | null>(null);
  const [saving, setSaving] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("hepsi");
  const [showUnderused, setShowUnderused] = useState(false);
  const [detailItem, setDetailItem] = useState<DbClothingItem | null>(null);
  const [styleProfile, setStyleProfile] = useState<DbStyleProfile | null>(null);
  const [smartDetectOpen, setSmartDetectOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function loadPhotoUrls(supabase: ReturnType<typeof createClient>, entries: { id: string; path: string }[]) {
    if (entries.length === 0) return;
    const resolved = await Promise.all(
      entries.map(async ({ id, path }) => {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
        return [id, data?.signedUrl ?? ""] as const;
      })
    );
    setPhotoUrls((prev) => ({ ...prev, ...Object.fromEntries(resolved) }));
  }

  async function load() {
    const supabase = createClient();
    const [itemRows, outfitRows] = await Promise.all([fetchClothingItems(supabase, categoryId), fetchOutfits(supabase, categoryId)]);
    setItems(itemRows);
    setOutfits(outfitRows);
    await loadPhotoUrls(supabase, itemRows.map((i) => ({ id: i.id, path: i.photo_path })));

    // Giyilme kayıtları, ilgili migration henüz uygulanmadıysa hata
    // fırlatabilir — gardırop/kombin gibi ana özellikleri kilitlemesin.
    try {
      const wearRows = await fetchOutfitWears(
        supabase,
        outfitRows.map((o) => o.id)
      );
      setOutfitWears(wearRows);
    } catch (err) {
      console.error("Giyilme kayıtları yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    // style_profiles migration'ı (20260901110000) henüz uygulanmamış
    // olabilir — AI Stilist'in ten tonu/vücut tipi olmadan da çalışması
    // gerektiği için ana akışı kilitlemesin.
    try {
      setStyleProfile(await fetchStyleProfile(supabase, categoryId));
    } catch (err) {
      console.error("Stil profili yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      const { data, mediaType } = await fileToBase64(file);
      const res = await fetch("/api/clothing-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: data, mediaType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analiz başarısız oldu.");

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const upload = await supabase.storage.from(BUCKET).upload(path, file);
      if (upload.error) throw new Error("Fotoğraf yüklenemedi: " + upload.error.message);

      const created = await insertClothingItem(supabase, user.id, categoryId, {
        photoPath: path,
        photoMime: mediaType,
        aiLabel: json.label ?? "Parça",
        category: json.category ?? null,
        color: json.color ?? null,
        season: json.season ?? null,
        formality: json.formality ?? null,
      });
      setItems((prev) => [created, ...prev]);
      await loadPhotoUrls(supabase, [{ id: created.id, path }]);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analiz başarısız oldu.");
    }
    setAnalyzing(false);
  }

  // Akıllı Kayıt (Bölüm 1'e ek) — MirrorSelfieDetector'ün kullanıcıya
  // onaylattığı her parçayı, tek-parça yüklemeyle (handlePhotoSelect) AYNI
  // Storage/insertClothingItem yoluna yazıyor, sadece kaynak bir dosya
  // seçimi değil zaten işlenmiş bir Blob.
  async function handleSmartDetectConfirm(detected: { blob: Blob; detected: DetectedClothingItem }[]) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const created: DbClothingItem[] = [];
    for (const { blob, detected: d } of detected) {
      const path = `${user.id}/${crypto.randomUUID()}-smart-detect.png`;
      const upload = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/png" });
      if (upload.error) continue;
      const item = await insertClothingItem(supabase, user.id, categoryId, {
        photoPath: path,
        photoMime: "image/png",
        aiLabel: d.label,
        category: d.category,
        color: d.color,
        season: d.season,
        formality: d.formality,
      });
      created.push(item);
    }
    setItems((prev) => [...created, ...prev]);
    await loadPhotoUrls(
      supabase,
      created.map((c) => ({ id: c.id, path: c.photo_path }))
    );
  }

  async function handleDeleteItem(item: DbClothingItem) {
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([item.photo_path]);
    await deleteClothingItem(supabase, item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setBuilderItemIds((prev) => prev.filter((id) => id !== item.id));
    setDetailItem((prev) => (prev?.id === item.id ? null : prev));
  }

  async function handleUpdateItem(updates: ClothingItemUpdate) {
    if (!detailItem) return;
    const supabase = createClient();
    const updated = await updateClothingItem(supabase, detailItem.id, updates);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setDetailItem(null);
  }

  async function handleMarkWorn(outfit: DbOutfit) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertOutfitWear(supabase, user.id, outfit.id, todayIso());
      setOutfitWears((prev) => [created, ...prev]);
    }
  }

  // Stil Takvimi (Bölüm 05) — insertOutfitWear/deleteOutfitWear zaten
  // keyfi bir tarih alıyordu (bkz. mevcut "Bugün Giydim" handleMarkWorn),
  // sadece geçmiş bir tarihe de yazabilen bir UI eklendi.
  async function handleLogWear(outfitId: string, date: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const created = await insertOutfitWear(supabase, user.id, outfitId, date);
    setOutfitWears((prev) => [created, ...prev]);
  }

  async function handleDeleteWear(wear: DbOutfitWear) {
    const supabase = createClient();
    await deleteOutfitWear(supabase, wear.id);
    setOutfitWears((prev) => prev.filter((w) => w.id !== wear.id));
  }

  async function handleSaveStyleProfile(skinTone: string | null, bodyType: string | null) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    try {
      const updated = await upsertStyleProfile(supabase, user.id, categoryId, { skin_tone: skinTone, body_type: bodyType });
      setStyleProfile(updated);
    } catch (err) {
      console.error("Stil profili kaydedilemedi (migration uygulanmamış olabilir):", err);
    }
  }

  // AI Stilist'in önerdiği kombini kaydetmek, mevcut "kombin puanla"
  // akışıyla AYNI insertOutfit'i kullanıyor — sadece kaynak (builder yerine
  // AI önerisi) farklı, yeni bir DB yazma yolu gerekmedi.
  async function handleSaveAdvisedOutfit(itemIds: string[], score: number, reasoning: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const advisedItems = itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is DbClothingItem => Boolean(i));
    const created = await insertOutfit(supabase, user.id, categoryId, {
      name: advisedItems.map((i) => i.ai_label).join(" + "),
      aiScore: score,
      aiComment: reasoning,
      itemIds,
    });
    setOutfits((prev) => [created, ...prev]);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over?.id === BUILDER_ID) {
      setBuilderItemIds((prev) => (prev.includes(String(active.id)) ? prev : [...prev, String(active.id)]));
    }
  }

  function handleRemoveFromBuilder(item: DbClothingItem) {
    setBuilderItemIds((prev) => prev.filter((id) => id !== item.id));
  }

  const builderItems = useMemo(
    () => builderItemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is DbClothingItem => Boolean(i)),
    [builderItemIds, items]
  );

  async function handleScore() {
    setScoring(true);
    setScoreError(null);
    try {
      const res = await fetch("/api/outfit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: builderItems.map((i) => ({ photoPath: i.photo_path, photoMime: i.photo_mime, label: i.ai_label })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Puanlama başarısız oldu.");
      setScoreResult({ score: json.score, comment: json.comment });
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : "Puanlama başarısız oldu.");
    }
    setScoring(false);
  }

  async function handleSaveOutfit() {
    if (!scoreResult) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertOutfit(supabase, user.id, categoryId, {
        name: builderItems.map((i) => i.ai_label).join(" + "),
        aiScore: scoreResult.score,
        aiComment: scoreResult.comment,
        itemIds: builderItemIds,
      });
      setOutfits((prev) => [created, ...prev]);
    }
    setBuilderItemIds([]);
    setScoreResult(null);
    setSaving(false);
  }

  function handleDiscard() {
    setBuilderItemIds([]);
    setScoreResult(null);
    setScoreError(null);
  }

  async function handleDeleteOutfit(outfit: DbOutfit) {
    const supabase = createClient();
    await deleteOutfit(supabase, outfit.id);
    setOutfits((prev) => prev.filter((o) => o.id !== outfit.id));
  }

  // Bir kombinin giyilme sayısı outfit_wears'tan doğrudan; bir PARÇANIN
  // giyilme sayısı ise o parçayı içeren tüm kombinlerin giyilme sayıları
  // toplamı (Indyx'teki piyasa araştırmasından ilham — cost-per-wear için).
  const outfitWearCounts = new Map<string, number>();
  for (const wear of outfitWears) {
    outfitWearCounts.set(wear.outfit_id, (outfitWearCounts.get(wear.outfit_id) ?? 0) + 1);
  }
  const itemWearCounts = new Map<string, number>();
  for (const outfit of outfits) {
    const count = outfitWearCounts.get(outfit.id) ?? 0;
    if (count === 0) continue;
    for (const itemId of outfit.item_ids) {
      itemWearCounts.set(itemId, (itemWearCounts.get(itemId) ?? 0) + count);
    }
  }

  const visibleItems = items.filter((item) => {
    if (categoryFilter !== "hepsi" && item.category !== categoryFilter) return false;
    if (showUnderused && (itemWearCounts.get(item.id) ?? 0) > 0) return false;
    return true;
  });

  // Bölüm 10 (2026-08-25) — Stil & Giyim, SelionAI'nin "lüks minimalizm +
  // galeri/atelier" tonundan ilham alarak sitenin geri kalanından bilinçli
  // farklılaşıyor (genel kural: "her kategori ayrı bir tarz olabilir",
  // Delta/Habitify/TickTick vb. gibi kod/marka kopyalanmadı — sadece renk
  // paleti/kompozisyon ruhu). 2026-09-02: Kategori Bazlı Tasarım
  // Farklılaştırma turuyla SelionAI'nin sıcak bordosu Whering'in neon
  // lime'ına (--stil-accent: #d4ff00) çevrildi, editoryal serif başlıklar
  // eklendi — --accent/--accent-soft/--accent-foreground de burada yerel
  // olarak eziliyor ki SegmentedControl gibi paylaşılan bileşenler de
  // lime'ı alsın (bkz. Spor & Vücut/Freeletics bölümündeki aynı desen).
  // Numaralı bölüm başlıkları (01/02/03) hâlâ duruyor, sadece başlık
  // tipografisi editoryal serife çevrildi.
  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5"
        style={{
          "--stil-accent": "#d4ff00",
          "--accent": "#d4ff00",
          "--accent-soft": "#d4ff0026",
          "--accent-foreground": "#141400",
        } as React.CSSProperties}
      >
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-xs font-semibold" style={{ color: "var(--stil-accent)" }}>
            01
          </span>
          <h2 className="font-serif text-lg font-medium italic tracking-tight text-foreground">Gardırobum</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <label
            className="btn flex h-10 w-fit cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:brightness-110"
            style={{
              borderColor: "color-mix(in srgb, var(--stil-accent) 50%, transparent)",
              color: "var(--stil-accent)",
              backgroundColor: "color-mix(in srgb, var(--stil-accent) 12%, transparent)",
            }}
          >
            {analyzing ? "Analiz ediliyor..." : "Parça Fotoğrafı Yükle"}
            <input type="file" accept="image/*" onChange={handlePhotoSelect} disabled={analyzing} className="hidden" />
          </label>
          <button
            type="button"
            onClick={() => setSmartDetectOpen(true)}
            className="btn flex h-10 w-fit items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:brightness-110"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            Ayna Selfisi Yükle (Otomatik Tespit)
          </button>
        </div>
        {analyzeError && <p className="text-xs text-negative">{analyzeError}</p>}
        {smartDetectOpen && (
          <MirrorSelfieDetector onClose={() => setSmartDetectOpen(false)} onConfirm={handleSmartDetectConfirm} />
        )}

        {!loading && items.length === 0 && <p className="text-sm text-muted">Henüz bir parça eklemedin.</p>}

        {!loading && items.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                size="sm"
                options={CATEGORY_FILTERS.map((c) => ({
                  value: c,
                  label: c === "hepsi" ? "Hepsi" : CLOTHING_CATEGORY_LABELS[c as ClothingCategory],
                }))}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
              <button
                type="button"
                onClick={() => setShowUnderused((v) => !v)}
                className="btn h-8 rounded-lg border px-3 text-xs font-medium"
                style={
                  showUnderused
                    ? { borderColor: "var(--stil-accent)", color: "var(--stil-accent)" }
                    : { borderColor: "var(--border-soft)", color: "var(--muted)" }
                }
              >
                Az Kullanılanlar
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {visibleItems.length === 0 && <p className="text-sm text-muted">Bu filtreye uyan parça yok.</p>}
              {visibleItems.map((item) => (
                <ClothingItemCard
                  key={item.id}
                  item={item}
                  photoUrl={photoUrls[item.id]}
                  onRemove={handleDeleteItem}
                  onOpenDetail={setDetailItem}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ClothingItemDetailModal
        item={detailItem}
        photoUrl={detailItem ? photoUrls[detailItem.id] : undefined}
        wearCount={detailItem ? (itemWearCounts.get(detailItem.id) ?? 0) : 0}
        onClose={() => setDetailItem(null)}
        onSave={handleUpdateItem}
        onDelete={handleDeleteItem}
      />

      {!loading && (
        <div
          className="mt-4 flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5"
          style={{
          "--stil-accent": "#d4ff00",
          "--accent": "#d4ff00",
          "--accent-soft": "#d4ff0026",
          "--accent-foreground": "#141400",
        } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-xs font-semibold" style={{ color: "var(--stil-accent)" }}>
              02
            </span>
            <h2 className="font-serif text-lg font-medium italic tracking-tight text-foreground">Kombin Oluştur</h2>
          </div>
          <OutfitBuilder
            id={BUILDER_ID}
            items={builderItems}
            photoUrls={photoUrls}
            onRemoveItem={handleRemoveFromBuilder}
            scoring={scoring}
            scoreError={scoreError}
            result={scoreResult}
            saving={saving}
            onScoreClick={handleScore}
            onSaveClick={handleSaveOutfit}
            onDiscardClick={handleDiscard}
          />
        </div>
      )}

      {!loading && outfits.length > 0 && (
        <div
          className="mt-4 flex flex-col gap-3 rounded-lg border border-border bg-surface shadow-card p-5"
          style={{
          "--stil-accent": "#d4ff00",
          "--accent": "#d4ff00",
          "--accent-soft": "#d4ff0026",
          "--accent-foreground": "#141400",
        } as React.CSSProperties}
        >
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-xs font-semibold" style={{ color: "var(--stil-accent)" }}>
              03
            </span>
            <h2 className="font-serif text-lg font-medium italic tracking-tight text-foreground">Kombinlerim</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                items={outfit.item_ids.map((id) => items.find((i) => i.id === id)).filter((i): i is DbClothingItem => Boolean(i))}
                photoUrls={photoUrls}
                wearCount={outfitWearCounts.get(outfit.id) ?? 0}
                onDelete={handleDeleteOutfit}
                onMarkWorn={handleMarkWorn}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="mt-4">
          <StyleAdvicePanel
            items={items}
            photoUrls={photoUrls}
            skinTone={styleProfile?.skin_tone ?? null}
            bodyType={styleProfile?.body_type ?? null}
            onSaveProfile={handleSaveStyleProfile}
            onSaveOutfit={handleSaveAdvisedOutfit}
          />
        </div>
      )}

      {!loading && (
        <div className="mt-4">
          <StyleCalendarPanel outfits={outfits} outfitWears={outfitWears} onLogWear={handleLogWear} onDeleteWear={handleDeleteWear} />
        </div>
      )}

      {!loading && (
        <div className="mt-4">
          <TravelPackingPanel items={items} photoUrls={photoUrls} />
        </div>
      )}
    </DndContext>
  );
}
