import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializeCheckoutForm, isIyzicoConfigured } from "@/lib/payments/iyzico";

// /api/rapor'daki AYNI Bearer-token + CORS deseni (bkz. o dosyadaki not) —
// mobil Pro ekranı ileride bu route'u çağırabilsin diye, web'in çerez
// tabanlı akışını bozmadan.
function createBearerClient(token: string) {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const PLAN_PRICES_TRY: Record<"monthly" | "yearly", { amount: number; label: string }> = {
  // Not: ProClient.tsx'teki $5/$40 gösterim fiyatları USD — iyzico TRY
  // gerektiriyor, gerçek bir kur/fiyatlandırma kararı henüz verilmedi
  // (bkz. CLAUDE.md, madde 1 notu). Burada geçici, YAKLAŞIK bir TRY
  // karşılığı kullanılıyor — gerçek fiyatlandırma kararı netleşince
  // burası ve ProClient.tsx'teki gösterim TEK bir kaynaktan güncellenmeli.
  monthly: { amount: 199, label: "Hayat Borsası Pro — Aylık" },
  yearly: { amount: 1590, label: "Hayat Borsası Pro — Yıllık" },
};

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;

  const supabase = bearerToken ? createBearerClient(bearerToken) : await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(bearerToken ?? undefined);

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401, headers: CORS_HEADERS });
  }

  if (!isIyzicoConfigured()) {
    return NextResponse.json(
      { error: "not_configured", message: "Ödeme altyapısı henüz aktif değil." },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  const body = (await request.json().catch(() => null)) as { plan?: "monthly" | "yearly" } | null;
  const plan = body?.plan;
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Geçersiz plan." }, { status: 400, headers: CORS_HEADERS });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, is_pro")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_pro) {
    return NextResponse.json({ error: "Zaten Pro üyesin." }, { status: 400, headers: CORS_HEADERS });
  }

  const { amount, label } = PLAN_PRICES_TRY[plan];
  const [name, ...surnameParts] = (profile?.display_name || user.email || "Kullanıcı").trim().split(" ");
  const surname = surnameParts.join(" ") || name;

  // pending sipariş satırı — kullanıcının kendi client'ı (RLS insert
  // policy'si zaten status='pending' zorunlu kılıyor, bkz. migration).
  const { data: order, error: insertError } = await supabase
    .from("payment_orders")
    .insert({ user_id: user.id, plan, amount, currency: "TRY", status: "pending" })
    .select("id")
    .single();
  if (insertError || !order) {
    console.error("Ödeme siparişi oluşturulamadı:", insertError);
    return NextResponse.json({ error: "Sipariş oluşturulamadı." }, { status: 500, headers: CORS_HEADERS });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "85.34.78.112";

  try {
    const result = await initializeCheckoutForm({
      conversationId: order.id,
      price: amount,
      basketId: order.id,
      planLabel: label,
      callbackUrl: `${origin}/api/payments/callback`,
      buyer: {
        id: user.id,
        name: name || "Kullanıcı",
        surname,
        email: user.email || "kullanici@hayatborsasi.app",
        // BİLİNEN İSKELET AÇIĞI: iyzico her alıcı için GERÇEK bir T.C.
        // kimlik numarası bekliyor — profilde bu alan hiç toplanmıyor,
        // sandbox'ın kendi dokümantasyonundaki test değeri kullanılıyor.
        // Gerçek/canlı ödemeye geçmeden ÖNCE profile bir "kimlik no"
        // alanı eklenip checkout öncesi zorunlu kılınmalı — aksi halde
        // TÜM kullanıcılar aynı sahte numarayla işlem yapmış olur.
        identityNumber: "11111111111",
        ip,
      },
    });
    return NextResponse.json(
      { token: result.token, checkoutFormContent: result.checkoutFormContent },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("iyzico checkout init hatası:", error);
    return NextResponse.json({ error: "Ödeme başlatılamadı." }, { status: 500, headers: CORS_HEADERS });
  }
}
