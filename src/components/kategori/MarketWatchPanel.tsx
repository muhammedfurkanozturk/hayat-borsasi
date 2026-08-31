"use client";

import { useEffect, useState } from "react";
import { DeltaBadge } from "@/components/dashboard/DeltaBadge";

interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  priceTry: number | null;
  changePercent24h: number | null;
  volumeTry24h: number | null;
}

interface MarketStockQuote {
  symbol: string;
  name: string | null;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
}

interface MetalQuote {
  symbol: "gold" | "silver";
  name: string;
  priceTryPerGram: number | null;
  changePercent: number | null;
}

function formatTry(value: number | null, digits = 2) {
  if (value == null) return "—";
  return value.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + " ₺";
}

function formatCompact(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

// CoinMarketCap'in "Bitcoin Fiyatları" tablosundan ilham (Bölüm 6,
// 2026-08-25) — ama borsa-bazlı derinlik/likidite verisi ücretsiz API'lerle
// mümkün değil (bkz. CLAUDE.md), bu yüzden tek satır/varlık, fiyat+24s
// değişim+hacim formatında sadeleştirildi. Bu SADECE takip amaçlı, gerçek
// emir verilmiyor — Portföy (PortfolioPanel) ile karıştırılmasın diye ayrı
// bir panel. Veri kaynağı: kripto CoinGecko, hisse+altın/gümüş
// yahoo-finance2 (src/lib/finance/stock-data.ts, crypto-data.ts).
export function MarketWatchPanel() {
  const [crypto, setCrypto] = useState<CryptoQuote[]>([]);
  const [stocks, setStocks] = useState<MarketStockQuote[]>([]);
  const [metals, setMetals] = useState<MetalQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/market-watch");
        if (!res.ok) throw new Error("İstek başarısız.");
        const json = await res.json();
        if (cancelled) return;
        setCrypto(json.crypto ?? []);
        setStocks(json.stocks ?? []);
        setMetals(json.metals ?? []);
      } catch (err) {
        if (!cancelled) setError("Piyasa verileri alınamadı.");
        console.error(err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <div>
        <h2 className="text-sm font-medium text-foreground">Piyasalar</h2>
        <p className="text-xs text-muted">Sadece takip amaçlı — emir verilmez, Portföyü etkilemez. ~15-20dk gecikmeli.</p>
      </div>

      {loading && <p className="text-sm text-muted">Yükleniyor...</p>}
      {error && <p className="text-sm text-negative">{error}</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-5">
          <MarketSection title="Bitcoin">
            {crypto.map((c) => (
              <MarketRow
                key={c.id}
                label={c.symbol}
                sublabel={c.name}
                price={formatTry(c.priceTry)}
                change={c.changePercent24h}
                extra={`Hacim (24s): ${formatCompact(c.volumeTry24h)} ₺`}
              />
            ))}
          </MarketSection>

          <MarketSection title="Hisse (BIST)">
            {stocks.map((s) => (
              <MarketRow
                key={s.symbol}
                label={s.symbol}
                sublabel={s.name ?? undefined}
                price={formatTry(s.price)}
                change={s.changePercent}
                extra={`Hacim: ${formatCompact(s.volume)}`}
              />
            ))}
          </MarketSection>

          <MarketSection title="Emtia">
            {metals.map((m) => (
              <MarketRow
                key={m.symbol}
                label={m.name}
                price={formatTry(m.priceTryPerGram)}
                change={m.changePercent}
              />
            ))}
          </MarketSection>
        </div>
      )}
    </div>
  );
}

function MarketSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-muted">{title}</span>
      <div className="flex flex-col divide-y divide-border-soft rounded-lg border border-border-soft">{children}</div>
    </div>
  );
}

function MarketRow({
  label,
  sublabel,
  price,
  change,
  extra,
}: {
  label: string;
  sublabel?: string;
  price: string;
  change: number | null;
  extra?: string;
}) {
  return (
    <div className="ledger-row flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {sublabel && <span className="truncate text-xs text-muted">{sublabel}</span>}
      </div>
      <div className="flex items-center gap-3">
        {extra && <span className="hidden font-mono text-xs text-muted sm:inline">{extra}</span>}
        <span className="font-mono text-sm font-semibold tabular-nums text-foreground">{price}</span>
        {change != null && <DeltaBadge delta={change} />}
      </div>
    </div>
  );
}
