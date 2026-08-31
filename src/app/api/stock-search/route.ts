import { NextResponse } from "next/server";
import { searchBistStocks } from "@/lib/finance/stock-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchBistStocks(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Hisse arama hatası:", error);
    return NextResponse.json({ error: "Arama başarısız oldu." }, { status: 500 });
  }
}
