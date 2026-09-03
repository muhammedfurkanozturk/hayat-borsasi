import "server-only";

// Spor & Vücut kategorisinin Freeletics kimliğine ("koyu/gritty sokak
// antrenmanı" hissi) gerçek stok fotoğraf ekliyor (2026-09-03, kullanıcı
// onaylı — bkz. CLAUDE.md "eksikler" envanteri madde 5). Pexels API
// ücretsiz/anahtar gerektiren ama kredi kartı istemeyen bir kaynak;
// server-only tutulup anahtar client'a asla gönderilmiyor (Claude/Anthropic
// anahtarıyla AYNI kural). Pexels'in lisansı attribution ZORUNLU KILMIYOR
// ("appreciated but not required") ama iyi pratik olarak fotoğrafçı adı +
// Pexels linki UI'da küçük bir kredi olarak gösteriliyor.
const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

// Sabit tek bir arama sorgusu yerine birkaç seçenek — her seferinde
// aynı fotoğrafın gelmemesi, kategori her açıldığında biraz çeşitlilik
// olması için günün tarihine göre deterministik seçiliyor (rastgele değil,
// aynı gün içinde tutarlı kalsın diye).
const QUERIES = ["street workout", "calisthenics training", "boxing gym training", "urban fitness training"];

export interface SportPhoto {
  url: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
  alt: string | null;
}

interface PexelsPhoto {
  src: { large2x: string };
  width: number;
  height: number;
  photographer: string;
  photographer_url: string;
  url: string;
  alt: string | null;
}

interface PexelsSearchResponse {
  photos: PexelsPhoto[];
}

function dailyQuery(): string {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return QUERIES[dayIndex % QUERIES.length];
}

export async function fetchSportHeroPhoto(): Promise<SportPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  const query = dailyQuery();
  const params = new URLSearchParams({ query, per_page: "15", orientation: "landscape", size: "large" });

  try {
    const res = await fetch(`${PEXELS_SEARCH_URL}?${params.toString()}`, {
      headers: { Authorization: apiKey },
      // Günde bir kez yenileniyor — hem Pexels'in ücretsiz kota sınırını
      // (200 istek/saat) korumak hem de aynı gün içinde tutarlı kalması için.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      console.error("Pexels API hatası:", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as PexelsSearchResponse;
    if (data.photos.length === 0) return null;

    // Günün tarihine göre deterministik bir fotoğraf seçiliyor (rastgele
    // değil) — aynı gün içinde sayfa yenilense de aynı fotoğraf kalıyor.
    const dayIndex = Math.floor(Date.now() / 86_400_000);
    const photo = data.photos[dayIndex % data.photos.length];

    return {
      url: photo.src.large2x,
      width: photo.width,
      height: photo.height,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      pexelsUrl: photo.url,
      alt: photo.alt,
    };
  } catch (err) {
    console.error("Pexels fotoğrafı alınamadı:", err);
    return null;
  }
}
