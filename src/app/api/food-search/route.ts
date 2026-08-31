import { NextResponse } from "next/server";
import { searchFoodByBarcode, searchFoodsByName } from "@/lib/nutrition/food-search";
import { createClient } from "@/lib/supabase/server";

// Elle Ekle arama kutusu — yazılan metin sadece rakamlardan oluşuyorsa
// (kullanıcı barkod numarasını yazmışsa) Open Food Facts'e, aksi halde
// isimle USDA FoodData Central'a sorguluyor. Server-side (API key client'ta
// açığa çıkmıyor, bkz. CLAUDE.md güvenlik prensibi).
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const isBarcode = /^\d{6,}$/.test(query);
    const results = isBarcode ? await searchFoodByBarcode(query) : await searchFoodsByName(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Yemek arama hatası:", error);
    return NextResponse.json({ error: "Yemek veritabanı aranamadı." }, { status: 500 });
  }
}
