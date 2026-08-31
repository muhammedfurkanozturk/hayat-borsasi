"use client";

import { useEffect, useRef, useState } from "react";

interface FoodSearchResult {
  id: string;
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  portion: string | null;
  source: "usda" | "off";
}

const DEBOUNCE_MS = 400;

// 2026-08-27 — MyFitnessPal/Cronometer tarzı arama-yaz-seç deneyimi: USDA
// FoodData Central (temel gıdalar, isimle) + Open Food Facts (markalı
// ürünler, barkod numarası yazılırsa) — /api/food-search tek bir uç nokta
// üzerinden ikisini de yönlendiriyor. Sonuç bulunamazsa veya kullanıcı
// hiçbirini seçmezse "Serbest metinle ekle" ile eski davranışa (sadece ad,
// besin değeri yok) düşülüyor — temel gıda veritabanında olmayan ev
// yemekleri (ör. "annemin mercimek çorbası") için gerekli.
export function FoodSearchInput({
  onSelectResult,
  onFreeTextAdd,
  saving,
}: {
  onSelectResult: (result: FoodSearchResult) => void;
  onFreeTextAdd: (description: string) => void;
  saving: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bu effect, query'yi harici bir sistemle (debounce'lı /api/food-search
  // ağ çağrısı) senkronize ediyor — kısa sorgularda önceki sonuçları
  // temizlemek de bu senkronizasyonun bir parçası, ayrı bir olay değil.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/food-search?q=${encodeURIComponent(trimmed)}`);
        const json = await res.json();
        setResults(Array.isArray(json.results) ? json.results : []);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(result: FoodSearchResult) {
    onSelectResult(result);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function handleFreeTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onFreeTextAdd(trimmed);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <form onSubmit={handleFreeTextSubmit} className="relative flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="relative flex-1">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ne yedin? (örn. muz, ya da barkod numarası)"
          className="h-10 w-full rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
        />
        {open && query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border-2 border-border bg-background-elevated shadow-lg">
            {searching && <p className="px-3 py-2.5 text-xs text-muted">Aranıyor...</p>}
            {!searching && results.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-muted">Sonuç yok — serbest metinle ekleyebilirsin.</p>
            )}
            {!searching &&
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelect(r)}
                  className="btn flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-surface-hover"
                >
                  <span className="text-sm text-foreground">{r.description}</span>
                  <span className="font-mono text-[11px] tabular-nums text-muted">
                    {r.calories ?? "—"} kcal · {r.proteinG ?? "—"}g protein
                    {r.portion ? ` · ${r.portion}` : ""} · {r.source === "usda" ? "USDA" : "Open Food Facts"}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={saving || !query.trim()}
        className="btn h-10 shrink-0 rounded-lg bg-accent-soft px-4 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
      >
        {saving ? "Ekleniyor..." : "Serbest Ekle"}
      </button>
    </form>
  );
}
