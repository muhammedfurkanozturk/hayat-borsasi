import { NextResponse } from "next/server";
import { fetchStockFundamentals } from "@/lib/finance/stock-fundamentals";
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
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (symbols.length === 0) {
    return NextResponse.json({ fundamentals: {} });
  }

  try {
    const fundamentals = await fetchStockFundamentals(symbols);
    return NextResponse.json({ fundamentals });
  } catch (error) {
    console.error("Temel veri çekme hatası:", error);
    return NextResponse.json({ error: "Veriler alınamadı." }, { status: 500 });
  }
}
