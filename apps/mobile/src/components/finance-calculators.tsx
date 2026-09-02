import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ROBINHOOD } from "@/components/portfolio-panel";

function num(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmt(value: number, digits = 2) {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function CalculatorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { borderColor: ROBINHOOD.border }]}>
      <ThemedText style={[styles.cardTitle, { color: ROBINHOOD.muted }]}>{title}</ThemedText>
      {children}
    </View>
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
    <View style={styles.field}>
      <ThemedText style={[styles.fieldLabel, { color: ROBINHOOD.muted }]}>{label}</ThemedText>
      <View style={styles.fieldInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          style={[styles.input, { borderColor: ROBINHOOD.border, color: ROBINHOOD.text, backgroundColor: ROBINHOOD.elevated }]}
        />
        {suffix && <ThemedText style={[styles.fieldSuffix, { color: ROBINHOOD.muted }]}>{suffix}</ThemedText>}
      </View>
    </View>
  );
}

// Web'in src/components/kategori/finance/FinanceCalculators.tsx'inin RN
// portu — Sharesight'taki (piyasa araştırması) "4 hesaplayıcı" fikri, hepsi
// kullanıcının kendi varsayımsal rakamlarıyla çalışan "ne olurdu" araçları,
// gerçek vergi oranı/mevzuat gibi kişiselleştirilmiş finansal tavsiye
// İÇERMİYOR. Tamamen istemci-taraflı, Supabase'e hiç dokunmuyor — Spor &
// Vücut'un CalcTab'ıyla (1RM hesaplayıcı) AYNI mimari desen.
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
    <CalculatorCard title="ORTALAMA MALİYET HESAPLAYICI">
      <View style={styles.fieldGrid}>
        <NumberField label="Mevcut lot" value={curLot} onChange={setCurLot} />
        <NumberField label="Mevcut ort. maliyet" value={curCost} onChange={setCurCost} suffix="₺" />
        <NumberField label="Yeni alım lot" value={newLot} onChange={setNewLot} />
        <NumberField label="Yeni alım fiyatı" value={newPrice} onChange={setNewPrice} suffix="₺" />
      </View>
      <ThemedText style={[styles.resultText, { color: ROBINHOOD.text }]}>
        Yeni ortalama maliyet:{" "}
        <ThemedText style={{ color: ROBINHOOD.accent, fontWeight: "700" }}>{fmt(newAvg)} ₺</ThemedText> (
        {fmt(totalLot, 0)} lot toplam)
      </ThemedText>
    </CalculatorCard>
  );
}

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
    <CalculatorCard title="KÂR/ZARAR HESAPLAYICI">
      <View style={styles.fieldGrid}>
        <NumberField label="Alış fiyatı" value={buyPrice} onChange={setBuyPrice} suffix="₺" />
        <NumberField label="Satış fiyatı" value={sellPrice} onChange={setSellPrice} suffix="₺" />
        <NumberField label="Lot" value={lot} onChange={setLot} />
        <NumberField label="Komisyon (alış+satış)" value={commissionPct} onChange={setCommissionPct} suffix="%" />
      </View>
      <ThemedText style={[styles.resultText, { color: ROBINHOOD.text }]}>
        Net {net >= 0 ? "kâr" : "zarar"}:{" "}
        <ThemedText style={{ color: net >= 0 ? ROBINHOOD.accent : ROBINHOOD.negative, fontWeight: "700" }}>
          {fmt(net)} ₺ ({fmt(netPct)}%)
        </ThemedText>
      </ThemedText>
    </CalculatorCard>
  );
}

function TargetPriceCalculator() {
  const [costPrice, setCostPrice] = useState("50");
  const [targetProfitPct, setTargetProfitPct] = useState("20");
  const [commissionPct, setCommissionPct] = useState("0.15");

  const costN = num(costPrice);
  const targetN = num(targetProfitPct) / 100;
  const commissionN = num(commissionPct) / 100;
  const buyTotal = costN * (1 + commissionN);
  const targetSell = commissionN < 1 ? (buyTotal * (1 + targetN)) / (1 - commissionN) : 0;

  return (
    <CalculatorCard title="HEDEF SATIŞ FİYATI HESAPLAYICI">
      <View style={styles.fieldGrid}>
        <NumberField label="Maliyet fiyatı" value={costPrice} onChange={setCostPrice} suffix="₺" />
        <NumberField label="İstenen net kâr" value={targetProfitPct} onChange={setTargetProfitPct} suffix="%" />
        <NumberField label="Komisyon (alış+satış)" value={commissionPct} onChange={setCommissionPct} suffix="%" />
      </View>
      <ThemedText style={[styles.resultText, { color: ROBINHOOD.text }]}>
        Hedef satış fiyatı: <ThemedText style={{ color: ROBINHOOD.accent, fontWeight: "700" }}>{fmt(targetSell)} ₺</ThemedText>
      </ThemedText>
    </CalculatorCard>
  );
}

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
    <CalculatorCard title="TEMETTÜ BİLEŞİK GETİRİ HESAPLAYICI">
      <View style={styles.fieldGrid}>
        <NumberField label="Başlangıç yatırım" value={initial} onChange={setInitial} suffix="₺" />
        <NumberField label="Yıllık temettü verimi" value={dividendYield} onChange={setDividendYield} suffix="%" />
        <NumberField label="Yıllık fiyat büyümesi" value={priceGrowth} onChange={setPriceGrowth} suffix="%" />
        <NumberField label="Yıl sayısı" value={years} onChange={setYears} />
      </View>
      <ThemedText style={[styles.resultText, { color: ROBINHOOD.text }]}>
        {yearsN} yıl sonra (temettüler yeniden yatırılırsa):{" "}
        <ThemedText style={{ color: ROBINHOOD.accent, fontWeight: "700" }}>{fmt(futureValue)} ₺</ThemedText>
      </ThemedText>
      <ThemedText style={[styles.disclaimer, { color: ROBINHOOD.muted }]}>
        Sabit varsayılan oranlarla basit bileşik büyüme — gerçek piyasa getirisi dalgalanır, bu bir tahmin/senaryo
        aracıdır, gelecekteki performansın garantisi değildir.
      </ThemedText>
    </CalculatorCard>
  );
}

export function FinanceCalculators() {
  return (
    <View style={{ gap: 12 }}>
      <AverageCostCalculator />
      <ProfitLossCalculator />
      <TargetPriceCalculator />
      <DividendCompoundCalculator />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: 12, padding: 14, gap: 10 },
  cardTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  field: { width: "47%", gap: 4 },
  fieldLabel: { fontSize: 11 },
  fieldInputWrap: { position: "relative", justifyContent: "center" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingRight: 30, height: 38, fontSize: 13 },
  fieldSuffix: { position: "absolute", right: 10, fontSize: 11 },
  resultText: { fontSize: 13, fontFamily: "monospace" },
  disclaimer: { fontSize: 10, lineHeight: 14 },
});
