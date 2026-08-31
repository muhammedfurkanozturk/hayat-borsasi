import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { suggestPackingList, type WardrobeItemSummary } from "@/lib/ai/travel-packing";
import { fetchForecastRange, geocodeCity } from "@/lib/weather/open-meteo";
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
    startDate?: string;
    endDate?: string;
  };

  const wardrobeItems = Array.isArray(body.wardrobeItems) ? body.wardrobeItems : [];
  const city = body.city?.trim();
  const startDate = body.startDate;
  const endDate = body.endDate;

  if (wardrobeItems.length === 0) {
    return NextResponse.json({ error: "Gardırobunda hiç parça yok." }, { status: 400 });
  }
  if (!city || !startDate || !endDate) {
    return NextResponse.json({ error: "Şehir ve tarih aralığı gerekli." }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

  let tempMinC: number | null = null;
  let tempMaxC: number | null = null;
  let rainy = false;
  let forecastAvailable = false;

  try {
    const geocoded = await geocodeCity(city);
    if (geocoded) {
      const forecast = await fetchForecastRange(geocoded.lat, geocoded.lon, startDate, endDate);
      if (forecast && forecast.length > 0) {
        tempMinC = Math.min(...forecast.map((d) => d.tempMinC));
        tempMaxC = Math.max(...forecast.map((d) => d.tempMaxC));
        rainy = forecast.some((d) => d.precipProbability >= 40);
        forecastAvailable = true;
      }
    }
  } catch (err) {
    console.error("Seyahat hava durumu alınamadı:", err);
  }

  try {
    const result = await suggestPackingList({ wardrobeItems, city, days, tempMinC, tempMaxC, rainy });
    return NextResponse.json({ ...result, tempMinC, tempMaxC, rainy, forecastAvailable, days });
  } catch (error) {
    console.error("Seyahat paketleme hatası:", error);
    let message = error instanceof Error ? error.message : "Paketleme listesi alınamadı.";
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) message = "Kullanım limitine ulaşıldı, biraz sonra tekrar dene.";
      else if (error.status === 529) message = "Claude şu anda aşırı yoğun, birkaç dakika sonra tekrar dene.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
