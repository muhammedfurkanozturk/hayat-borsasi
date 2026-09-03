import type { SupabaseClient } from "@supabase/supabase-js";

// Faz 2 (Ödeme/iyzico) iskeleti (2026-09-03, kullanıcı onaylı — bkz.
// CLAUDE.md "eksikler" envanteri madde 1). Bu dosya SADECE `payment_orders`
// tablosuna client-taraflı erişim veriyor (kendi siparişini görme +
// "pending" bir sipariş oluşturma) — durumu 'success' yapan gerçek mantık
// server-side'da (src/lib/payments/iyzico.ts + /api/payments/* route'ları,
// admin/service_role client'la) yaşıyor, bu dosyada YOK.
export type PaymentPlan = "monthly" | "yearly";
export type PaymentOrderStatus = "pending" | "success" | "failed" | "cancelled";

export interface DbPaymentOrder {
  id: string;
  user_id: string;
  plan: PaymentPlan;
  amount: number;
  currency: string;
  status: PaymentOrderStatus;
  provider: string;
  provider_conversation_id: string | null;
  provider_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPaymentOrders(supabase: SupabaseClient, userId: string): Promise<DbPaymentOrder[]> {
  const { data, error } = await supabase
    .from("payment_orders")
    .select("id, user_id, plan, amount, currency, status, provider, provider_conversation_id, provider_payment_id, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
