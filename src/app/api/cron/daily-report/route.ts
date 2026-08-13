import { NextResponse } from "next/server";
import { archiveDailyReportsFor } from "@/lib/ai/daily-archive";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Cron her gece Türkiye saatiyle 00:00'da (UTC 21:00, bkz. vercel.json)
// bu endpoint'i çağırır ve az önce biten günün gerçek verilerinden tüm
// kullanıcılar için AI raporu üretip ai_reports'a arşivler. CRON_SECRET ile
// korunur — Vercel, proje ayarlarındaki CRON_SECRET'i otomatik olarak
// Authorization header'ına ekler, bu yüzden burada sadece eşleşmeyi kontrol
// etmek yeterli.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  // Cron tam Türkiye gece yarısında (UTC 21:00) tetiklendiği için, o andaki
  // UTC takvim günü Türkiye'de az önce biten günün tarihiyle aynıdır — ayrı
  // bir saat dilimi dönüşümüne gerek yok.
  const date = new Date().toISOString().slice(0, 10);

  try {
    const admin = createAdminClient();
    const result = await archiveDailyReportsFor(admin, date);
    return NextResponse.json({ date, ...result });
  } catch (error) {
    console.error("Gece raporu arşivleme hatası:", error);
    return NextResponse.json({ error: "Arşivleme başarısız." }, { status: 500 });
  }
}
