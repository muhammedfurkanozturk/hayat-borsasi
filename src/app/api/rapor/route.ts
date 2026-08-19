import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateAiReport, type ReportInput } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";

// Web istekleri tarayıcı çerezleriyle (createClient/server.ts) doğrulanır.
// Mobil uygulamanın çerezi yok — bunun yerine Supabase oturum access
// token'ını `Authorization: Bearer <token>` header'ında gönderir. Bu client,
// o token'ı taşıyarak RLS sorgularının (profiles tablosu) doğru kullanıcı
// olarak çalışmasını sağlar.
function createBearerClient(token: string) {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;

  const supabase = bearerToken ? createBearerClient(bearerToken) : await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(bearerToken ?? undefined);

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  // AI Rapor bir Pro özelliği — istemci tarafındaki kilit sadece görsel,
  // asıl erişim kontrolü burada. Bypass edilmesin diye profildeki is_pro
  // burada da ayrıca kontrol ediliyor.
  const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", user.id).maybeSingle();
  if (!profile?.is_pro) {
    return NextResponse.json({ error: "Bu özellik Pro üyelere özel." }, { status: 403 });
  }

  const body = (await request.json()) as ReportInput;

  try {
    const content = await generateAiReport(body);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Rapor oluşturma hatası:", error);

    let message = "Rapor oluşturulamadı. Bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        message = "Rapor oluşturulamadı. ANTHROPIC_API_KEY .env.local dosyasında tanımlı ve geçerli mi kontrol et.";
      } else if (error.status === 429) {
        message = "Rapor oluşturulamadı. Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      } else if (error.status === 529) {
        message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
