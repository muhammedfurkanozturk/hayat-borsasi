// 2026-08-27 — AI Rapor'daki parseStructuredReport deseninin tarif önerisi
// için uyarlaması: Claude'dan düz yazı yerine yapılandırılmış JSON istenip,
// gösterim tarafı (RecipeCard.tsx) bunu bölümlere ayrılmış kartlarda
// gösteriyor. JSON.parse başarısız olursa veya beklenen alanlar yoksa
// null döner — çağıran taraf bunu bir hata mesajı olarak ele alır.
//
// 2026-08-29 (KitchenAid'den ilham, piyasa araştırması): filtreleme +
// malzeme grupları + varyasyon önerisi için yeni OPSİYONEL alanlar eklendi
// — hepsi `?` ile işaretli, eski kaydedilmiş tarifler (bu alanlar hiç
// olmadan) hâlâ geçerli, sadece undefined dönerler, gösterim tarafı bunu
// zaten güvenli şekilde ele alıyor (bkz. RecipeCard.tsx).
export type RecipeDifficulty = "kolay" | "orta" | "zor";
export type RecipeCourse = "kahvalti" | "ana-yemek" | "tatli" | "corba" | "ara-ogun" | "icecek";
export type RecipeInspiration = "hizli-kolay" | "ev-yemegi" | "saglikli-hafif" | "uluslararasi";
export type RecipeDiet = "vegan" | "vejetaryen" | "laktozsuz" | "glutensiz";

export const RECIPE_DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  kolay: "Kolay",
  orta: "Orta",
  zor: "Zor",
};
export const RECIPE_COURSE_LABELS: Record<RecipeCourse, string> = {
  kahvalti: "Kahvaltı",
  "ana-yemek": "Ana Yemek",
  tatli: "Tatlı",
  corba: "Çorba",
  "ara-ogun": "Ara Öğün",
  icecek: "İçecek",
};
export const RECIPE_INSPIRATION_LABELS: Record<RecipeInspiration, string> = {
  "hizli-kolay": "Hızlı & Kolay",
  "ev-yemegi": "Ev Yemeği",
  "saglikli-hafif": "Sağlıklı & Hafif",
  uluslararasi: "Uluslararası Mutfak",
};
export const RECIPE_DIET_LABELS: Record<RecipeDiet, string> = {
  vegan: "Vegan",
  vejetaryen: "Vejetaryen",
  laktozsuz: "Laktozsuz",
  glutensiz: "Glutensiz",
};

export interface RecipeIngredient {
  ad: string;
  miktar: string;
  // Bir tarifte birden çok bileşen varsa (örn. "hamur" + "sos") — yoksa
  // undefined, tüm malzemeler tek liste olarak gösterilir.
  grup?: string;
}

export interface Recipe {
  tarif_adi: string;
  hazirlik_suresi: string;
  pisirme_suresi: string;
  porsiyon: string;
  malzemeler: RecipeIngredient[];
  adimlar: string[];
  sunum_onerisi: string;
  // `| null` DE kabul ediyor — Supabase'in nullable sütunları JS'e `null`
  // olarak geliyor (`undefined` değil), DbSavedRecipe bu tipi doğrudan
  // paylaşıyor (bkz. supabase/recipes.ts), ayrı bir dönüşüm katmanı yok.
  varyasyon_onerisi?: string | null;
  zorluk?: RecipeDifficulty | null;
  ogun_turu?: RecipeCourse | null;
  ilham?: RecipeInspiration | null;
  diyetler?: RecipeDiet[] | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Claude bazen net talimata rağmen yanıtı ```json ... ``` kod bloğuna
// sarıyor — parse etmeden önce bu işaretleri temizliyoruz.
function stripCodeFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && (options as readonly string[]).includes(value);
}

const DIFFICULTIES: RecipeDifficulty[] = ["kolay", "orta", "zor"];
const COURSES: RecipeCourse[] = ["kahvalti", "ana-yemek", "tatli", "corba", "ara-ogun", "icecek"];
const INSPIRATIONS: RecipeInspiration[] = ["hizli-kolay", "ev-yemegi", "saglikli-hafif", "uluslararasi"];
const DIETS: RecipeDiet[] = ["vegan", "vejetaryen", "laktozsuz", "glutensiz"];

export function parseRecipe(text: string): Recipe | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (typeof parsed.tarif_adi !== "string" || !Array.isArray(parsed.malzemeler) || !Array.isArray(parsed.adimlar)) {
    return null;
  }

  const malzemeler: RecipeIngredient[] = parsed.malzemeler
    .filter(isRecord)
    .map((m) => ({
      ad: typeof m.ad === "string" ? m.ad : "",
      miktar: typeof m.miktar === "string" ? m.miktar : "",
      grup: typeof m.grup === "string" && m.grup.trim() ? m.grup : undefined,
    }))
    .filter((m) => m.ad.trim().length > 0);

  const adimlar: string[] = parsed.adimlar.filter((a): a is string => typeof a === "string" && a.trim().length > 0);

  const diyetlerRaw = Array.isArray(parsed.diyetler) ? parsed.diyetler.filter((d) => isOneOf(d, DIETS)) : [];

  return {
    tarif_adi: parsed.tarif_adi,
    hazirlik_suresi: typeof parsed.hazirlik_suresi === "string" ? parsed.hazirlik_suresi : "",
    pisirme_suresi: typeof parsed.pisirme_suresi === "string" ? parsed.pisirme_suresi : "",
    porsiyon: typeof parsed.porsiyon === "string" ? parsed.porsiyon : "",
    malzemeler,
    adimlar,
    sunum_onerisi: typeof parsed.sunum_onerisi === "string" ? parsed.sunum_onerisi : "",
    varyasyon_onerisi: typeof parsed.varyasyon_onerisi === "string" && parsed.varyasyon_onerisi.trim() ? parsed.varyasyon_onerisi : undefined,
    zorluk: isOneOf(parsed.zorluk, DIFFICULTIES) ? parsed.zorluk : undefined,
    ogun_turu: isOneOf(parsed.ogun_turu, COURSES) ? parsed.ogun_turu : undefined,
    ilham: isOneOf(parsed.ilham, INSPIRATIONS) ? parsed.ilham : undefined,
    diyetler: diyetlerRaw.length > 0 ? diyetlerRaw : undefined,
  };
}

// KitchenAid'deki (piyasa araştırması) "ayrı hazırlık ve toplam süre"
// fikri — bizim sürelerimiz serbest metin ("10 dakika", "1 saat" gibi),
// tam güvenilir parse garantisi yok, bu yüzden EN İYİ ÇABA (best-effort)
// bir dakika sayısı çıkarmaya çalışıyor, çıkaramazsa null döner (gösterim
// tarafı bu durumda "Toplam Süre" rozetini basitçe atlar, hata vermez).
export function parseDurationMinutes(text: string): number | null {
  if (!text) return null;
  const hourMatch = text.match(/(\d+(?:[.,]\d+)?)\s*saat/i);
  const minMatch = text.match(/(\d+)\s*dak/i);
  let total = 0;
  let found = false;
  if (hourMatch) {
    total += parseFloat(hourMatch[1].replace(",", ".")) * 60;
    found = true;
  }
  if (minMatch) {
    total += parseInt(minMatch[1], 10);
    found = true;
  }
  if (!found) {
    // Sadece sayı varsa (birim yazılmamışsa) dakika kabul et — örn "10"
    const bare = text.match(/^\s*(\d+)\s*$/);
    if (bare) {
      total = parseInt(bare[1], 10);
      found = true;
    }
  }
  return found ? Math.round(total) : null;
}
