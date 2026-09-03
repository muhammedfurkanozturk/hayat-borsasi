import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import KategoriClient from "./KategoriClient";

// UUID formatını kaba bir regex'le tanıyoruz — "eksikler" envanteri madde
// 9'dan önce tüm linkler id (UUID) taşıyordu, geçiş döneminde (veya
// migration henüz uygulanmadıysa) eski linkler hâlâ çalışsın diye.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const column = UUID_RE.test(slug) ? "id" : "slug";
  const { data } = await supabase.from("categories").select("name").eq(column, slug).maybeSingle();
  return { title: data ? `Hayat Borsası | ${data.name}` : "Hayat Borsası | Kategori" };
}

export default function KategoriPage() {
  return <KategoriClient />;
}
