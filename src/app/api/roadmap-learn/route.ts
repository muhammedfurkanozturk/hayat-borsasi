import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { explainRoadmapTopic } from "@/lib/ai/roadmap-learn";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const body = (await request.json()) as { topicTitle?: unknown; roadmapName?: unknown; parentTitle?: unknown };
  const topicTitle = typeof body.topicTitle === "string" ? body.topicTitle.trim() : "";
  const roadmapName = typeof body.roadmapName === "string" ? body.roadmapName.trim() : "";
  const parentTitle = typeof body.parentTitle === "string" ? body.parentTitle.trim() : null;

  if (!topicTitle || !roadmapName) {
    return NextResponse.json({ error: "Konu başlığı eksik." }, { status: 400 });
  }

  try {
    const explanation = await explainRoadmapTopic(topicTitle, roadmapName, parentTitle);
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Yol haritası AI açıklaması hatası:", error);

    let message = "Açıklama alınamadı, bir süre sonra tekrar dene.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
