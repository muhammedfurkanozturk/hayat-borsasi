import "server-only";

export interface BarcodeProduct {
  description: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  portion: string | null;
}

// OpenNutriTracker + FoodLens'teki (piyasa araştırması) barkod tarama
// fikri — ücretsiz, anahtar gerektirmeyen Open Food Facts veritabanı
// kullanılıyor. Sonuç "1 porsiyon" yerine 100g bazlı geliyor; kullanıcı
// zaten mevcut onay ekranında (pending flow) porsiyonu elle düzeltebilir.
export async function lookupBarcode(code: string): Promise<BarcodeProduct | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`, {
    headers: { "User-Agent": "HayatBorsasi/1.0 (kisisel kullanim)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Ürün veritabanına erişilemedi.");

  const json = await res.json();
  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  const nutriments = p.nutriments ?? {};
  const name: string = p.product_name_tr || p.product_name || p.generic_name || "Bilinmeyen ürün";

  return {
    description: name,
    calories: typeof nutriments["energy-kcal_100g"] === "number" ? nutriments["energy-kcal_100g"] : null,
    proteinG: typeof nutriments.proteins_100g === "number" ? nutriments.proteins_100g : null,
    carbsG: typeof nutriments.carbohydrates_100g === "number" ? nutriments.carbohydrates_100g : null,
    fatG: typeof nutriments.fat_100g === "number" ? nutriments.fat_100g : null,
    portion: "100g",
  };
}
