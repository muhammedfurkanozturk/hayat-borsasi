"use client";

import { useEffect, useState } from "react";
import {
  calculatePositions,
  deletePortfolioTransaction,
  fetchPortfolioTransactions,
  insertPortfolioTransaction,
  todayIso,
  type DbPortfolioTransaction,
  type PortfolioAssetType,
  type PortfolioTransactionType,
} from "@hayat-borsasi/shared";
import { TrashIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

export function PortfolioPanel({ categoryId }: { categoryId: string }) {
  const [transactions, setTransactions] = useState<DbPortfolioTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState<PortfolioAssetType>("stock");
  const [transactionType, setTransactionType] = useState<PortfolioTransactionType>("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const rows = await fetchPortfolioTransactions(supabase, categoryId);
    setTransactions(rows);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const priceNum = Number(price);
    if (!symbol.trim() || !(qty > 0) || !(priceNum >= 0)) return;

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertPortfolioTransaction(supabase, user.id, categoryId, {
        symbol: symbol.trim(),
        assetType,
        transactionType,
        quantity: qty,
        pricePerUnit: priceNum,
        transactionDate: date,
      });
      setTransactions((prev) => [created, ...prev]);
      setSymbol("");
      setQuantity("");
      setPrice("");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await deletePortfolioTransaction(supabase, id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const positions = calculatePositions(transactions);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Portföy</h2>
      <p className="text-xs text-muted">
        Canlı fiyat/anlık kâr-zarar henüz yok — şimdilik maliyet bazlı takip. Gerçek bir emir/işlem
        yapılmaz, sadece kendi kaydettiğin alım/satımlar burada tutulur.
      </p>

      {positions.length > 0 && (
        <div className="flex flex-col gap-2">
          {positions.map((p) => (
            <div
              key={p.symbol}
              className="flex items-center justify-between rounded-lg border-2 border-muted/20 bg-background-elevated px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{p.symbol}</span>
                <span className="rounded-full border border-border-soft px-2 py-0.5 text-xs text-muted">
                  {p.assetType === "gold" ? "Altın" : "Hisse"}
                </span>
              </div>
              <div className="text-right font-mono text-xs tabular-nums text-muted">
                <div>{p.quantity} adet</div>
                <div>Ort. maliyet {p.averageCost.toFixed(2)} ₺</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border-2 border-muted/30 p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Sembol (örn. THYAO)"
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <select
            value={assetType}
            onChange={(e) => setAssetType(e.target.value as PortfolioAssetType)}
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none"
          >
            <option value="stock">Hisse</option>
            <option value="gold">Altın</option>
          </select>
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as PortfolioTransactionType)}
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-2 text-sm text-foreground outline-none"
          >
            <option value="buy">Alış</option>
            <option value="sell">Satış</option>
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none"
          />
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Miktar"
            inputMode="decimal"
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Birim fiyat (₺)"
            inputMode="decimal"
            className="h-10 rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/50"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn h-10 self-start rounded-lg bg-accent-soft px-5 text-sm font-semibold text-accent hover:bg-accent/25 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "Ekleniyor..." : "İşlem Ekle"}
        </button>
      </form>

      {!loading && transactions.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center gap-3 rounded-lg border-2 border-muted/20 px-3 py-2 text-sm"
            >
              <span
                className={`w-12 shrink-0 text-xs font-semibold ${
                  tx.transaction_type === "buy" ? "text-positive" : "text-negative"
                }`}
              >
                {tx.transaction_type === "buy" ? "ALIŞ" : "SATIŞ"}
              </span>
              <span className="flex-1 text-foreground">
                {tx.symbol} — {tx.quantity} adet × {tx.price_per_unit} ₺
              </span>
              <span className="text-xs text-muted">{tx.transaction_date}</span>
              <button
                type="button"
                onClick={() => handleDelete(tx.id)}
                aria-label="İşlemi sil"
                className="btn text-muted hover:text-negative"
              >
                <TrashIcon width={16} height={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
