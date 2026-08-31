import "server-only";
import { translateFoodQueryToEnglish } from "@/lib/ai/food-translate";
import { lookupBarcode } from "./barcode";

export interface FoodSearchResult {
  id: string;
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  portion: string | null;
  source: "usda" | "off";
}

interface UsdaFoodNutrient {
  nutrientName?: string;
  unitName?: string;
  value?: number;
}

interface UsdaFood {
  fdcId: number;
  description?: string;
  foodNutrients?: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
}

function findNutrient(nutrients: UsdaFoodNutrient[], name: string): number | null {
  const match = nutrients.find((n) => n.nutrientName === name);
  return typeof match?.value === "number" ? match.value : null;
}

// USDA bazı kayıtlarda "Energy" adında İKİ satır döndürüyor — biri kcal,
// biri kJ birimiyle (gerçek tarayıcı testinde muz için 371 çıktı, bu 89
// kcal'nin kJ karşılığıydı — findNutrient ilk eşleşeni, yani kJ'yi
// alıyordu). unitName === "KCAL" ile doğru olanı seçiyoruz.
function findCalories(nutrients: UsdaFoodNutrient[]): number | null {
  const kcalMatch = nutrients.find((n) => n.nutrientName === "Energy" && n.unitName === "KCAL");
  if (typeof kcalMatch?.value === "number") return kcalMatch.value;
  return findNutrient(nutrients, "Energy");
}

// USDA FoodData Central — temel/işlenmemiş gıdalar için en geniş kapsamlı
// ücretsiz kaynak (muz, yumurta, tavuk göğsü gibi — Open Food Facts
// bunları markalı/paketli ürün olmadıkları için genelde içermiyor).
// Foundation + SR Legacy veri tipleriyle sınırlandırıldı (Branded hariç —
// markalı ürünler zaten Open Food Facts/barkod tarafında karşılanıyor,
// aksi halde aynı ürün için iki kaynaktan çelişkili sonuç çıkabilirdi).
// FDC_API_KEY yoksa (kullanıcı henüz ücretsiz key almadıysa) sessizce boş
// liste döner — Elle Ekle'nin serbest metin girişi yedek olarak çalışmaya
// devam eder.
async function searchUsda(query: string): Promise<FoodSearchResult[]> {
  const apiKey = process.env.FDC_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", "10");
  url.searchParams.set("dataType", "Foundation,SR Legacy");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Yemek veritabanına erişilemedi.");

  const json = (await res.json()) as UsdaSearchResponse;
  const foods = Array.isArray(json.foods) ? json.foods : [];

  return foods.map((f) => {
    const nutrients = Array.isArray(f.foodNutrients) ? f.foodNutrients : [];
    return {
      id: `usda-${f.fdcId}`,
      description: f.description ?? "Bilinmeyen ürün",
      calories: findCalories(nutrients),
      proteinG: findNutrient(nutrients, "Protein"),
      carbsG: findNutrient(nutrients, "Carbohydrate, by difference"),
      fatG: findNutrient(nutrients, "Total lipid (fat)"),
      portion: "100g",
      source: "usda",
    };
  });
}

interface OffSearchProduct {
  code?: string;
  product_name_tr?: string;
  product_name?: string;
  generic_name?: string;
  nutriments?: Record<string, unknown>;
}

interface OffSearchResponse {
  products?: OffSearchProduct[];
}

// Open Food Facts'in metin arama uç noktası — barkodun aksine, Türkçe ürün
// adlarını (kullanıcılar tarafından girilmiş, çok dilli) doğrudan destekliyor
// (canlı test edildi: "ayran" → 526, "muz" → 25 gerçek sonuç). Markalı/
// paketli ürünler için USDA'yı tamamlıyor, anahtar gerektirmiyor.
async function searchOpenFoodFactsByName(query: string): Promise<FoodSearchResult[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "8");

  const res = await fetch(url, {
    headers: { "User-Agent": "HayatBorsasi/1.0 (kisisel kullanim)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Ürün veritabanına erişilemedi.");

  const json = (await res.json()) as OffSearchResponse;
  const products = Array.isArray(json.products) ? json.products : [];

  return products
    .map((p): FoodSearchResult | null => {
      const name = p.product_name_tr || p.product_name || p.generic_name;
      const nutriments = p.nutriments ?? {};
      const calories = nutriments["energy-kcal_100g"];
      if (!name || !p.code) return null;
      return {
        id: `off-${p.code}`,
        description: name,
        calories: typeof calories === "number" ? calories : null,
        proteinG: typeof nutriments.proteins_100g === "number" ? (nutriments.proteins_100g as number) : null,
        carbsG: typeof nutriments.carbohydrates_100g === "number" ? (nutriments.carbohydrates_100g as number) : null,
        fatG: typeof nutriments.fat_100g === "number" ? (nutriments.fat_100g as number) : null,
        portion: "100g",
        source: "off",
      };
    })
    .filter((p): p is FoodSearchResult => p !== null);
}

// 2026-08-28 — kök neden bulundu: USDA İngilizce bir veritabanı, Türkçe
// sorgular ("muz", "tavuk", "mercimek çorbası") canlı testte sessizce 0
// sonuç dönüyordu (entegrasyon bozuk değildi, dil uyuşmuyordu). Önce
// USDA'yı olduğu gibi dener (İngilizce/loanword girişler için ekstra
// gecikme olmasın diye) — 0 sonuç dönerse Claude ile kısa bir İngilizce
// çeviri alıp tekrar dener. Open Food Facts tarafı Türkçe'yi zaten
// destekliyor, ikisi paralel/ardışık birleştirilip döndürülüyor.
export async function searchFoodsByName(query: string): Promise<FoodSearchResult[]> {
  const [usdaFirstPass, offResults] = await Promise.all([
    searchUsda(query).catch(() => []),
    searchOpenFoodFactsByName(query).catch(() => []),
  ]);

  let usdaResults = usdaFirstPass;
  if (usdaResults.length === 0) {
    const translated = await translateFoodQueryToEnglish(query).catch(() => null);
    if (translated && translated.toLowerCase() !== query.trim().toLowerCase()) {
      usdaResults = await searchUsda(translated).catch(() => []);
    }
  }

  return [...usdaResults.slice(0, 6), ...offResults.slice(0, 6)];
}

// Kullanıcı barkod numarası girerse (Elle Ekle arama kutusuna rakam
// yazılırsa) Open Food Facts'e düşüyor — BarcodeScanButton.tsx'teki
// getProductByBarcode ile aynı tek fonksiyon, kod tekrarı yok.
export async function searchFoodByBarcode(code: string): Promise<FoodSearchResult[]> {
  const product = await lookupBarcode(code);
  if (!product) return [];
  return [{ id: `off-${code}`, ...product, source: "off" }];
}
