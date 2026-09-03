import { NextResponse } from "next/server";
import { archiveDailyReportsFor } from "@/lib/ai/daily-archive";
import { archiveWeeklyAndMonthlyIfPeriodEnded } from "@/lib/ai/period-archive";
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
  // bir saat dilimi dönüşümüne gerek yok. `?date=YYYY-MM-DD` isteğe bağlı
  // override — cron kaçırılmış bir günü elle yeniden işlemek veya (bu
  // turda yapıldığı gibi) haftalık/aylık arşivleme mantığını gerçek geçmiş
  // veriyle test etmek için, CRON_SECRET zaten koruduğu için ekstra risk
  // taşımıyor.
  const dateOverride = new URL(request.url).searchParams.get("date");
  const date = dateOverride ?? new Date().toISOString().slice(0, 10);

  try {
    const admin = createAdminClient();
    const result = await archiveDailyReportsFor(admin, date);

    // "eksikler" envanteri madde 7 — ayrı bir cron slotu açmadan (Vercel
    // Hobby plan kısıtı, bkz. period-archive.ts'in başındaki not), aynı
    // gece tetiklemesinin içinde haftanın/ayın son günüyse haftalık/aylık
    // arşivleme de yapılıyor — çoğu gece no-op.
    let weekly = null;
    let monthly = null;
    try {
      const periodResult = await archiveWeeklyAndMonthlyIfPeriodEnded(admin, date);
      weekly = periodResult.weekly;
      monthly = periodResult.monthly;
    } catch (periodError) {
      // Haftalık/aylık arşivleme başarısız olsa bile günlük arşivleme
      // sonucu (yukarıda zaten tamamlandı) kaybolmasın.
      console.error("Haftalık/aylık rapor arşivleme hatası:", periodError);
    }

    return NextResponse.json({ date, ...result, weekly, monthly });
  } catch (error) {
    console.error("Gece raporu arşivleme hatası:", error);
    return NextResponse.json({ error: "Arşivleme başarısız." }, { status: 500 });
  }
}
