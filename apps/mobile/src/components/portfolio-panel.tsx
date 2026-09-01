import { useEffect, useState } from "react";
import {
  calculatePositions,
  calculateRealizedPnL,
  deletePortfolioTransaction,
  fetchPortfolioTransactions,
  insertPortfolioTransaction,
  todayIso,
  type DbPortfolioTransaction,
  type PortfolioAssetType,
  type PortfolioTransactionType,
} from "@hayat-borsasi/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { supabase } from "@/lib/supabase/client";

// Kategori Bazlı Tasarım Farklılaştırma (bkz. CLAUDE.md bölüm 9) — Finans &
// Portföy'ün mobil karşılığı, Bölüm 1: SADECE Portföy (işlem girişi +
// maliyet-bazlı pozisyonlar). Robinhood'un saf siyah + neon yeşil kimliği
// (sabit renkler). **Bilinçli kapsam sınırlaması:** "Piyasalar" (canlı
// BTC/BIST fiyatları), "Tarama" (hisse tarama) ve "Araçlar" (vergi raporu
// + hesaplayıcılar) bu turda taşınmadı — hepsi `/api/market-watch`,
// `/api/stock-search`, `/api/stock-quote`, `/api/stock-fundamentals`
// route'larına bağımlı ve bu route'ların HİÇBİRİ deploy edilmiş Vercel'de
// yok (bkz. CLAUDE.md'deki "mobil AI özellikleri" deploy notu — aynı sorun
// bu route'lar için de geçerli, gerçek `curl` ile 404 doğrulandı). Portföy
// sekmesi ise canlı fiyata hiç ihtiyaç duymuyor (`calculatePositions`
// tamamen maliyet-bazlı, saf istemci-taraflı hesap) — bu yüzden şimdiden
// tam işlevsel ve test edilebilir. Canlı fiyat/K-Z gösterimi, o route'lar
// deploy edildikten sonra ayrı bir turda eklenebilir.
const ROBINHOOD = {
  bg: "#000000",
  surface: "#0a0a0a",
  elevated: "#141414",
  border: "rgba(255,255,255,0.12)",
  text: "#ffffff",
  muted: "#8e8e93",
  accent: "#00e676",
  negative: "#ff3b30",
};

const ASSET_TYPES: { value: PortfolioAssetType; label: string }[] = [
  { value: "stock", label: "Hisse" },
  { value: "gold", label: "Altın" },
  { value: "silver", label: "Gümüş" },
];

export function PortfolioPanel({ categoryId }: { categoryId: string }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<DbPortfolioTransaction[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState<PortfolioAssetType>("stock");
  const [txType, setTxType] = useState<PortfolioTransactionType>("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const rows = await fetchPortfolioTransactions(supabase, categoryId);
      setTransactions(rows);
    } catch (err) {
      console.error("Portföy verisi yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  async function handleAddTransaction() {
    const quantityNum = Number(quantity);
    const priceNum = Number(price);
    if (!symbol.trim() || !(quantityNum > 0) || !(priceNum > 0)) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const created = await insertPortfolioTransaction(supabase, user.id, categoryId, {
        symbol: symbol.trim(),
        assetType,
        transactionType: txType,
        quantity: quantityNum,
        pricePerUnit: priceNum,
        transactionDate: todayIso(),
      });
      setTransactions((prev) => [created, ...prev]);
      setSymbol("");
      setQuantity("");
      setPrice("");
      setFormOpen(false);
    }
    setSaving(false);
  }

  function confirmDelete(tx: DbPortfolioTransaction) {
    Alert.alert("İşlemi sil", `${tx.symbol} — ${tx.quantity} adet silinsin mi?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
          await deletePortfolioTransaction(supabase, tx.id);
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: ROBINHOOD.bg }]}>
        <ActivityIndicator color={ROBINHOOD.accent} />
      </View>
    );
  }

  const positions = calculatePositions(transactions);
  const realizedPnL = calculateRealizedPnL(transactions);
  const totalInvested = positions.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <View style={[styles.container, { backgroundColor: ROBINHOOD.bg }]}>
      <ThemedText style={{ color: ROBINHOOD.text, fontSize: 15, fontWeight: "800" }}>Portföy</ThemedText>

      <View style={[styles.summaryCard, { borderColor: ROBINHOOD.border }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <ThemedText style={{ color: ROBINHOOD.muted, fontSize: 10, textTransform: "uppercase" }}>Yatırılan</ThemedText>
            <ThemedText style={{ color: ROBINHOOD.text, fontSize: 18, fontWeight: "800", fontFamily: "monospace" }}>
              {totalInvested.toFixed(0)} ₺
            </ThemedText>
          </View>
          <View>
            <ThemedText style={{ color: ROBINHOOD.muted, fontSize: 10, textTransform: "uppercase" }}>Gerçekleşen K/Z</ThemedText>
            <ThemedText
              style={{
                color: realizedPnL >= 0 ? ROBINHOOD.accent : ROBINHOOD.negative,
                fontSize: 18,
                fontWeight: "800",
                fontFamily: "monospace",
              }}
            >
              {realizedPnL >= 0 ? "▲" : "▼"} {Math.abs(realizedPnL).toFixed(0)} ₺
            </ThemedText>
          </View>
        </View>
      </View>

      {positions.length === 0 ? (
        <ThemedText style={{ color: ROBINHOOD.muted, fontSize: 12 }}>Henüz pozisyon yok.</ThemedText>
      ) : (
        <View style={{ gap: 8 }}>
          {positions.map((p) => (
            <View key={p.symbol} style={[styles.positionRow, { borderColor: ROBINHOOD.border }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: ROBINHOOD.text, fontWeight: "800", fontSize: 13 }}>{p.symbol}</ThemedText>
                <ThemedText style={{ color: ROBINHOOD.muted, fontSize: 10 }}>{ASSET_TYPES.find((a) => a.value === p.assetType)?.label}</ThemedText>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText style={{ color: ROBINHOOD.text, fontSize: 12, fontFamily: "monospace" }}>{p.quantity} adet</ThemedText>
                <ThemedText style={{ color: ROBINHOOD.muted, fontSize: 10, fontFamily: "monospace" }}>Ort: {p.averageCost.toFixed(2)} ₺</ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}

      {formOpen ? (
        <View style={[styles.form, { borderColor: ROBINHOOD.accent + "4d", backgroundColor: ROBINHOOD.accent + "1a" }]}>
          <TextInput
            value={symbol}
            onChangeText={(t) => setSymbol(t.toUpperCase())}
            placeholder="Sembol (örn. THYAO)"
            placeholderTextColor={ROBINHOOD.muted}
            autoCapitalize="characters"
            style={[styles.input, { borderColor: ROBINHOOD.border, color: ROBINHOOD.text, backgroundColor: ROBINHOOD.elevated }]}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {ASSET_TYPES.map((a) => (
              <Pressable
                key={a.value}
                onPress={() => setAssetType(a.value)}
                style={[styles.chip, { borderColor: assetType === a.value ? ROBINHOOD.accent : ROBINHOOD.border }]}
              >
                <ThemedText style={{ color: assetType === a.value ? ROBINHOOD.accent : ROBINHOOD.muted, fontSize: 11 }}>{a.label}</ThemedText>
              </Pressable>
            ))}
            <Pressable onPress={() => setTxType("buy")} style={[styles.chip, { borderColor: txType === "buy" ? ROBINHOOD.accent : ROBINHOOD.border }]}>
              <ThemedText style={{ color: txType === "buy" ? ROBINHOOD.accent : ROBINHOOD.muted, fontSize: 11 }}>Alış</ThemedText>
            </Pressable>
            <Pressable onPress={() => setTxType("sell")} style={[styles.chip, { borderColor: txType === "sell" ? ROBINHOOD.negative : ROBINHOOD.border }]}>
              <ThemedText style={{ color: txType === "sell" ? ROBINHOOD.negative : ROBINHOOD.muted, fontSize: 11 }}>Satış</ThemedText>
            </Pressable>
          </ScrollView>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput value={quantity} onChangeText={setQuantity} placeholder="Lot/Adet" keyboardType="decimal-pad" placeholderTextColor={ROBINHOOD.muted} style={[styles.input, { flex: 1, borderColor: ROBINHOOD.border, color: ROBINHOOD.text, backgroundColor: ROBINHOOD.elevated }]} />
            <TextInput value={price} onChangeText={setPrice} placeholder="Birim Fiyat (₺)" keyboardType="decimal-pad" placeholderTextColor={ROBINHOOD.muted} style={[styles.input, { flex: 1, borderColor: ROBINHOOD.border, color: ROBINHOOD.text, backgroundColor: ROBINHOOD.elevated }]} />
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={handleAddTransaction} disabled={saving} style={[styles.primaryButton, { backgroundColor: ROBINHOOD.accent, flex: 1 }]}>
              {saving ? <ActivityIndicator color="#000" size="small" /> : <ThemedText style={{ color: "#000", fontWeight: "800" }}>İşlemi Ekle</ThemedText>}
            </Pressable>
            <Pressable onPress={() => setFormOpen(false)} style={[styles.secondaryButton, { borderColor: ROBINHOOD.border }]}>
              <ThemedText style={{ color: ROBINHOOD.muted }}>Vazgeç</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setFormOpen(true)} style={[styles.primaryButton, { backgroundColor: ROBINHOOD.accent }]}>
          <MaterialCommunityIcons name="plus" size={16} color="#000" />
          <ThemedText style={{ color: "#000", fontWeight: "800" }}>İşlem Ekle</ThemedText>
        </Pressable>
      )}

      {transactions.length > 0 && (
        <View style={{ gap: 6 }}>
          <ThemedText style={{ color: ROBINHOOD.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>İşlem Geçmişi</ThemedText>
          {transactions.slice(0, 10).map((tx) => (
            <Pressable key={tx.id} onLongPress={() => confirmDelete(tx)} style={[styles.txRow, { borderColor: ROBINHOOD.border }]}>
              <ThemedText style={{ color: tx.transaction_type === "buy" ? ROBINHOOD.accent : ROBINHOOD.negative, fontSize: 11, fontWeight: "700" }}>
                {tx.transaction_type === "buy" ? "ALIŞ" : "SATIŞ"}
              </ThemedText>
              <ThemedText style={{ color: ROBINHOOD.text, fontSize: 12, flex: 1 }}>{tx.symbol}</ThemedText>
              <ThemedText style={{ color: ROBINHOOD.muted, fontSize: 11, fontFamily: "monospace" }}>
                {tx.quantity} × {tx.price_per_unit} ₺
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14, borderRadius: 12, padding: 14 },
  summaryCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  positionRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 12 },
  form: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 10 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, height: 40, fontSize: 13 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: 10 },
  secondaryButton: { height: 44, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 8, padding: 10 },
});
