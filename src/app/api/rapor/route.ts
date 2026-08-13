import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generateAiReport, type ReportInput } from "@/lib/ai/claude";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
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
