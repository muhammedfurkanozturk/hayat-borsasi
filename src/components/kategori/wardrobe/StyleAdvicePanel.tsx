"use client";

import { useState } from "react";
import { CompassIcon, GearIcon } from "@/components/icons";
import type { DbClothingItem } from "@hayat-borsasi/shared";

interface AdviceResult {
  itemIds: string[];
  reasoning: string;
  score: number;
  weather: { tempC: number; label: string } | null;
}

// Acloset'ten (piyasa araştırması) ilham — mevcut "kombin puanla" akışının
// TERSİ: kullanıcı parça seçmiyor, AI mevcut gardıroptan (hava durumu +
// opsiyonel ortam/ten tonu/vücut tipiyle) bir kombin öneriyor. Ten tonu/
// vücut tipi TAMAMEN opsiyonel, küçük bir "Ayarlar" açılır paneliyle,
// hiçbir zaman zorunlu tutulmuyor.
export function StyleAdvicePanel({
  items,
  photoUrls,
  skinTone,
  bodyType,
  onSaveProfile,
  onSaveOutfit,
}: {
  items: DbClothingItem[];
  photoUrls: Record<string, string>;
  skinTone: string | null;
  bodyType: string | null;
  onSaveProfile: (skinTone: string | null, bodyType: string | null) => Promise<void>;
  onSaveOutfit: (itemIds: string[], score: number, reasoning: string) => Promise<void>;
}) {
  const [city, setCity] = useState("");
  const [occasion, setOccasion] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [skinToneInput, setSkinToneInput] = useState(skinTone ?? "");
  const [bodyTypeInput, setBodyTypeInput] = useState(bodyType ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdviceResult | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdvise() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/style-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardrobeItems: items.map((i) => ({
            id: i.id,
            label: i.ai_label,
            category: i.category,
            color: i.color,
            season: i.season,
            formality: i.formality,
          })),
          city: city.trim() || undefined,
          occasion: occasion.trim() || undefined,
          skinTone: skinTone || undefined,
          bodyType: bodyType || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Kombin önerisi alınamadı.");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kombin önerisi alınamadı.");
    }
    setLoading(false);
  }

  const suggestedItems = result ? result.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is DbClothingItem => Boolean(i)) : [];

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5"
      style={{ "--stil-accent": "#9c4a3d" } as React.CSSProperties}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-xs font-semibold" style={{ color: "var(--stil-accent)" }}>
            04
          </span>
          <h2 className="text-sm font-medium uppercase tracking-wider text-foreground">AI Stilist</h2>
        </div>
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          aria-label="Kişisel tercihler"
          className="btn flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft text-muted hover:text-foreground"
        >
          <GearIcon width={14} height={14} />
        </button>
      </div>

      {profileOpen && (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-muted/15 bg-background-elevated/50 p-3">
          <p className="text-xs text-muted">Tamamen opsiyonel — istersen boş bırak, AI Stilist yine çalışır.</p>
          <div className="flex gap-2">
            <input
              value={skinToneInput}
              onChange={(e) => setSkinToneInput(e.target.value)}
              placeholder="Ten tonu (örn. buğday)"
              className="h-9 flex-1 rounded-lg border-2 border-muted/25 bg-surface px-3 text-xs text-foreground outline-none placeholder:text-muted"
            />
            <input
              value={bodyTypeInput}
              onChange={(e) => setBodyTypeInput(e.target.value)}
              placeholder="Vücut tipi (örn. armut)"
              className="h-9 flex-1 rounded-lg border-2 border-muted/25 bg-surface px-3 text-xs text-foreground outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={async () => {
                await onSaveProfile(skinToneInput.trim() || null, bodyTypeInput.trim() || null);
                setProfileOpen(false);
              }}
              className="btn h-9 shrink-0 rounded-lg px-3 text-xs font-medium"
              style={{ backgroundColor: "color-mix(in srgb, var(--stil-accent) 15%, transparent)", color: "var(--stil-accent)" }}
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Şehir (opsiyonel, hava durumu için)"
          className="h-10 flex-1 rounded-lg border-2 border-muted/25 bg-background-elevated px-3 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <input
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="Ortam (opsiyonel, örn. iş toplantısı)"
          className="h-10 flex-1 rounded-lg border-2 border-muted/25 bg-background-elevated px-3 text-sm text-foreground outline-none placeholder:text-muted"
        />
      </div>

      <button
        type="button"
        onClick={handleAdvise}
        disabled={loading || items.length < 2}
        className="btn flex h-11 w-fit items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
        style={{ backgroundColor: "var(--stil-accent)" }}
      >
        <CompassIcon width={16} height={16} />
        {loading ? "Düşünüyor..." : "Bana Bir Kombin Öner"}
      </button>

      {items.length < 2 && <p className="text-xs text-muted">AI Stilist için gardırobunda en az birkaç parça olmalı.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 rounded-lg border-2 p-4" style={{ borderColor: "color-mix(in srgb, var(--stil-accent) 30%, transparent)" }}>
          {result.weather && (
            <p className="text-xs text-muted">
              {result.weather.label}, {Math.round(result.weather.tempC)}°C
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {suggestedItems.map((item) => (
              <div key={item.id} className="flex w-20 flex-col gap-1">
                {photoUrls[item.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrls[item.id]} alt={item.ai_label} className="aspect-square w-full rounded-lg object-cover" />
                )}
                <span className="line-clamp-2 text-[11px] text-muted">{item.ai_label}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-foreground">{result.reasoning}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await onSaveOutfit(result.itemIds, result.score, result.reasoning);
                setSaving(false);
                setResult(null);
              }}
              className="btn h-9 rounded-lg px-4 text-xs font-semibold text-white disabled:pointer-events-none disabled:opacity-50"
              style={{ backgroundColor: "var(--stil-accent)" }}
            >
              {saving ? "Kaydediliyor..." : "Bu Kombini Kaydet"}
            </button>
            <button type="button" onClick={() => setResult(null)} className="btn h-9 rounded-lg border-2 border-muted/25 px-4 text-xs text-muted hover:text-foreground">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
