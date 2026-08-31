import "server-only";
import YahooFinanceCtor from "yahoo-finance2";

const yahooFinance = new YahooFinanceCtor({ suppressNotices: ["yahooSurvey"] });

export interface StockSearchResult {
  symbol: string;
  name: string;
}

// Sadece BIST (İstanbul Borsası, Yahoo'da "IST" exchange kodu) sonuçlarını
// döndürür — kullanıcı ".IS" son ekini hiç görmeden sadece "THYAO" gibi
// yazıp arayabiliyor.
export async function searchBistStocks(query: string): Promise<StockSearchResult[]> {
  const result = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 });
  return result.quotes
    .filter((q): q is typeof q & { symbol: string; exchange: string } => "exchange" in q && q.exchange === "IST")
    .map((q) => {
      const name =
        ("shortname" in q && typeof q.shortname === "string" && q.shortname) ||
        ("longname" in q && typeof q.longname === "string" && q.longname) ||
        q.symbol;
      return { symbol: q.symbol.replace(/\.IS$/, ""), name };
    });
}

export interface LiveQuote {
  price: number | null;
  // Snowball Analytics'teki (piyasa araştırması) "beklenen gelecek gelir"
  // fikri için — Yahoo Finance'in aynı quote() çağrısı BIST hisseleri için
  // bunu gerçekten dolduruyor (canlı sorguyla doğrulandı, bkz. CLAUDE.md).
  // Yıllık hisse başı temettü (₺), veri yoksa/temettü ödemiyorsa null.
  dividendRate: number | null;
}

// Verilen sembol listesi (ör. ["THYAO", "GARAN"]) için anlık fiyatı ve
// temettü oranını tek çağrıda çeker — bulunamayan/hata veren semboller için
// null döner, hepsini tek tek birden düşürmez.
export async function fetchLivePrices(symbols: string[]): Promise<Record<string, LiveQuote>> {
  const result: Record<string, LiveQuote> = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await yahooFinance.quote(`${symbol}.IS`);
        result[symbol] = {
          price: quote?.regularMarketPrice ?? null,
          dividendRate: quote?.dividendRate ?? null,
        };
      } catch {
        result[symbol] = { price: null, dividendRate: null };
      }
    })
  );
  return result;
}

// Bölüm 6 (2026-08-25) — Finans kategorisindeki "Piyasalar" (sadece takip,
// Portföy'den ayrı) kartı için sabit bir BIST izleme listesi. Kullanıcının
// kendi seçtiği bir liste değil (henüz) — CoinMarketCap'teki gibi genel bir
// "öne çıkanlar" tablosu, kullanıcı isterse ayrı bir turda özelleştirilebilir.
const MARKET_WATCH_SYMBOLS = ["THYAO", "GARAN", "TUPRS", "ASELS", "BIMAS"];

export interface MarketStockQuote {
  symbol: string;
  name: string | null;
  price: number | null;
  changePercent: number | null;
  volume: number | null;
}

export async function fetchMarketWatchStocks(): Promise<MarketStockQuote[]> {
  return Promise.all(
    MARKET_WATCH_SYMBOLS.map(async (symbol) => {
      try {
        const quote = await yahooFinance.quote(`${symbol}.IS`);
        return {
          symbol,
          name: quote?.shortName ?? quote?.longName ?? null,
          price: quote?.regularMarketPrice ?? null,
          changePercent: quote?.regularMarketChangePercent ?? null,
          volume: quote?.regularMarketVolume ?? null,
        };
      } catch {
        return { symbol, name: null, price: null, changePercent: null, volume: null };
      }
    })
  );
}

export interface MetalQuote {
  symbol: "gold" | "silver";
  name: string;
  priceTryPerGram: number | null;
  changePercent: number | null;
}

const GRAMS_PER_TROY_OUNCE = 31.1034768;

// Yahoo Finance'te ons (troy ounce) başına USD veren vadeli işlem
// sembolleri (GC=F altın, SI=F gümüş) — Türkiye'de gram üzerinden
// düşünüldüğü için USD/TRY kuruyla (TRY=X) çarpılıp grama bölünüyor.
// Gerçek bir "spot altın" fiyatı değil, vadeli işlem fiyatı — küçük bir
// yaklaşıklık, ama yön/trend takibi için yeterli (kişisel takip amaçlı,
// gerçek emir verilmiyor).
export async function fetchMetalQuotes(): Promise<MetalQuote[]> {
  try {
    const [gold, silver, usdTry] = await Promise.all([
      yahooFinance.quote("GC=F"),
      yahooFinance.quote("SI=F"),
      yahooFinance.quote("TRY=X"),
    ]);
    const rate = usdTry?.regularMarketPrice ?? null;
    function toTryPerGram(usdPerOunce: number | null | undefined): number | null {
      if (usdPerOunce == null || rate == null) return null;
      return (usdPerOunce * rate) / GRAMS_PER_TROY_OUNCE;
    }
    return [
      {
        symbol: "gold",
        name: "Altın (gram)",
        priceTryPerGram: toTryPerGram(gold?.regularMarketPrice),
        changePercent: gold?.regularMarketChangePercent ?? null,
      },
      {
        symbol: "silver",
        name: "Gümüş (gram)",
        priceTryPerGram: toTryPerGram(silver?.regularMarketPrice),
        changePercent: silver?.regularMarketChangePercent ?? null,
      },
    ];
  } catch {
    return [
      { symbol: "gold", name: "Altın (gram)", priceTryPerGram: null, changePercent: null },
      { symbol: "silver", name: "Gümüş (gram)", priceTryPerGram: null, changePercent: null },
    ];
  }
}

export interface HistoricalClose {
  date: string;
  close: number;
}

// PortfolioTrendCard.tsx için — son N günün günlük kapanışları. Portföy
// değeri trendi, HER günün gerçek o günkü lot sayısıyla değil (bu, işlem
// bazlı geriye dönük yeniden inşa gerektirir) MEVCUT lot sayısıyla
// hesaplanıyor — bilinçli bir sadeleştirme, PortfolioTrendCard.tsx'te
// kullanıcıya da not olarak gösteriliyor.
export async function fetchHistoricalCloses(symbols: string[], days = 30): Promise<Record<string, HistoricalClose[]>> {
  const period1 = new Date();
  period1.setDate(period1.getDate() - days);

  const result: Record<string, HistoricalClose[]> = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const chart = await yahooFinance.chart(`${symbol}.IS`, { period1, interval: "1d" });
        result[symbol] = (chart.quotes ?? [])
          .filter((q) => q.close != null)
          .map((q) => ({ date: new Date(q.date).toISOString().slice(0, 10), close: q.close as number }));
      } catch {
        result[symbol] = [];
      }
    })
  );
  return result;
}
