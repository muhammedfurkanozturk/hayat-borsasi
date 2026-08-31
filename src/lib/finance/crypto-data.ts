import "server-only";

// Bölüm 6 (2026-08-25) — Bitcoin takip kartı için CoinGecko'nun ücretsiz,
// anahtar gerektirmeyen "simple/price" endpoint'i. Bu SADECE takip amaçlı
// (CLAUDE.md'deki mevcut Portföy'den ayrı, kripto portföyde hiç yok) —
// gerçek emir verilmiyor, yahoo-finance2 için zaten var olan "kişisel/
// eğitim amaçlı kullanım" sınırlaması notuna benzer şekilde, CoinGecko'nun
// ücretsiz katmanı da ticari/yüksek hacimli kullanım için tasarlanmadı.
export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  priceTry: number | null;
  changePercent24h: number | null;
  volumeTry24h: number | null;
}

const COINGECKO_ASSETS: { id: string; symbol: string; name: string }[] = [{ id: "bitcoin", symbol: "BTC", name: "Bitcoin" }];

export async function fetchCryptoQuotes(): Promise<CryptoQuote[]> {
  const ids = COINGECKO_ASSETS.map((a) => a.id).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=try&include_24hr_change=true&include_24hr_vol=true`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`CoinGecko isteği başarısız: ${res.status}`);
  const data = (await res.json()) as Record<string, { try?: number; try_24h_change?: number; try_24h_vol?: number }>;

  return COINGECKO_ASSETS.map((asset) => {
    const entry = data[asset.id];
    return {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      priceTry: entry?.try ?? null,
      changePercent24h: entry?.try_24h_change ?? null,
      volumeTry24h: entry?.try_24h_vol ?? null,
    };
  });
}
