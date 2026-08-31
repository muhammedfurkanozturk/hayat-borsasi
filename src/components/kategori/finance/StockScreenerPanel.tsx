"use client";

import { useEffect, useState } from "react";
import { SearchIcon, TrashIcon } from "@/components/icons";

interface StockSearchResult {
  symbol: string;
  name: string;
}

interface Fundamentals {
  symbol: string;
  trailingPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null;
  returnOnEquity: number | null;
  revenueGrowth: number | null;
  currentRatio: number | null;
  debtToEquity: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  price: number | null;
  name: string | null;
}

type SortKey = "symbol" | "price" | "trailingPE" | "priceToBook" | "dividendYield" | "returnOnEquity";

const DEFAULT_SYMBOLS = ["THYAO", "GARAN", "TUPRS", "ASELS", "BIMAS"];

function fmtNum(value: number | null, digits = 2) {
  return value == null ? "—" : value.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtPct(value: number | null) {
  return value == null ? "—" : `%${(value * 100).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

// Simply Wall St'in hisse tarama tablosundan ilham — gerçek BIST'in tamamını
// ücretsiz/anahtarsız taramak mümkün değil, bu yüzden küçük bir varsayılan
// izleme listesi + kullanıcının kendi eklediği sembollerle sınırlı, oturum
// içi (kaydedilmeyen) bir karşılaştırma tablosu. Değerleme rakamları
// (P/E, P/B, temettü verimi, ROE) Yahoo Finance'in ücretsiz quoteSummary
// uç noktasından geliyor — hiçbir sektör/piyasa ortalaması karşılaştırması
// UYDURULMUYOR, sadece ham rakamlar + genel/statik referans notu gösteriliyor.
export function StockScreenerPanel() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [rows, setRows] = useState<Record<string, Fundamentals | null>>({});
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("trailingPE");
  const [sortAsc, setSortAsc] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/stock-fundamentals?symbols=${encodeURIComponent(symbols.join(","))}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setRows(json.fundamentals ?? {});
      })
      .catch(() => {
        if (!cancelled) setRows({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbols]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      fetch(`/api/stock-search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((json) => setResults(json.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  function addSymbol(symbol: string) {
    setSymbols((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]));
    setQuery("");
    setResults([]);
  }

  function removeSymbol(symbol: string) {
    setSymbols((prev) => prev.filter((s) => s !== symbol));
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const sorted = [...symbols].sort((a, b) => {
    const ra = rows[a];
    const rb = rows[b];
    let cmp = 0;
    if (sortKey === "symbol") {
      cmp = a.localeCompare(b);
    } else {
      const va = ra?.[sortKey] ?? null;
      const vb = rb?.[sortKey] ?? null;
      if (va == null && vb == null) cmp = 0;
      else if (va == null) cmp = 1;
      else if (vb == null) cmp = -1;
      else cmp = va - vb;
    }
    return sortAsc ? cmp : -cmp;
  });

  const columns: { key: SortKey; label: string }[] = [
    { key: "symbol", label: "Sembol" },
    { key: "price", label: "Fiyat" },
    { key: "trailingPE", label: "F/K" },
    { key: "priceToBook", label: "PD/DD" },
    { key: "dividendYield", label: "Temettü" },
    { key: "returnOnEquity", label: "ROE" },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Hisse Tarama</h2>
        {loading && <span className="text-xs text-muted">Yükleniyor...</span>}
      </div>
      <p className="text-xs text-muted">
        Sütun başlığına tıklayarak sırala. Değerleme rakamları Yahoo Finance&apos;in ücretsiz verisinden geliyor, gerçek
        sektör ortalamasıyla karşılaştırma yapılmıyor — genel kural olarak düşük F/K ve PD/DD, yüksek ROE ve temettü verimi
        &quot;ucuz/sağlıklı&quot; görünür ama bu tek başına yatırım tavsiyesi değildir.
      </p>

      <div className="relative">
        <div className="relative">
          <SearchIcon width={15} height={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Karşılaştırmaya hisse ekle (örn. AKBNK)"
            className="h-10 w-full rounded-lg border-2 border-muted/30 bg-surface pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
        </div>
        {query.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border-2 border-muted/25 bg-background-elevated shadow-xl">
            {searching && <p className="px-3 py-2 text-xs text-muted">Aranıyor...</p>}
            {!searching && results.length === 0 && <p className="px-3 py-2 text-xs text-muted">Sonuç bulunamadı.</p>}
            {results.map((r) => (
              <button
                key={r.symbol}
                type="button"
                onClick={() => addSymbol(r.symbol)}
                className="btn flex w-full flex-col items-start px-3 py-2 text-left hover:bg-accent-soft"
              >
                <span className="text-sm font-semibold text-foreground">{r.symbol}</span>
                <span className="text-xs text-muted">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left font-mono text-xs tabular-nums">
          <thead>
            <tr className="border-b border-border-soft text-muted">
              {columns.map((c) => (
                <th key={c.key} className="cursor-pointer select-none px-2 py-2 font-sans font-medium hover:text-foreground" onClick={() => toggleSort(c.key)}>
                  {c.label}
                  {sortKey === c.key && <span className="ml-1">{sortAsc ? "▲" : "▼"}</span>}
                </th>
              ))}
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((symbol) => {
              const f = rows[symbol];
              return (
                <tr key={symbol} className="group border-b border-border-soft/50">
                  <td className="px-2 py-2 font-sans font-semibold text-foreground">{symbol}</td>
                  <td className="px-2 py-2 text-foreground">{f?.price != null ? `${fmtNum(f.price)} ₺` : "—"}</td>
                  <td className="px-2 py-2 text-foreground">{fmtNum(f?.trailingPE ?? null)}</td>
                  <td className="px-2 py-2 text-foreground">{fmtNum(f?.priceToBook ?? null)}</td>
                  <td className="px-2 py-2 text-positive">{fmtPct(f?.dividendYield ?? null)}</td>
                  <td className="px-2 py-2 text-foreground">{fmtPct(f?.returnOnEquity ?? null)}</td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeSymbol(symbol)}
                      aria-label={`${symbol} sembolünü kaldır`}
                      className="btn text-muted opacity-0 hover:text-negative group-hover:opacity-100"
                    >
                      <TrashIcon width={12} height={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {symbols.length === 0 && <p className="py-4 text-center text-xs text-muted">Karşılaştırmak için yukarıdan bir hisse ekle.</p>}
      </div>
    </div>
  );
}
