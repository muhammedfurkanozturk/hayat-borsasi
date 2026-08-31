"use client";

import { useState } from "react";

function num(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmt(value: number, digits = 2) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function CalculatorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border-2 border-muted/20 p-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          className="h-9 w-full rounded-lg border-2 border-muted/30 bg-surface px-3 text-sm text-foreground outline-none focus:border-accent/50"
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

// Ortalama Maliyet Hesaplayıcı — mevcut pozisyona ek alım yapınca yeni
// ortalama maliyet ne olur.
function AverageCostCalculator() {
  const [curLot, setCurLot] = useState("100");
  const [curCost, setCurCost] = useState("50");
  const [newLot, setNewLot] = useState("50");
  const [newPrice, setNewPrice] = useState("40");

  const curLotN = num(curLot);
  const curCostN = num(curCost);
  const newLotN = num(newLot);
  const newPriceN = num(newPrice);
  const totalLot = curLotN + newLotN;
  const newAvg = totalLot > 0 ? (curLotN * curCostN + newLotN * newPriceN) / totalLot : 0;

  return (
    <CalculatorCard title="Ortalama Maliyet Hesaplayıcı">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Mevcut lot" value={curLot} onChange={setCurLot} />
        <NumberField label="Mevcut ort. maliyet" value={curCost} onChange={setCurCost} suffix="₺" />
        <NumberField label="Yeni alım lot" value={newLot} onChange={setNewLot} />
        <NumberField label="Yeni alım fiyatı" value={newPrice} onChange={setNewPrice} suffix="₺" />
      </div>
      <p className="font-mono text-sm tabular-nums text-foreground">
        Yeni ortalama maliyet: <span className="font-semibold text-accent">{fmt(newAvg)} ₺</span> ({fmt(totalLot, 0)} lot toplam)
      </p>
    </CalculatorCard>
  );
}

// Kâr/Zarar Hesaplayıcı — komisyon dahil basit bir alış-satış senaryosu.
function ProfitLossCalculator() {
  const [buyPrice, setBuyPrice] = useState("50");
  const [sellPrice, setSellPrice] = useState("60");
  const [lot, setLot] = useState("100");
  const [commissionPct, setCommissionPct] = useState("0.15");

  const buyN = num(buyPrice);
  const sellN = num(sellPrice);
  const lotN = num(lot);
  const commissionN = num(commissionPct) / 100;

  const grossCost = buyN * lotN;
  const grossProceeds = sellN * lotN;
  const commission = (grossCost + grossProceeds) * commissionN;
  const net = grossProceeds - grossCost - commission;
  const netPct = grossCost > 0 ? (net / grossCost) * 100 : 0;

  return (
    <CalculatorCard title="Kâr/Zarar Hesaplayıcı">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Alış fiyatı" value={buyPrice} onChange={setBuyPrice} suffix="₺" />
        <NumberField label="Satış fiyatı" value={sellPrice} onChange={setSellPrice} suffix="₺" />
        <NumberField label="Lot" value={lot} onChange={setLot} />
        <NumberField label="Komisyon (alış+satış)" value={commissionPct} onChange={setCommissionPct} suffix="%" />
      </div>
      <p className="font-mono text-sm tabular-nums text-foreground">
        Net {net >= 0 ? "kâr" : "zarar"}:{" "}
        <span className={`font-semibold ${net >= 0 ? "text-positive" : "text-negative"}`}>
          {fmt(net)} ₺ ({fmt(netPct)}%)
        </span>
      </p>
    </CalculatorCard>
  );
}

// Hedef Satış Fiyatı Hesaplayıcı — istenen net kâr yüzdesine ulaşmak için
// hangi fiyattan satılmalı (komisyon dahil).
function TargetPriceCalculator() {
  const [costPrice, setCostPrice] = useState("50");
  const [targetProfitPct, setTargetProfitPct] = useState("20");
  const [commissionPct, setCommissionPct] = useState("0.15");

  const costN = num(costPrice);
  const targetN = num(targetProfitPct) / 100;
  const commissionN = num(commissionPct) / 100;
  // (satış*(1-komisyon) - alış*(1+komisyon)) / (alış*(1+komisyon)) = hedef kâr%
  const buyTotal = costN * (1 + commissionN);
  const targetSell = commissionN < 1 ? (buyTotal * (1 + targetN)) / (1 - commissionN) : 0;

  return (
    <CalculatorCard title="Hedef Satış Fiyatı Hesaplayıcı">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Maliyet fiyatı" value={costPrice} onChange={setCostPrice} suffix="₺" />
        <NumberField label="İstenen net kâr" value={targetProfitPct} onChange={setTargetProfitPct} suffix="%" />
        <NumberField label="Komisyon (alış+satış)" value={commissionPct} onChange={setCommissionPct} suffix="%" />
      </div>
      <p className="font-mono text-sm tabular-nums text-foreground">
        Hedef satış fiyatı: <span className="font-semibold text-accent">{fmt(targetSell)} ₺</span>
      </p>
    </CalculatorCard>
  );
}

// Temettü Bileşik Getiri Hesaplayıcı — temettüler yeniden yatırılırsa N yıl
// sonra ulaşılacak yaklaşık değer (sabit varsayılan getiri oranlarıyla,
// gerçek gelecekteki performansın garantisi değil — açıkça belirtiliyor).
function DividendCompoundCalculator() {
  const [initial, setInitial] = useState("10000");
  const [dividendYield, setDividendYield] = useState("4");
  const [priceGrowth, setPriceGrowth] = useState("5");
  const [years, setYears] = useState("10");

  const initialN = num(initial);
  const yieldN = num(dividendYield) / 100;
  const growthN = num(priceGrowth) / 100;
  const yearsN = Math.max(0, Math.round(num(years)));

  const totalRate = 1 + yieldN + growthN;
  const futureValue = initialN * Math.pow(totalRate, yearsN);

  return (
    <CalculatorCard title="Temettü Bileşik Getiri Hesaplayıcı">
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Başlangıç yatırım" value={initial} onChange={setInitial} suffix="₺" />
        <NumberField label="Yıllık temettü verimi" value={dividendYield} onChange={setDividendYield} suffix="%" />
        <NumberField label="Yıllık fiyat büyümesi" value={priceGrowth} onChange={setPriceGrowth} suffix="%" />
        <NumberField label="Yıl sayısı" value={years} onChange={setYears} />
      </div>
      <p className="font-mono text-sm tabular-nums text-foreground">
        {yearsN} yıl sonra (temettüler yeniden yatırılırsa): <span className="font-semibold text-accent">{fmt(futureValue)} ₺</span>
      </p>
      <p className="text-[10px] leading-snug text-muted">
        Sabit varsayılan oranlarla basit bileşik büyüme — gerçek piyasa getirisi dalgalanır, bu bir tahmin/senaryo aracıdır,
        gelecekteki performansın garantisi değildir.
      </p>
    </CalculatorCard>
  );
}

// Sharesight'taki (piyasa araştırması) "4 hesaplayıcı" fikri — hepsi
// kullanıcının kendi varsayımsal rakamlarıyla çalışan "ne olurdu" araçları,
// gerçek vergi oranı/mevzuat gibi kişiselleştirilmiş finansal tavsiye
// İÇERMİYOR (bkz. TaxReportPanel'deki aynı prensip).
export function FinanceCalculators() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface shadow-card p-5">
      <h2 className="text-sm font-medium text-foreground">Hesaplayıcılar</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AverageCostCalculator />
        <ProfitLossCalculator />
        <TargetPriceCalculator />
        <DividendCompoundCalculator />
      </div>
    </div>
  );
}
