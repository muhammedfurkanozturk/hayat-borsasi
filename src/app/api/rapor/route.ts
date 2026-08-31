import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateAiReport, type ReportInput } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";
import { parseStructuredReport } from "@hayat-borsasi/shared";

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

// Claude API çağrısı Vercel'in varsayılan fonksiyon süresinden (genelde 10sn)
// uzun sürebiliyor — bu olmadan yavaş bir yanıt 503/504 ile kesiliyordu.
export const maxDuration = 60;

// Mobil uygulama farklı bir origin'den (Expo dev server / native runtime)
// istek attığı için CORS header'ları gerekiyor — web'in kendi origin'inden
// yaptığı (çerezli) isteği etkilemez, tarayıcı zaten same-origin isteklerde
// CORS header'ı aramaz. `*` güvenli: bu endpoint çereze değil Bearer token'a
// güveniyor, tarayıcılar credentials:'include' isteklerde `*`'ı reddeder.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;

  const supabase = bearerToken ? createBearerClient(bearerToken) : await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(bearerToken ?? undefined);

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401, headers: CORS_HEADERS });
  }

  // AI Rapor bir Pro özelliği — istemci tarafındaki kilit sadece görsel,
  // asıl erişim kontrolü burada. Bypass edilmesin diye profildeki is_pro
  // burada da ayrıca kontrol ediliyor.
  const { data: profile } = await supabase.from("profiles").select("is_pro").eq("id", user.id).maybeSingle();
  if (!profile?.is_pro) {
    return NextResponse.json({ error: "Bu özellik Pro üyelere özel." }, { status: 403, headers: CORS_HEADERS });
  }

  const body = (await request.json()) as ReportInput;

  try {
    const content = await generateAiReport(body);
    // Claude'un yapılandırılmış JSON kuralına uymadığı (nadir) durumlarda
    // burada sadece logluyoruz — cevap yine de döndürülür, gösterim
    // tarafındaki parseStructuredReport zaten düz metne fallback yapıyor.
    if (!parseStructuredReport(content)) {
      console.warn("AI Rapor beklenen JSON şemasına uymuyor, düz metin olarak gösterilecek.");
    }
    return NextResponse.json({ content }, { headers: CORS_HEADERS });
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

    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
