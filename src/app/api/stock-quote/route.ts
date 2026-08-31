import { NextResponse } from "next/server";
import { fetchLivePrices } from "@/lib/finance/stock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const symbolsParam = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (symbols.length === 0) {
    return NextResponse.json({ prices: {} });
  }

  try {
    const prices = await fetchLivePrices(symbols);
    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Fiyat çekme hatası:", error);
    return NextResponse.json({ error: "Fiyatlar alınamadı." }, { status: 500 });
  }
}
