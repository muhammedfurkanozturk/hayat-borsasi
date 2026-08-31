import "server-only";
import YahooFinanceCtor from "yahoo-finance2";

const yahooFinance = new YahooFinanceCtor({ suppressNotices: ["yahooSurvey"] });

// Simply Wall St'in "Kar Tanesi" (Snowflake) fikrinden ilham — ama SWS'in
// gerçek metodolojisi analist DCF adil değer tahminlerine dayanıyor, bu
// kullanıcının kendi isteğiyle KAPSAM DIŞI bırakıldı. Burada sadece Yahoo
// Finance'in ücretsiz quoteSummary uç noktasının GERÇEKTEN döndürdüğü ham
// finansal verileri topluyoruz — hiçbir alan uydurulmuyor, eksikse null
// kalıyor ve arayüz tarafı bunu "veri yok" olarak gösteriyor.
export interface StockFundamentals {
  symbol: string;
  trailingPE: number | null;
  priceToBook: number | null;
  dividendYield: number | null; // 0-1 arası oran (örn. 0.045 = %4.5)
  returnOnEquity: number | null; // 0-1 arası oran
  revenueGrowth: number | null; // 0-1 arası oran (analist konsensüsü, Yahoo'nun kendi verisi)
  currentRatio: number | null;
  debtToEquity: number | null; // Yahoo bunu yüzde olarak döndürüyor (örn. 45.2 = %45.2 değil, 45.2x değil — ham değer aynen gösteriliyor)
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  price: number | null;
  name: string | null;
}

export async function fetchStockFundamentals(symbols: string[]): Promise<Record<string, StockFundamentals | null>> {
  const result: Record<string, StockFundamentals | null> = {};
  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const summary = await yahooFinance.quoteSummary(`${symbol}.IS`, {
          modules: ["summaryDetail", "financialData", "defaultKeyStatistics", "price"],
        });
        result[symbol] = {
          symbol,
          trailingPE: summary.summaryDetail?.trailingPE ?? null,
          priceToBook: summary.defaultKeyStatistics?.priceToBook ?? null,
          dividendYield: summary.summaryDetail?.dividendYield ?? null,
          returnOnEquity: summary.financialData?.returnOnEquity ?? null,
          revenueGrowth: summary.financialData?.revenueGrowth ?? null,
          currentRatio: summary.financialData?.currentRatio ?? null,
          debtToEquity: summary.financialData?.debtToEquity ?? null,
          fiftyTwoWeekLow: summary.summaryDetail?.fiftyTwoWeekLow ?? null,
          fiftyTwoWeekHigh: summary.summaryDetail?.fiftyTwoWeekHigh ?? null,
          price: summary.price?.regularMarketPrice ?? null,
          name: summary.price?.shortName ?? summary.price?.longName ?? null,
        };
      } catch {
        result[symbol] = null;
      }
    })
  );
  return result;
}
