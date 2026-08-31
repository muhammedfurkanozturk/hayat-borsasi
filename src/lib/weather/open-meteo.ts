import "server-only";

// Acloset'ten (piyasa araştırması) ilham alınan hava durumu tabanlı kombin
// önerisi (AI Stilist) + seyahat paketleme özellikleri için — kullanıcıya
// soruldu, Open-Meteo seçildi: tamamen ücretsiz, API anahtarı gerekmiyor,
// ticari kullanım dahil sınırsız (bkz. CLAUDE.md).

export interface GeocodedCity {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export async function geocodeCity(query: string): Promise<GeocodedCity | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=tr&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Şehir arama servisi yanıt vermedi.");
  const json = await res.json();
  const first = json.results?.[0];
  if (!first) return null;
  return { name: first.name, country: first.country ?? "", lat: first.latitude, lon: first.longitude };
}

// WMO hava durumu kodları (Open-Meteo'nun kullandığı standart) — en yaygın
// olanlar için kısa Türkçe açıklama, tam liste değil ama pratikte yeterli.
const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Açık",
  1: "Az bulutlu",
  2: "Parçalı bulutlu",
  3: "Kapalı",
  45: "Sisli",
  48: "Kırağı sisi",
  51: "Hafif çisenti",
  53: "Çisenti",
  55: "Yoğun çisenti",
  61: "Hafif yağmurlu",
  63: "Yağmurlu",
  65: "Şiddetli yağmurlu",
  71: "Hafif kar yağışlı",
  73: "Kar yağışlı",
  75: "Yoğun kar yağışlı",
  80: "Sağanak yağışlı",
  81: "Kuvvetli sağanak",
  82: "Şiddetli sağanak",
  95: "Gök gürültülü fırtına",
  96: "Dolulu fırtına",
  99: "Şiddetli dolulu fırtına",
};

export function weatherCodeLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "Bilinmeyen";
}

export interface CurrentWeather {
  tempC: number;
  weatherCode: number;
  weatherLabel: string;
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Hava durumu servisi yanıt vermedi.");
  const json = await res.json();
  const tempC = json.current?.temperature_2m;
  const weatherCode = json.current?.weather_code;
  if (typeof tempC !== "number" || typeof weatherCode !== "number") {
    throw new Error("Hava durumu verisi eksik geldi.");
  }
  return { tempC, weatherCode, weatherLabel: weatherCodeLabel(weatherCode) };
}

export interface DailyForecast {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipProbability: number;
  weatherCode: number;
  weatherLabel: string;
}

// Open-Meteo'nun ücretsiz tahmin API'si en fazla ~16 gün ileriye gidiyor —
// bir seyahat bu pencerenin dışındaysa null döner, çağıran taraf (bkz.
// travel-packing route) bunu "henüz tahmin yok" olarak ele alıyor, tahmin
// UYDURMUYORUZ.
export async function fetchForecastRange(lat: number, lon: number, startDate: string, endDate: string): Promise<DailyForecast[] | null> {
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 16);
  const maxDateIso = maxDate.toISOString().slice(0, 10);
  if (startDate > maxDateIso) return null;

  const clampedEnd = endDate > maxDateIso ? maxDateIso : endDate;
  const clampedStart = startDate < today ? today : startDate;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
    `&timezone=auto&start_date=${clampedStart}&end_date=${clampedEnd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Hava durumu tahmini alınamadı.");
  const json = await res.json();
  const daily = json.daily;
  if (!daily?.time) return null;

  const days: DailyForecast[] = daily.time.map((date: string, i: number) => ({
    date,
    tempMaxC: daily.temperature_2m_max[i],
    tempMinC: daily.temperature_2m_min[i],
    precipProbability: daily.precipitation_probability_max[i] ?? 0,
    weatherCode: daily.weather_code[i],
    weatherLabel: weatherCodeLabel(daily.weather_code[i]),
  }));
  return days;
}
