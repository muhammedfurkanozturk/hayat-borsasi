"use client";

import { useState } from "react";
import { CheckMark } from "@/components/CheckMark";
import { PlaneIcon } from "@/components/icons";
import { todayIso, type DbClothingItem } from "@hayat-borsasi/shared";

interface PackingResult {
  itemIds: string[];
  note: string;
  tempMinC: number | null;
  tempMaxC: number | null;
  rainy: boolean;
  forecastAvailable: boolean;
  days: number;
}

// Acloset'ten (piyasa araştırması) ilham — gerçek hava durumu (Open-Meteo)
// + gardıroptan AI'ın seçtiği bir parça seti ile seyahat paketleme listesi.
// Open-Meteo'nun ücretsiz tahmini ~16 gün ileriye gidiyor — daha uzak bir
// tarih seçilirse dürüstçe "henüz tahmin yok" gösteriyoruz, UYDURMUYORUZ.
export function TravelPackingPanel({ items, photoUrls }: { items: DbClothingItem[]; photoUrls: Record<string, string> }) {
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackingResult | null>(null);
  const [packed, setPacked] = useState<Set<string>>(new Set());

  async function handleGenerate() {
    if (!city.trim()) {
      setError("Bir şehir gir.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setPacked(new Set());
    try {
      const res = await fetch("/api/travel-packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim(),
          startDate,
          endDate,
          wardrobeItems: items.map((i) => ({
            id: i.id,
            label: i.ai_label,
            category: i.category,
            color: i.color,
            season: i.season,
            formality: i.formality,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Paketleme listesi alınamadı.");
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paketleme listesi alınamadı.");
    }
    setLoading(false);
  }

  function togglePacked(id: string) {
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const suggestedItems = result ? result.itemIds.map((id) => items.find((i) => i.id === id)).filter((i): i is DbClothingItem => Boolean(i)) : [];

  return (
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
          06
        </span>
        <h2 className="font-serif text-lg font-medium italic tracking-tight text-foreground">Seyahat Paketleme Listesi</h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Şehir"
          className="h-10 flex-1 rounded-lg border-2 border-muted/25 bg-background-elevated px-3 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-10 rounded-lg border-2 border-muted/25 bg-background-elevated px-3 text-sm text-foreground outline-none"
        />
        <input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-10 rounded-lg border-2 border-muted/25 bg-background-elevated px-3 text-sm text-foreground outline-none"
        />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || items.length < 2}
        className="btn flex h-11 w-fit items-center gap-2 rounded-lg px-5 text-sm font-semibold text-[#141400] disabled:pointer-events-none disabled:opacity-50"
        style={{ backgroundColor: "var(--stil-accent)" }}
      >
        <PlaneIcon width={16} height={16} />
        {loading ? "Hazırlanıyor..." : "Paketleme Listesi Oluştur"}
      </button>

      {items.length < 2 && <p className="text-xs text-muted">Paketleme listesi için gardırobunda en az birkaç parça olmalı.</p>}
      {error && <p className="text-xs text-negative">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3 rounded-lg border-2 p-4" style={{ borderColor: "color-mix(in srgb, var(--stil-accent) 30%, transparent)" }}>
          <p className="text-xs text-muted">
            {result.days} günlük seyahat —{" "}
            {result.forecastAvailable && result.tempMinC != null && result.tempMaxC != null
              ? `tahmini ${Math.round(result.tempMinC)}-${Math.round(result.tempMaxC)}°C${result.rainy ? ", yağış ihtimali var" : ""}`
              : "bu tarih için henüz hava durumu tahmini yok (16 günden uzak olabilir), mevsime göre genel bir öneri"}
          </p>
          <div className="flex flex-col gap-1.5">
            {suggestedItems.map((item) => (
              <button key={item.id} type="button" onClick={() => togglePacked(item.id)} className="btn group flex w-full items-center gap-2.5 rounded-lg bg-background-elevated px-3 py-2 text-left">
                <CheckMark checked={packed.has(item.id)} size={18} />
                {photoUrls[item.id] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrls[item.id]} alt={item.ai_label} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                )}
                <span className={`flex-1 text-sm ${packed.has(item.id) ? "text-muted line-through decoration-muted" : "text-foreground"}`}>{item.ai_label}</span>
              </button>
            ))}
          </div>
          {result.note && <p className="text-sm text-foreground">{result.note}</p>}
        </div>
      )}
    </div>
  );
}
