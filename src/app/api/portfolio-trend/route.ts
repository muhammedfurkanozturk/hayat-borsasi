import { NextResponse } from "next/server";
import { fetchHistoricalCloses } from "@/lib/finance/stock-data";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const symbols = Array.isArray(body?.symbols) ? body.symbols.filter((s: unknown) => typeof s === "string") : [];
  if (symbols.length === 0) {
    return NextResponse.json({ closes: {} });
  }

  try {
    const closes = await fetchHistoricalCloses(symbols.slice(0, 20));
    return NextResponse.json({ closes });
  } catch (error) {
    console.error("Geçmiş fiyat hatası:", error);
    return NextResponse.json({ error: "Geçmiş fiyatlar alınamadı." }, { status: 500 });
  }
}
