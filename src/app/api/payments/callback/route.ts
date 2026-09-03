import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveCheckoutForm } from "@/lib/payments/iyzico";

// iyzico, kullanıcı kendi barındırılan ödeme sayfasında işlemi
// bitirince bu URL'e (checkout init'te verdiğimiz `callbackUrl`)
// application/x-www-form-urlencoded bir POST atıyor — gövdede SADECE
// bir `token` var, ödeme SONUCU değil (o token'la bilinçli olarak
// AYRICA `retrieveCheckoutForm` çağrılıp iyzico'dan doğrulanıyor —
// tarayıcıdan/callback gövdesinden gelen hiçbir veriye güvenilmiyor,
// tek doğruluk kaynağı iyzico'nun retrieve cevabı).
//
// Bu route oturumsuz çağrılıyor (iyzico'nun sunucusu çağırıyor, kullanıcı
// çerezi yok) — admin/service_role client kullanılıyor (getOrCreateEntryForDate
// deseniyle AYNI gerekçeyle, bkz. CLAUDE.md bölüm 7.1), RLS'i bypass edip
// payment_orders.status ve profiles.is_pro'yu güncelliyor. Bu, `is_pro`'yu
// 'success' durumuna taşıyan TEK yol — payment_orders'ın RLS insert policy'si
// client'ın status='pending' dışında bir şey yazmasını zaten engelliyor
// (bkz. migration).
export async function POST(request: Request) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const formData = await request.formData().catch(() => null);
  const token = formData?.get("token")?.toString();

  if (!token) {
    return NextResponse.redirect(`${origin}/pro?odeme=hata`);
  }

  const admin = createAdminClient();

  // conversationId'yi (bizim payment_orders.id'miz) iyzico bize geri
  // vermiyor — retrieve çağrısı conversationId olmadan da token'a göre
  // sonucu döndürüyor, dönen basketId (checkout init'te order.id olarak
  // verilmişti) üzerinden hangi siparişe ait olduğunu buluyoruz.
  try {
    const result = await retrieveCheckoutForm(token, "");
    const orderId = result.basketId;

    const { data: order } = await admin
      .from("payment_orders")
      .select("id, user_id, plan")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) {
      console.error("iyzico callback: bilinmeyen sipariş", orderId);
      return NextResponse.redirect(`${origin}/pro?odeme=hata`);
    }

    const success = result.status === "success" && result.paymentStatus === "SUCCESS";

    await admin
      .from("payment_orders")
      .update({
        status: success ? "success" : "failed",
        provider_payment_id: result.paymentId ?? null,
        provider_conversation_id: token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (success) {
      await admin.from("profiles").update({ is_pro: true }).eq("id", order.user_id);
    }

    return NextResponse.redirect(`${origin}/pro?odeme=${success ? "basarili" : "basarisiz"}`);
  } catch (error) {
    console.error("iyzico callback hatası:", error);
    return NextResponse.redirect(`${origin}/pro?odeme=hata`);
  }
}
