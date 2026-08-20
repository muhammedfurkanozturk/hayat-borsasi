import type { SupabaseClient } from "@supabase/supabase-js";

export type PortfolioAssetType = "stock" | "gold";
export type PortfolioTransactionType = "buy" | "sell";

export interface DbPortfolioTransaction {
  id: string;
  symbol: string;
  asset_type: PortfolioAssetType;
  transaction_type: PortfolioTransactionType;
  quantity: number;
  price_per_unit: number;
  transaction_date: string;
}

export async function fetchPortfolioTransactions(
  supabase: SupabaseClient,
  categoryId: string
): Promise<DbPortfolioTransaction[]> {
  const { data, error } = await supabase
    .from("portfolio_transactions")
    .select("id, symbol, asset_type, transaction_type, quantity, price_per_unit, transaction_date")
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
    .select("id, symbol, asset_type, transaction_type, quantity, price_per_unit, transaction_date")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePortfolioTransaction(supabase: SupabaseClient, transactionId: string) {
  const { error } = await supabase.from("portfolio_transactions").delete().eq("id", transactionId);
  if (error) throw error;
}

export interface PortfolioPosition {
  symbol: string;
  assetType: PortfolioAssetType;
  quantity: number;
  averageCost: number;
  totalCost: number;
}

// Canlı fiyat entegrasyonu henüz yok (NosyAPI bekliyor, bkz. CLAUDE.md
// bölüm 9) — bu yüzden şimdilik sadece maliyet bazlı pozisyon özeti
// çıkarıyoruz (anlık kâr/zarar değil).
export function calculatePositions(transactions: DbPortfolioTransaction[]): PortfolioPosition[] {
  const bySymbol = new Map<string, { assetType: PortfolioAssetType; quantity: number; costBasis: number }>();

  for (const tx of transactions) {
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
