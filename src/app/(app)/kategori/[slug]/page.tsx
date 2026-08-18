import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import KategoriClient from "./KategoriClient";

// Sekme başlığı için hafif, ayrı bir sunucu tarafı sorgu — asıl sayfa
// içeriği hâlâ istemci tarafında useAppData() ile çekiliyor (bkz.
// CLAUDE.md'deki ertelenmiş "client-side veri çekme" notu), ama başlık
// Next.js'in kendi metadata sistemine bağlı olmadan doğru gösterilebilsin
// diye sadece kategori adını burada, RLS korumalı olarak çekiyoruz.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("name").eq("id", slug).maybeSingle();
  return { title: data ? `Hayat Borsası | ${data.name}` : "Hayat Borsası | Kategori" };
}

export default function KategoriPage() {
  return <KategoriClient />;
}
