import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { suggestOutfit, type WardrobeItemSummary } from "@/lib/ai/style-advice";
import { fetchCurrentWeather, geocodeCity } from "@/lib/weather/open-meteo";
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

  const body = (await request.json()) as {
    wardrobeItems?: WardrobeItemSummary[];
    city?: string;
    occasion?: string;
    skinTone?: string | null;
    bodyType?: string | null;
  };

  const wardrobeItems = Array.isArray(body.wardrobeItems) ? body.wardrobeItems : [];
  if (wardrobeItems.length === 0) {
    return NextResponse.json({ error: "Gardırobunda hiç parça yok." }, { status: 400 });
  }

  let weather: { tempC: number; label: string } | null = null;
  if (body.city?.trim()) {
    try {
      const city = await geocodeCity(body.city.trim());
      if (city) {
        const current = await fetchCurrentWeather(city.lat, city.lon);
        weather = { tempC: current.tempC, label: current.weatherLabel };
      }
    } catch (err) {
      // Hava durumu opsiyonel bir girdi — alınamazsa AI Stilist mevsim
      // etiketlerine göre genel bir öneri yapmaya devam ediyor.
      console.error("Hava durumu alınamadı:", err);
    }
  }

  try {
    const result = await suggestOutfit({
      wardrobeItems,
      weather,
      occasion: body.occasion,
      skinTone: body.skinTone,
      bodyType: body.bodyType,
    });
    return NextResponse.json({ ...result, weather });
  } catch (error) {
    console.error("AI Stilist hatası:", error);
    let message = error instanceof Error ? error.message : "Kombin önerisi alınamadı.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
