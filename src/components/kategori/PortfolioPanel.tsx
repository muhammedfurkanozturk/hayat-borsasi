"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculatePortfolioXIRR,
  calculatePositions,
  calculateRealizedPnL,
  deletePortfolioTransaction,
  deletePriceAlert,
  dismissPriceAlert,
  fetchPortfolioTransactions,
  fetchPriceAlerts,
  insertPortfolioTransaction,
  insertPriceAlert,
  todayIso,
  type DbPortfolioTransaction,
  type DbPriceAlert,
  type PortfolioAssetType,
  type PortfolioTransactionType,
} from "@hayat-borsasi/shared";
import { BellIcon, TrashIcon } from "@/components/icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Modal } from "@/components/ui/Modal";
import { calculateSnowflake } from "@/lib/finance/snowflake";
import { createClient } from "@/lib/supabase/client";
import { SnowflakeRadar } from "./finance/SnowflakeRadar";
import { PortfolioTrendCard } from "./PortfolioTrendCard";

const METAL_LABELS: Record<"gold" | "silver", { symbol: string; name: string }> = {
  gold: { symbol: "ALTIN", name: "Altın (gram)" },
  silver: { symbol: "GUMUS", name: "Gümüş (gram)" },
};

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

function fmtRatio(value: number | null, digits = 2) {
  return value == null ? "—" : value.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtPercent(value: number | null) {
  return value == null ? "—" : `%${(value * 100).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

interface StockSearchResult {
  symbol: string;
  name: string;
}

interface SelectedAsset {
  symbol: string;
  name: string;
  assetType: PortfolioAssetType;
}

interface LiveQuote {
  price: number | null;
  dividendRate: number | null;
}

export function PortfolioPanel({ categoryId }: { categoryId: string }) {
  const [transactions, setTransactions] = useState<DbPortfolioTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [addAssetKind, setAddAssetKind] = useState<"stock" | "metal">("stock");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [metalPrices, setMetalPrices] = useState<{ gold: number | null; silver: number | null }>({
    gold: null,
    silver: null,
  });

  const [selected, setSelected] = useState<SelectedAsset | null>(null);
  const [txType, setTxType] = useState<PortfolioTransactionType>("buy");
  const [lot, setLot] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(todayIso());
  const [savingTx, setSavingTx] = useState(false);

  const [historySymbol, setHistorySymbol] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, LiveQuote>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

  const [alerts, setAlerts] = useState<DbPriceAlert[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertTarget, setAlertTarget] = useState("");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");
  const [savingAlert, setSavingAlert] = useState(false);

  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [fundamentalsLoading, setFundamentalsLoading] = useState(false);

  async function load() {
    const supabase = createClient();
    const rows = await fetchPortfolioTransactions(supabase, categoryId);
    setTransactions(rows);

    // Fiyat alarmları, migration henüz uygulanmadıysa hata fırlatabilir —
    // portföy takibi gibi ana özelliği kilitlemesin.
    try {
      const alertRows = await fetchPriceAlerts(supabase, categoryId);
      setAlerts(alertRows);
    } catch (err) {
      console.error("Fiyat alarmları yüklenemedi (migration uygulanmamış olabilir):", err);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    fetch("/api/market-watch")
      .then((res) => res.json())
      .then((json) => {
        const metals: { symbol: "gold" | "silver"; priceTryPerGram: number | null }[] = json.metals ?? [];
        const gold = metals.find((m) => m.symbol === "gold")?.priceTryPerGram ?? null;
        const silver = metals.find((m) => m.symbol === "silver")?.priceTryPerGram ?? null;
        setMetalPrices({ gold, silver });
      })
      .catch(() => setMetalPrices({ gold: null, silver: null }));
  }, []);

  const positions = useMemo(() => calculatePositions(transactions), [transactions]);

  useEffect(() => {
    const stockSymbols = positions.filter((p) => p.assetType === "stock").map((p) => p.symbol);
    if (stockSymbols.length === 0) {
      setLivePrices({});
      return;
    }
    setPricesLoading(true);
    fetch(`/api/stock-quote?symbols=${encodeURIComponent(stockSymbols.join(","))}`)
      .then((res) => res.json())
      .then((json) => setLivePrices(json.prices ?? {}))
      .catch(() => setLivePrices({}))
      .finally(() => setPricesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

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

  useEffect(() => {
    const historyAssetType = positions.find((p) => p.symbol === historySymbol)?.assetType;
    if (!historySymbol || historyAssetType !== "stock") {
      setFundamentals(null);
      return;
    }
    let cancelled = false;
    setFundamentalsLoading(true);
    fetch(`/api/stock-fundamentals?symbols=${encodeURIComponent(historySymbol)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setFundamentals(json.fundamentals?.[historySymbol] ?? null);
      })
      .catch(() => {
        if (!cancelled) setFundamentals(null);
      })
      .finally(() => {
        if (!cancelled) setFundamentalsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [historySymbol, positions]);

  function pickResult(result: StockSearchResult) {
    setSelected({ ...result, assetType: "stock" });
    setQuery("");
    setResults([]);
  }

  function pickMetal(kind: "gold" | "silver") {
    setSelected({ ...METAL_LABELS[kind], assetType: kind });
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const lotNum = Number(lot);
    const priceNum = Number(price);
    if (!(lotNum > 0) || !(priceNum >= 0) || !date) return;

    setSavingTx(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertPortfolioTransaction(supabase, user.id, categoryId, {
        symbol: selected.symbol,
        assetType: selected.assetType,
        transactionType: txType,
        quantity: lotNum,
        pricePerUnit: priceNum,
        transactionDate: date,
      });
      setTransactions((prev) => [created, ...prev]);
    }
    setSelected(null);
    setLot("");
    setPrice("");
    setTxType("buy");
    setSavingTx(false);
  }

  async function handleDeleteTransaction(id: string) {
    const supabase = createClient();
    await deletePortfolioTransaction(supabase, id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleCreateAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!historySymbol) return;
    const targetNum = Number(alertTarget);
    if (!(targetNum > 0)) return;

    setSavingAlert(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertPriceAlert(supabase, user.id, categoryId, {
        symbol: historySymbol,
        targetPrice: targetNum,
        direction: alertDirection,
      });
      setAlerts((prev) => [created, ...prev]);
    }
    setAlertTarget("");
    setSavingAlert(false);
  }

  async function handleDeleteAlert(id: string) {
    const supabase = createClient();
    await deletePriceAlert(supabase, id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleDismissAlert(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed_at: new Date().toISOString() } : a)));
    const supabase = createClient();
    await dismissPriceAlert(supabase, id);
  }

  function metalPriceFor(assetType: PortfolioAssetType): number | null {
    if (assetType === "gold") return metalPrices.gold;
    if (assetType === "silver") return metalPrices.silver;
    return null;
  }

  const summary = useMemo(() => {
    const totalInvested = positions.reduce((sum, p) => sum + p.totalCost, 0);
    const currentValue = positions.reduce((sum, p) => {
      if (p.assetType === "gold" || p.assetType === "silver") {
        const gramPrice = metalPriceFor(p.assetType);
        return sum + p.quantity * (gramPrice ?? p.averageCost);
      }
      const live = livePrices[p.symbol];
      return sum + p.quantity * (live?.price ?? p.averageCost);
    }, 0);
    const profit = currentValue - totalInvested;
    const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    // Snowball'daki (piyasa araştırması) "beklenen gelecek gelir" fikri —
    // BIST'te temettü genelde yılda bir ödendiği için tek yıllık rakam,
    // Snowball'un ay bazlı dağılımı Yahoo'nun ücretsiz API'sinde yok
    // (dividendDate boş geliyor, canlı sorguyla doğrulandı).
    const annualDividendIncome = positions.reduce((sum, p) => {
      if (p.assetType !== "stock") return sum;
      const dividendRate = livePrices[p.symbol]?.dividendRate;
      return sum + p.quantity * (dividendRate ?? 0);
    }, 0);
    const realizedPnL = calculateRealizedPnL(transactions);
    // Simply Wall St'teki (piyasa araştırması) "gerçek getiri" fikri — basit
    // kâr% (yukarıdaki profitPct) para giriş ZAMANLARINI görmezden geliyor,
    // XIRR her nakit akışını gerçek tarihiyle iskonto ediyor (bkz. portfolio.ts).
    const xirr = calculatePortfolioXIRR(transactions, currentValue);
    return { totalInvested, currentValue, profit, profitPct, annualDividendIncome, realizedPnL, xirr };
  }, [positions, livePrices, transactions, metalPrices]);

  const historyTransactions = historySymbol ? transactions.filter((t) => t.symbol === historySymbol) : [];
  const buys = historyTransactions.filter((t) => t.transaction_type === "buy").sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  const sells = historyTransactions.filter((t) => t.transaction_type === "sell").sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
  const historyAlerts = historySymbol ? alerts.filter((a) => a.symbol === historySymbol && !a.triggered_at) : [];
  const activeAlertNotifications = alerts.filter((a) => a.triggered_at && !a.dismissed_at);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Portföy</h2>
        <button
          type="button"
          onClick={() => setAlertsOpen(true)}
          aria-label="Fiyat alarmları"
          className="btn relative flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground"
        >
          <BellIcon width={16} height={16} />
          {activeAlertNotifications.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-negative text-[9px] font-semibold text-white">
              {activeAlertNotifications.length}
            </span>
          )}
        </button>
      </div>

      {positions.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border-2 border-muted/25 p-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Portföyüm</span>
          <div className="grid grid-cols-1 gap-2 font-mono text-sm tabular-nums text-foreground sm:grid-cols-3">
            <span>Yatırılan: {summary.totalInvested.toFixed(2)} ₺</span>
            <span>{pricesLoading ? "Güncel değer: ..." : `Güncel değer: ${summary.currentValue.toFixed(2)} ₺`}</span>
            <span className={summary.profit >= 0 ? "text-positive" : "text-negative"}>
              {summary.profit >= 0 ? "▲" : "▼"} {summary.profit.toFixed(2)} ₺ ({summary.profitPct.toFixed(1)}%)
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-border-soft pt-2 font-mono text-xs tabular-nums text-muted sm:grid-cols-2">
            {summary.realizedPnL !== 0 && (
              <span>
                Gerçekleşen K/Z:{" "}
                <span className={summary.realizedPnL >= 0 ? "text-positive" : "text-negative"}>
                  {summary.realizedPnL >= 0 ? "▲" : "▼"} {summary.realizedPnL.toFixed(2)} ₺
                </span>
              </span>
            )}
            {summary.annualDividendIncome > 0 && <span>Yıllık Beklenen Temettü: {summary.annualDividendIncome.toFixed(2)} ₺</span>}
            {summary.xirr != null && (
              <span>
                Gerçek Getiri (XIRR):{" "}
                <span className={summary.xirr >= 0 ? "text-positive" : "text-negative"}>
                  %{(summary.xirr * 100).toFixed(1)} / yıl
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {!loading && <PortfolioTrendCard positions={positions} />}

      <div className="flex flex-col gap-2">
        <SegmentedControl
          size="sm"
          value={addAssetKind}
          onChange={setAddAssetKind}
          options={[
            { value: "stock", label: "Hisse" },
            { value: "metal", label: "Kıymetli Maden" },
          ]}
          className="self-start"
        />
        {addAssetKind === "stock" && (
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hisse ara (örn. THYAO)"
              className="h-10 w-full rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
            {query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border-2 border-muted/25 bg-background-elevated shadow-xl">
                {searching && <p className="px-3 py-2 text-xs text-muted">Aranıyor...</p>}
                {!searching && results.length === 0 && <p className="px-3 py-2 text-xs text-muted">Sonuç bulunamadı.</p>}
                {results.map((r) => (
                  <button
                    key={r.symbol}
                    type="button"
                    onClick={() => pickResult(r)}
                    className="btn flex w-full flex-col items-start px-3 py-2 text-left hover:bg-accent-soft"
                  >
                    <span className="text-sm font-semibold text-foreground">{r.symbol}</span>
                    <span className="text-xs text-muted">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {addAssetKind === "metal" && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => pickMetal("gold")}
              className="btn flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 py-2 text-left text-sm hover:border-accent/40"
            >
              <span className="font-semibold text-foreground">Altın</span>
              <span className="block font-mono text-xs tabular-nums text-muted">
                {metalPrices.gold != null ? `${metalPrices.gold.toFixed(2)} ₺/gr` : "Fiyat yükleniyor..."}
              </span>
            </button>
            <button
              type="button"
              onClick={() => pickMetal("silver")}
              className="btn flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 py-2 text-left text-sm hover:border-accent/40"
            >
              <span className="font-semibold text-foreground">Gümüş</span>
              <span className="block font-mono text-xs tabular-nums text-muted">
                {metalPrices.silver != null ? `${metalPrices.silver.toFixed(2)} ₺/gr` : "Fiyat yükleniyor..."}
              </span>
            </button>
          </div>
        )}
      </div>

      {!loading && positions.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {positions.map((p) => {
            // Snowball'daki (piyasa araştırması) "maliyet üzerinden getiri"
            // (yield on cost) fikri — yıllık temettü / alış maliyeti.
            const dividendRate = livePrices[p.symbol]?.dividendRate;
            const yieldOnCost = dividendRate ? (dividendRate / p.averageCost) * 100 : null;
            const isMetal = p.assetType === "gold" || p.assetType === "silver";
            const gramPrice = isMetal ? metalPriceFor(p.assetType) : null;
            const gramChangePct = gramPrice != null ? ((gramPrice - p.averageCost) / p.averageCost) * 100 : null;
            return (
              <button
                key={p.symbol}
                type="button"
                onClick={() => setHistorySymbol(p.symbol)}
                className="btn flex flex-col items-start gap-1 rounded-lg border-2 border-muted/25 bg-background-elevated p-3 text-left hover:border-accent/40"
              >
                <span className="text-sm font-semibold text-foreground">{p.symbol}</span>
                <span className="font-mono text-xs tabular-nums text-muted">{p.quantity} {isMetal ? "gr" : "lot"}</span>
                <span className="font-mono text-xs tabular-nums text-muted">Ort. {p.averageCost.toFixed(2)} ₺</span>
                {isMetal && gramPrice != null && gramChangePct != null && (
                  <span className={`font-mono text-[11px] tabular-nums ${gramChangePct >= 0 ? "text-positive" : "text-negative"}`}>
                    {gramChangePct >= 0 ? "▲" : "▼"} {gramPrice.toFixed(2)} ₺/gr
                  </span>
                )}
                {!isMetal && yieldOnCost != null && (
                  <span className="font-mono text-[11px] tabular-nums text-positive">%{yieldOnCost.toFixed(1)} YoC</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        panelClassName="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-background-elevated p-5"
      >
        {selected && (
          <form onSubmit={handleAddTransaction} className="flex flex-col gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">{selected.symbol}</h3>
              <p className="text-xs text-muted">{selected.name}</p>
            </div>
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value as PortfolioTransactionType)}
              className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none"
            >
              <option value="buy">Alış</option>
              <option value="sell">Satış</option>
            </select>
            <input
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              placeholder={selected.assetType === "stock" ? "Lot miktarı" : "Gram miktarı"}
              inputMode="decimal"
              className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={selected.assetType === "stock" ? "Birim fiyat (₺)" : "Gram başına fiyat (₺)"}
              inputMode="decimal"
              className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayIso()}
              className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none"
            />
            <button
              type="submit"
              disabled={savingTx}
              className="btn h-10 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            >
              {savingTx ? "Ekleniyor..." : "İşlemi Ekle"}
            </button>
          </form>
        )}
      </Modal>

      <Modal
        open={historySymbol !== null}
        onClose={() => setHistorySymbol(null)}
        panelClassName="flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-border bg-background-elevated p-5"
      >
        <h3 className="text-base font-semibold text-foreground">{historySymbol}</h3>

        {fundamentalsLoading && <p className="text-xs text-muted">Değerleme verileri yükleniyor...</p>}
        {!fundamentalsLoading && fundamentals && (
          <div className="grid grid-cols-1 gap-3 border-b border-border-soft pb-3 sm:grid-cols-2">
            <SnowflakeRadar axes={calculateSnowflake(fundamentals)} />
            <div className="flex flex-col justify-center gap-1.5 font-mono text-xs tabular-nums">
              <span className="mb-1 font-sans text-[11px] font-medium uppercase tracking-wider text-muted">Değerleme</span>
              <span className="text-foreground">F/K: {fmtRatio(fundamentals.trailingPE)}</span>
              <span className="text-foreground">PD/DD: {fmtRatio(fundamentals.priceToBook)}</span>
              <span className="text-foreground">Temettü Verimi: {fmtPercent(fundamentals.dividendYield)}</span>
              <span className="text-foreground">Özkaynak Karlılığı (ROE): {fmtPercent(fundamentals.returnOnEquity)}</span>
              <p className="mt-1 font-sans text-[10px] leading-snug text-muted">
                Genel kural: düşük F/K ve PD/DD ucuz, yüksek ROE ve temettü verimi sağlıklı görünür — gerçek sektör
                ortalamasıyla kıyaslanmıyor, tek başına yatırım tavsiyesi değildir.
              </p>
            </div>
          </div>
        )}
        {!fundamentalsLoading && !fundamentals && (
          <p className="text-xs text-muted">Bu sembol için değerleme verisi bulunamadı.</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-negative">Satışlar</span>
            {sells.length === 0 && <p className="text-xs text-muted">Satış yok.</p>}
            {sells.map((tx) => (
              <div
                key={tx.id}
                className="group flex items-center justify-between gap-2 rounded-lg border-2 border-negative/20 px-2.5 py-1.5 text-xs"
              >
                <span className="text-foreground">
                  {tx.quantity} × {tx.price_per_unit}₺
                </span>
                <span className="text-muted">{tx.transaction_date}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteTransaction(tx.id)}
                  aria-label="İşlemi sil"
                  className="btn text-muted opacity-0 hover:text-negative group-hover:opacity-100"
                >
                  <TrashIcon width={12} height={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-positive">Alışlar</span>
            {buys.length === 0 && <p className="text-xs text-muted">Alış yok.</p>}
            {buys.map((tx) => (
              <div
                key={tx.id}
                className="group flex items-center justify-between gap-2 rounded-lg border-2 border-positive/20 px-2.5 py-1.5 text-xs"
              >
                <span className="text-foreground">
                  {tx.quantity} × {tx.price_per_unit}₺
                </span>
                <span className="text-muted">{tx.transaction_date}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteTransaction(tx.id)}
                  aria-label="İşlemi sil"
                  className="btn text-muted opacity-0 hover:text-negative group-hover:opacity-100"
                >
                  <TrashIcon width={12} height={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border-soft pt-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Fiyat Alarmları</span>
          {historyAlerts.length === 0 && <p className="text-xs text-muted">Bu hisse için aktif alarm yok.</p>}
          {historyAlerts.map((alert) => (
            <div
              key={alert.id}
              className="group flex items-center justify-between gap-2 rounded-lg border-2 border-muted/20 px-2.5 py-1.5 text-xs"
            >
              <span className="text-foreground">
                {alert.direction === "above" ? "Yükselince" : "Düşünce"} {alert.target_price}₺
              </span>
              <button
                type="button"
                onClick={() => handleDeleteAlert(alert.id)}
                aria-label="Alarmı sil"
                className="btn text-muted opacity-0 hover:text-negative group-hover:opacity-100"
              >
                <TrashIcon width={12} height={12} />
              </button>
            </div>
          ))}
          <form onSubmit={handleCreateAlert} className="flex gap-2">
            <select
              value={alertDirection}
              onChange={(e) => setAlertDirection(e.target.value as "above" | "below")}
              className="h-9 rounded-lg border-2 border-muted/30 bg-surface px-2 text-xs text-foreground outline-none"
            >
              <option value="above">Yükselince</option>
              <option value="below">Düşünce</option>
            </select>
            <input
              value={alertTarget}
              onChange={(e) => setAlertTarget(e.target.value)}
              placeholder="Hedef fiyat (₺)"
              inputMode="decimal"
              className="h-9 flex-1 rounded-lg border-2 border-muted/30 bg-surface px-3 text-xs text-foreground outline-none placeholder:text-muted focus:border-accent/50"
            />
            <button
              type="submit"
              disabled={savingAlert || !alertTarget.trim()}
              className="btn h-9 shrink-0 rounded-lg bg-accent-soft px-3 text-xs font-medium text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
            >
              Alarm Kur
            </button>
          </form>
        </div>
      </Modal>

      <Modal
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        panelClassName="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-background-elevated p-5"
      >
        <h3 className="text-base font-semibold text-foreground">Fiyat Alarmları</h3>
        <p className="text-xs text-muted">
          Vercel&apos;in ücretsiz planında kontrol günde bir kez yapılıyor (BIST kapanışına yakın) — anlık değil.
        </p>
        {activeAlertNotifications.length === 0 && <p className="text-sm text-muted">Yeni bildirim yok.</p>}
        {activeAlertNotifications.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between gap-2 rounded-lg border-2 border-accent/40 bg-accent-soft/30 px-3 py-2 text-sm"
          >
            <span className="text-foreground">
              {alert.symbol} {alert.direction === "above" ? "hedefi aştı" : "hedefin altına indi"} ({alert.target_price}₺)
            </span>
            <button
              type="button"
              onClick={() => handleDismissAlert(alert.id)}
              className="btn shrink-0 rounded-md px-2 py-1 text-xs text-muted hover:text-foreground"
            >
              Kapat
            </button>
          </div>
        ))}
      </Modal>
    </div>
  );
}
