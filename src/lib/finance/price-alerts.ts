import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchLivePrices } from "@/lib/finance/stock-data";

export interface AlertCheckResult {
  checked: number;
  triggered: number;
  errors: string[];
}

// Delta'daki (piyasa araştırması) fiyat alarmı fikri — gece cron job'ı
// (daily-report ile aynı desen) tüm kullanıcıların tetiklenmemiş
// alarmlarını service_role ile tek seferde kontrol eder. ÖNEMLİ: Vercel
// Hobby planında cron günde 1 kez çalışabildiği için bu "anlık" değil,
// günde bir kez (BIST kapanışına yakın) yapılan bir kontrol — bkz.
// vercel.json'daki zamanlama ve CLAUDE.md'deki not.
export async function checkPriceAlerts(admin: SupabaseClient): Promise<AlertCheckResult> {
  const result: AlertCheckResult = { checked: 0, triggered: 0, errors: [] };

  const { data: alerts, error } = await admin
    .from("price_alerts")
    .select("id, symbol, target_price, direction")
    .is("triggered_at", null);
  if (error) throw error;

  const rows = alerts ?? [];
  result.checked = rows.length;
  if (rows.length === 0) return result;

  const symbols = Array.from(new Set(rows.map((r) => r.symbol as string)));
  const quotes = await fetchLivePrices(symbols);

  for (const alert of rows) {
    const price = quotes[alert.symbol as string]?.price;
    if (price == null) continue;

    const targetPrice = alert.target_price as number;
    const crossed = alert.direction === "above" ? price >= targetPrice : price <= targetPrice;
    if (!crossed) continue;

    try {
      const { error: updateError } = await admin
        .from("price_alerts")
        .update({ triggered_at: new Date().toISOString() })
        .eq("id", alert.id);
      if (updateError) throw updateError;
      result.triggered++;
    } catch (err) {
      result.errors.push(`${alert.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}
