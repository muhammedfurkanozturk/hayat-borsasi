"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { PortfolioPosition } from "@hayat-borsasi/shared";

interface HistoricalClose {
  date: string;
  close: number;
}

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div className="rounded-lg border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {Number(payload[0].value).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
      </div>
    </div>
  );
}

// 21st.dev'in ProgressMetricCard'ından ilham (Bölüm 6, 2026-08-25) — zinc
// paleti/rounded-3xl/bg-primary gibi shadcn token'ları yerine bizim
// --surface/--border/--accent sistemimize çevrildi, kendi SVG grafik
// motoru yerine projede zaten kurulu Recharts kullanıldı (ScoreChart.tsx
// ile aynı desen). ÖNEMLİ SADELEŞTİRME: her günün gerçek o günkü lot
// sayısını değil, MEVCUT lot sayısını geriye doğru uyguluyor (tam işlem
// bazlı geriye dönük yeniden inşa, ayrı ve çok daha pahalı bir iş) — bu
// kullanıcıya da kartın altında açıkça not olarak gösteriliyor. Altın
// pozisyonları hariç (Portföy'de zaten sadece maliyet bazlı, canlı fiyatı
// yok) — sabit maliyetiyle toplama ekleniyor.
export function PortfolioTrendCard({ positions }: { positions: PortfolioPosition[] }) {
  const [closesBySymbol, setClosesBySymbol] = useState<Record<string, HistoricalClose[]>>({});
  const [loading, setLoading] = useState(true);

  const stockPositions = useMemo(() => positions.filter((p) => p.assetType === "stock"), [positions]);
  const goldCostBasis = useMemo(
    () => positions.filter((p) => p.assetType === "gold").reduce((sum, p) => sum + p.totalCost, 0),
    [positions]
  );
  const stockSymbols = useMemo(() => stockPositions.map((p) => p.symbol), [stockPositions]);

  useEffect(() => {
    if (stockSymbols.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setClosesBySymbol({});
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/portfolio-trend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbols: stockSymbols }),
        });
        if (!res.ok) throw new Error("İstek başarısız.");
        const json = await res.json();
        if (!cancelled) setClosesBySymbol(json.closes ?? {});
      } catch (err) {
        console.error("Portföy trendi alınamadı:", err);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockSymbols.join(",")]);

  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    for (const closes of Object.values(closesBySymbol)) {
      for (const c of closes) allDates.add(c.date);
    }
    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((date) => {
      let total = goldCostBasis;
      for (const position of stockPositions) {
        const closes = closesBySymbol[position.symbol] ?? [];
        // O tarihe kadarki en son bilinen kapanışı kullan (hafta sonu/tatil
        // günlerinde veri olmayabilir).
        const upToDate = closes.filter((c) => c.date <= date);
        const latestClose = upToDate[upToDate.length - 1]?.close;
        if (latestClose != null) total += latestClose * position.quantity;
      }
      return { date: date.slice(5), value: total };
    });
  }, [closesBySymbol, stockPositions, goldCostBasis]);

  if (stockPositions.length === 0) return null;
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-border bg-background-elevated text-sm text-muted">
        Trend hesaplanıyor...
      </div>
    );
  }
  if (chartData.length < 2) return null;

  const latest = chartData[chartData.length - 1].value;
  const first = chartData[0].value;
  const change = latest - first;
  const changePct = first !== 0 ? (change / first) * 100 : 0;
  const values = chartData.map((d) => d.value);
  const peak = Math.max(...values);
  const low = Math.min(...values);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background-elevated p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Portföy Değeri (Hisse, 30 gün)</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {latest.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺
            </span>
            <span className={`font-mono text-xs font-medium ${change >= 0 ? "text-positive" : "text-negative"}`}>
              {change >= 0 ? "▲" : "▼"} {Math.abs(changePct).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs text-muted">
          <span>Tepe: {peak.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺</span>
          <span>Dip: {low.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺</span>
        </div>
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
            <Tooltip content={ChartTooltip} cursor={{ stroke: "var(--border)" }} />
            <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#portfolioTrendFill)" />
            {/* Robinhood'un sparkline uç-nokta parıltısı — CSS
                drop-shadow'lu bir nokta, sadece son değerin üstünde. */}
            <ReferenceDot
              x={chartData[chartData.length - 1].date}
              y={chartData[chartData.length - 1].value}
              r={4}
              fill={change >= 0 ? "var(--positive)" : "var(--negative)"}
              stroke="none"
              isFront
              style={{ filter: `drop-shadow(0 0 4px ${change >= 0 ? "var(--positive)" : "var(--negative)"})` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-soft">
        Not: Geçmiş günler mevcut lot sayısı varsayılarak hesaplanıyor (o günkü gerçek lot sayısı değil) — yön/trend takibi
        için yaklaşık bir gösterge.
      </p>
    </div>
  );
}
