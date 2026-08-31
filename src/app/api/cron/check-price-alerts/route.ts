import { NextResponse } from "next/server";
import { checkPriceAlerts } from "@/lib/finance/price-alerts";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Cron BIST kapanışına yakın (UTC 15:00 = TR 18:00, bkz. vercel.json)
// bu endpoint'i çağırır. CRON_SECRET korumalı — daily-report ile aynı desen.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const result = await checkPriceAlerts(admin);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Fiyat alarmı kontrolü hatası:", error);
    return NextResponse.json({ error: "Kontrol başarısız." }, { status: 500 });
  }
}
