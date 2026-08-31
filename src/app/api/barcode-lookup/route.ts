import { NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/nutrition/barcode";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const code = new URL(request.url).searchParams.get("code")?.trim();
  if (!code) {
    return NextResponse.json({ error: "Barkod numarası gerekli." }, { status: 400 });
  }

  try {
    const product = await lookupBarcode(code);
    if (!product) {
      return NextResponse.json({ error: "Bu barkoda ait ürün bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("Barkod arama hatası:", error);
    return NextResponse.json({ error: "Ürün aranamadı." }, { status: 500 });
  }
}
