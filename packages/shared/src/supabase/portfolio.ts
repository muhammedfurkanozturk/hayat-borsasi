import type { SupabaseClient } from "@supabase/supabase-js";

export type PortfolioAssetType = "stock" | "gold" | "silver";
export type PortfolioTransactionType = "buy" | "sell";

export interface DbPortfolioTransaction {
  id: string;
  symbol: string;
  asset_type: PortfolioAssetType;
  transaction_type: PortfolioTransactionType;
  quantity: number;
  price_per_unit: number;
  transaction_date: string;
  created_at: string;
}

export async function fetchPortfolioTransactions(
  supabase: SupabaseClient,
  categoryId: string
): Promise<DbPortfolioTransaction[]> {
  const { data, error } = await supabase
    .from("portfolio_transactions")
    .select("id, symbol, asset_type, transaction_type, quantity, price_per_unit, transaction_date, created_at")
    .eq("category_id", categoryId)
    .order("transaction_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPortfolioTransaction(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  input: {
    symbol: string;
    assetType: PortfolioAssetType;
    transactionType: PortfolioTransactionType;
    quantity: number;
    pricePerUnit: number;
    transactionDate: string;
  }
): Promise<DbPortfolioTransaction> {
  const { data, error } = await supabase
    .from("portfolio_transactions")
    .insert({
      user_id: userId,
      category_id: categoryId,
      symbol: input.symbol.toUpperCase(),
      asset_type: input.assetType,
      transaction_type: input.transactionType,
      quantity: input.quantity,
      price_per_unit: input.pricePerUnit,
      transaction_date: input.transactionDate,
    })
    .select("id, symbol, asset_type, transaction_type, quantity, price_per_unit, transaction_date, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePortfolioTransaction(supabase: SupabaseClient, transactionId: string) {
  const { error } = await supabase.from("portfolio_transactions").delete().eq("id", transactionId);
  if (error) throw error;
}

// transaction_date + created_at'a göre kronolojik (en eskiden en yeniye)
// sıralar — calculatePositions/calculateRealizedPnL'in ortalama maliyeti
// doğru hesaplayabilmesi için şart (bir satış, kendinden SONRAKİ bir alışı
// değil, SADECE o ana kadarki alışları görmeli). Çağıranın (fetch'in)
// hangi sırada döndürdüğüne bağımlı kalmamak için burada garanti ediliyor.
function sortChronological(transactions: DbPortfolioTransaction[]): DbPortfolioTransaction[] {
  return [...transactions].sort((a, b) => {
    const dateCompare = a.transaction_date.localeCompare(b.transaction_date);
    if (dateCompare !== 0) return dateCompare;
    return a.created_at.localeCompare(b.created_at);
  });
}

export interface PortfolioPosition {
  symbol: string;
  assetType: PortfolioAssetType;
  quantity: number;
  averageCost: number;
  totalCost: number;
}

// Canlı fiyat entegrasyonu ayrı (/api/stock-quote) — bu fonksiyon sadece
// maliyet bazlı pozisyon özetini (lot + ortalama maliyet) çıkarır.
export function calculatePositions(transactions: DbPortfolioTransaction[]): PortfolioPosition[] {
  const bySymbol = new Map<string, { assetType: PortfolioAssetType; quantity: number; costBasis: number }>();

  for (const tx of sortChronological(transactions)) {
    const entry = bySymbol.get(tx.symbol) ?? { assetType: tx.asset_type, quantity: 0, costBasis: 0 };
    if (tx.transaction_type === "buy") {
      entry.quantity += tx.quantity;
      entry.costBasis += tx.quantity * tx.price_per_unit;
    } else {
      // Satışta ortalama maliyet oranında maliyet tabanından düş.
      const avgCost = entry.quantity > 0 ? entry.costBasis / entry.quantity : 0;
      entry.quantity -= tx.quantity;
      entry.costBasis -= tx.quantity * avgCost;
    }
    bySymbol.set(tx.symbol, entry);
  }

  return Array.from(bySymbol.entries())
    .filter(([, v]) => v.quantity > 0.000001)
    .map(([symbol, v]) => ({
      symbol,
      assetType: v.assetType,
      quantity: v.quantity,
      averageCost: v.costBasis / v.quantity,
      totalCost: v.costBasis,
    }));
}

// Sharesight'taki (piyasa araştırması) "gerçekleşmiş kâr/zarar" fikri —
// sadece SATILMIŞ lotların (satış fiyatı − o anki ortalama maliyet) farkı,
// hâlâ elde tutulan pozisyonların anlık kâr/zararını içermez (o ayrı,
// canlı fiyata bağlı bir hesap). Yeni bir sütun/tablo gerekmiyor, aynı
// portfolio_transactions'tan türetiliyor.
export function calculateRealizedPnL(transactions: DbPortfolioTransaction[]): number {
  const bySymbol = new Map<string, { quantity: number; costBasis: number }>();
  let totalRealized = 0;

  for (const tx of sortChronological(transactions)) {
    const entry = bySymbol.get(tx.symbol) ?? { quantity: 0, costBasis: 0 };
    if (tx.transaction_type === "buy") {
      entry.quantity += tx.quantity;
      entry.costBasis += tx.quantity * tx.price_per_unit;
    } else {
      const avgCost = entry.quantity > 0 ? entry.costBasis / entry.quantity : 0;
      totalRealized += (tx.price_per_unit - avgCost) * tx.quantity;
      entry.quantity -= tx.quantity;
      entry.costBasis -= tx.quantity * avgCost;
    }
    bySymbol.set(tx.symbol, entry);
  }

  return totalRealized;
}

// Simply Wall St'teki (piyasa araştırması) "gerçek getiri" (IRR) fikri —
// basit "kâr%" hesabı (bkz. PortfolioPanel.tsx'teki summary.profitPct) PARA
// GİRİŞ ZAMANLARINI görmezden geliyor (bugün yatırılan 1000₺ ile 2 yıl önce
// yatırılan 1000₺ aynı ağırlıkta sayılıyor) — XIRR bunu düzeltir, her nakit
// akışını GERÇEK tarihiyle iskonto eder. Standart Newton-Raphson + ıraksarsa
// bisection'a düşen klasik XIRR implementasyonu, harici kütüphane gerekmiyor.
interface CashFlow {
  date: Date;
  amount: number; // alış = negatif, satış/güncel değer = pozitif
}

function xnpv(rate: number, flows: CashFlow[], t0: Date): number {
  const msPerYear = 365 * 24 * 60 * 60 * 1000;
  return flows.reduce((sum, f) => {
    const years = (f.date.getTime() - t0.getTime()) / msPerYear;
    return sum + f.amount / Math.pow(1 + rate, years);
  }, 0);
}

function solveXirr(flows: CashFlow[]): number | null {
  if (flows.length < 2) return null;
  const hasPositive = flows.some((f) => f.amount > 0);
  const hasNegative = flows.some((f) => f.amount < 0);
  if (!hasPositive || !hasNegative) return null; // en az bir giriş + bir çıkış olmalı

  const t0 = flows[0].date;
  // Newton-Raphson, %-99'dan +%1000'e sınırlı, ıraksarsa null döner
  // (bisection'a geçmeye değecek kadar kritik bir özellik değil — başarısız
  // olursa arayüz sessizce IRR satırını göstermez).
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const f = xnpv(rate, flows, t0);
    const epsilon = 1e-6;
    const fPrime = (xnpv(rate + epsilon, flows, t0) - f) / epsilon;
    if (Math.abs(fPrime) < 1e-10) break;
    const nextRate = rate - f / fPrime;
    if (!Number.isFinite(nextRate)) break;
    if (Math.abs(nextRate - rate) < 1e-7) {
      rate = nextRate;
      break;
    }
    rate = Math.max(-0.99, Math.min(10, nextRate));
  }
  if (!Number.isFinite(rate) || Math.abs(xnpv(rate, flows, t0)) > Math.abs(flows.reduce((s, f) => s + Math.abs(f.amount), 0)) * 0.01) {
    return null;
  }
  return rate;
}

// currentValue = pozisyonların BUGÜNKÜ toplam piyasa değeri (canlı fiyatla,
// çağıran taraf hesaplayıp veriyor — bu fonksiyon fiyat çekmiyor). Hâlâ elde
// tutulan pozisyonlar için bugün tarihli sanal bir "satış" nakit akışı gibi
// davranılır (standart XIRR yaklaşımı). Yüzde olarak döner (örn. 0.184 = %18.4).
export function calculatePortfolioXIRR(transactions: DbPortfolioTransaction[], currentValue: number): number | null {
  if (transactions.length === 0) return null;
  const flows: CashFlow[] = sortChronological(transactions).map((tx) => ({
    date: new Date(tx.transaction_date),
    amount: tx.transaction_type === "buy" ? -(tx.quantity * tx.price_per_unit) : tx.quantity * tx.price_per_unit,
  }));
  if (currentValue > 0.01) {
    flows.push({ date: new Date(), amount: currentValue });
  }
  return solveXirr(flows);
}

export interface YearlyRealizedPnL {
  year: string;
  realizedPnL: number;
}

// Sharesight'taki (piyasa araştırması) "vergi/muhasebe raporu" fikri —
// calculateRealizedPnL'in AYNI mantığı, sadece SATIŞ tarihinin yılına göre
// gruplanmış hâli. Bu bir vergi/muhasebe TAVSİYESİ değil, sadece kullanıcının
// kendi işlem geçmişinden türetilen bir özet (bkz. TaxReportPanel.tsx'teki
// açık uyarı metni) — hangi yılın vergi beyanına hangi rakamın gireceğine
// dair bir yorum yapmıyor.
export function calculateRealizedPnLByYear(transactions: DbPortfolioTransaction[]): YearlyRealizedPnL[] {
  const bySymbol = new Map<string, { quantity: number; costBasis: number }>();
  const byYear = new Map<string, number>();

  for (const tx of sortChronological(transactions)) {
    const entry = bySymbol.get(tx.symbol) ?? { quantity: 0, costBasis: 0 };
    if (tx.transaction_type === "buy") {
      entry.quantity += tx.quantity;
      entry.costBasis += tx.quantity * tx.price_per_unit;
    } else {
      const avgCost = entry.quantity > 0 ? entry.costBasis / entry.quantity : 0;
      const realized = (tx.price_per_unit - avgCost) * tx.quantity;
      const year = tx.transaction_date.slice(0, 4);
      byYear.set(year, (byYear.get(year) ?? 0) + realized);
      entry.quantity -= tx.quantity;
      entry.costBasis -= tx.quantity * avgCost;
    }
    bySymbol.set(tx.symbol, entry);
  }

  return Array.from(byYear.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, realizedPnL]) => ({ year, realizedPnL }));
}

export interface DbPriceAlert {
  id: string;
  symbol: string;
  target_price: number;
  direction: "above" | "below";
  triggered_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

// Delta'daki (piyasa araştırması) fiyat alarmı fikri — ÖNEMLİ: Vercel
// Hobby planında cron günde 1 kez çalışabildiği için bu "anlık" değil,
// günlük bir kontrol (bkz. src/lib/finance/price-alerts.ts).
export async function fetchPriceAlerts(supabase: SupabaseClient, categoryId: string): Promise<DbPriceAlert[]> {
  const { data, error } = await supabase
    .from("price_alerts")
    .select("id, symbol, target_price, direction, triggered_at, dismissed_at, created_at")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPriceAlert(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  input: { symbol: string; targetPrice: number; direction: "above" | "below" }
): Promise<DbPriceAlert> {
  const { data, error } = await supabase
    .from("price_alerts")
    .insert({
      user_id: userId,
      category_id: categoryId,
      symbol: input.symbol.toUpperCase(),
      target_price: input.targetPrice,
      direction: input.direction,
    })
    .select("id, symbol, target_price, direction, triggered_at, dismissed_at, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function dismissPriceAlert(supabase: SupabaseClient, alertId: string): Promise<void> {
  const { error } = await supabase.from("price_alerts").update({ dismissed_at: new Date().toISOString() }).eq("id", alertId);
  if (error) throw error;
}

export async function deletePriceAlert(supabase: SupabaseClient, alertId: string): Promise<void> {
  const { error } = await supabase.from("price_alerts").delete().eq("id", alertId);
  if (error) throw error;
}
