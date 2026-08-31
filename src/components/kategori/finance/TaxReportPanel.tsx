"use client";

import { useEffect, useState } from "react";
import {
  calculateRealizedPnLByYear,
  fetchPortfolioTransactions,
  type DbPortfolioTransaction,
} from "@hayat-borsasi/shared";
import { createClient } from "@/lib/supabase/client";

function toCsv(transactions: DbPortfolioTransaction[]): string {
  const header = ["Tarih", "Sembol", "Varlık Türü", "İşlem", "Miktar", "Birim Fiyat (₺)", "Tutar (₺)"];
  const rows = transactions
    .slice()
    .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))
    .map((tx) => {
      const total = (tx.quantity * tx.price_per_unit).toFixed(2);
      const type = tx.transaction_type === "buy" ? "Alış" : "Satış";
      return [tx.transaction_date, tx.symbol, tx.asset_type, type, String(tx.quantity), tx.price_per_unit.toFixed(2), total];
    });
  return [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Sharesight'taki (piyasa araştırması) "vergi/muhasebe raporu + CSV export"
// fikri — GERÇEK bir vergi hesaplama/tavsiye motoru DEĞİL (Türkiye'deki
// menkul kıymet vergilendirmesi ürün türüne, elde tutma süresine ve
// mevzuata göre değişir, bu proje bunu modellemiyor) — sadece kullanıcının
// kendi işlem geçmişini yıla göre gruplayıp gösteren ve tam ledger'ı CSV
// olarak dışa aktarabilen bir muhasebe/kayıt aracı. Mali müşavire götürülecek
// ham veri, hazır bir beyanname değil.
export function TaxReportPanel({ categoryId }: { categoryId: string }) {
  const [transactions, setTransactions] = useState<DbPortfolioTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    fetchPortfolioTransactions(supabase, categoryId)
      .then((rows) => {
        if (!cancelled) setTransactions(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  const yearly = calculateRealizedPnLByYear(transactions);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Vergi &amp; Muhasebe Raporu</h2>
        {loading && <span className="text-xs text-muted">Yükleniyor...</span>}
      </div>
      <p className="text-xs text-muted">
        Bu bir vergi tavsiyesi değildir — Türkiye&apos;de menkul kıymet vergilendirmesi ürün türüne, elde tutma süresine ve
        mevzuata göre değişir. Aşağıdaki rakamlar sadece kendi işlem geçmişinizden türetilen SATIŞ bazlı gerçekleşen kâr/zarar
        özeti; kesin hesap için mali müşavirinize danışın.
      </p>

      {!loading && yearly.length === 0 && <p className="text-xs text-muted">Henüz satış işlemi yok.</p>}
      {yearly.length > 0 && (
        <div className="flex flex-col gap-1.5 font-mono text-sm tabular-nums">
          {yearly.map((y) => (
            <div key={y.year} className="flex items-center justify-between rounded-lg border-2 border-muted/20 px-3 py-2">
              <span className="text-foreground">{y.year}</span>
              <span className={y.realizedPnL >= 0 ? "text-positive" : "text-negative"}>
                {y.realizedPnL >= 0 ? "▲" : "▼"} {y.realizedPnL.toFixed(2)} ₺
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={transactions.length === 0}
        onClick={() => downloadCsv(toCsv(transactions), `portfoy-islemleri-${new Date().toISOString().slice(0, 10)}.csv`)}
        className="btn h-10 self-start rounded-lg border-2 border-muted/30 px-4 text-sm font-medium text-foreground hover:border-accent/40 disabled:pointer-events-none disabled:opacity-50"
      >
        Tüm İşlemleri CSV Olarak İndir
      </button>
    </div>
  );
}
