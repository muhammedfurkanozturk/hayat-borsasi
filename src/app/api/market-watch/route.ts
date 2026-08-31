import { NextResponse } from "next/server";
import { fetchCryptoQuotes } from "@/lib/finance/crypto-data";
import { fetchMarketWatchStocks, fetchMetalQuotes } from "@/lib/finance/stock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const [crypto, stocks, metals] = await Promise.all([
    fetchCryptoQuotes().catch((err) => {
      console.error("Kripto verisi alınamadı:", err);
      return [];
    }),
    fetchMarketWatchStocks().catch((err) => {
      console.error("Hisse takip verisi alınamadı:", err);
      return [];
    }),
    fetchMetalQuotes().catch((err) => {
      console.error("Metal verisi alınamadı:", err);
      return [];
    }),
  ]);

  return NextResponse.json({ crypto, stocks, metals });
}
