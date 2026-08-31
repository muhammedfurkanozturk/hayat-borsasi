import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { parseRecipe, type Recipe } from "@hayat-borsasi/shared";

const client = new Anthropic();

// FoodLens + OpenNutriTracker'daki (piyasa araştırması) "geçmişe göre tarif
// öner" fikri — kullanıcının son yediklerinden çıkan malzeme/örüntüyü
// kullanıp yeni bir öğün fikri üretiyor, fotoğraf/kalori tahmini değil.
//
// 2026-08-27: AI Rapor'daki JSON-formatlı çıktı desenine (bkz.
// packages/shared/src/report.ts) uydurulup genişletildi — düz "title/
// description/ingredients" yerine artık malzeme miktarları + numaralı
// adımlar + süre/porsiyon rozetleri + sunum önerisi ayrı ayrı geliyor
// (packages/shared/src/recipe.ts → Recipe tipi).
//
// 2026-08-28 (Bölüm 5): tek moddan ("Kaydettiklerimden Öner") üç moda
// çıkarıldı — JSON şeması ve kalite kuralları HER modda aynı kalıyor,
// sadece kullanıcı mesajı ve modun kendi davranış talimatı değişiyor.
export type RecipeSuggestionMode = "saved" | "surprise" | "ingredients";

export interface RecipeSuggestionInput {
  mode: RecipeSuggestionMode;
  recentMealDescriptions?: string[];
  ingredients?: string;
}

// 2026-08-29 (KitchenAid'den ilham, piyasa araştırması): filtreleme
// metadatası (zorluk/öğün türü/ilham/diyet) + malzeme grupları + varyasyon
// önerisi eklendi — hepsi packages/shared/src/recipe.ts'te OPSİYONEL
// alanlar, parseRecipe geçersiz/eksik değerleri sessizce eler.
const JSON_SCHEMA_INSTRUCTION =
  'SADECE şu JSON formatında döndür: {"tarif_adi": "kısa Türkçe tarif adı", "hazirlik_suresi": "örn. 10 dakika", "pisirme_suresi": "örn. 8 dakika", "porsiyon": "örn. 1 kişilik", ' +
  '"malzemeler": [{"ad": "malzeme adı", "miktar": "örn. 2 adet", "grup": "opsiyonel — tarif birden çok bileşenden oluşuyorsa (örn. \'Hamur\' + \'Sos\') o malzemenin ait olduğu bölüm adı, tek parçalı basit tariflerde bu alanı hiç YAZMA"}], ' +
  '"adimlar": ["adım 1", "adım 2", "..."], "sunum_onerisi": "1 cümlelik servis önerisi", ' +
  '"varyasyon_onerisi": "malzemelerden birinin yerine geçebilecek makul bir alternatif önerisi, 1 cümle (örn. \'tavuk yerine hindi kullanabilirsin\')", ' +
  '"zorluk": "kolay" | "orta" | "zor", ' +
  '"ogun_turu": "kahvalti" | "ana-yemek" | "tatli" | "corba" | "ara-ogun" | "icecek", ' +
  '"ilham": "hizli-kolay" | "ev-yemegi" | "saglikli-hafif" | "uluslararasi", ' +
  '"diyetler": ["vegan" | "vejetaryen" | "laktozsuz" | "glutensiz" — tarif GERÇEKTEN uyuyorsa ekle, uymuyorsa boş dizi bırak, zorlama]}. ' +
  "malzemeler ve adimlar dizileri boş olmasın, en az 2 malzeme ve 2 adım ver. zorluk/ogun_turu/ilham alanları için SADECE verilen seçeneklerden birebir birini kullan. " +
  "Yanıtın SADECE bu JSON objesi olsun — öncesinde/sonrasında hiçbir açıklama, selamlama veya not olmasın, ```json gibi kod bloğu işaretleyicisi KULLANMA, ham metin olarak sadece { ile başlayıp } ile bitsin.";

const MODE_SYSTEM_PROMPTS: Record<RecipeSuggestionMode, string> = {
  saved:
    "Sen bir beslenme asistanısın. Kullanıcının son günlerde yediği yemeklerin listesi verilecek. Bu örüntüye uyan (benzer malzemeler kullanan veya besin dengesini tamamlayan), evde kolayca yapılabilecek TEK bir yemek tarifi öner. " +
    JSON_SCHEMA_INSTRUCTION,
  surprise:
    "Sen bir beslenme asistanısın. Kullanıcının geçmişinden tamamen BAĞIMSIZ, dünya mutfaklarından çeşitli ve ilham verici, evde yapılabilecek TEK bir yemek tarifi öner — her seferinde farklı bir mutfak/tarz/malzeme grubu dene, önceki önerilerle aynı kalıba düşme. " +
    JSON_SCHEMA_INSTRUCTION,
  ingredients:
    "Sen bir beslenme asistanısın. Kullanıcının o an evinde bulunan malzemeler verilecek. SADECE (veya büyük ölçüde) bu malzemeleri kullanan, evde yapılabilecek TEK bir yemek tarifi öner — tuz/yağ/su gibi temel mutfak malzemelerini varsayabilirsin ama kullanıcının listelemediği başka bir ANA malzeme ekleme. " +
    JSON_SCHEMA_INSTRUCTION,
};

function buildUserMessage(input: RecipeSuggestionInput): string {
  if (input.mode === "ingredients") {
    return `Elimdeki malzemeler: ${input.ingredients?.trim() || "belirtilmedi"}`;
  }
  if (input.mode === "surprise") {
    return "Bana sürpriz, alışılmışın dışında bir tarif öner.";
  }
  const recentMealDescriptions = input.recentMealDescriptions ?? [];
  return recentMealDescriptions.length > 0
    ? `Son yediklerim: ${recentMealDescriptions.join(", ")}`
    : "Henüz bir yemek geçmişim yok, genel sağlıklı bir tarif öner.";
}

async function requestRecipeJson(input: RecipeSuggestionInput): Promise<string> {
  const response = await client.messages.create({
    model: "claude-opus-5",
    // 2026-08-28: "Sürpriz Beni" modu eklenince 800 token'lık eski sınır
    // yetersiz kaldı — canlı testte Claude'un ürettiği daha ayrıntılı
    // tarifler (ör. çok malzemeli bir Etiyopya yahnisi) JSON'un ortasında
    // kesiliyordu (stop_reason: "max_tokens"), 3/3 tekrar test edilip
    // doğrulandı. 1600'e çıkarılınca (aynı promptla 2/2 tam/geçerli JSON)
    // sorun çözüldü. 2026-08-29: KitchenAid metadata alanları (zorluk/
    // ogun_turu/ilham/diyetler/varyasyon_onerisi) eklenince JSON büyüdü,
    // 2000'e çıkarıldı — tüm modlar için ortak, güvenli bir tavan.
    max_tokens: 2000,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system: MODE_SYSTEM_PROMPTS[input.mode],
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API'den metin yanıtı alınamadı.");
  }
  return textBlock.text;
}

export async function suggestRecipe(input: RecipeSuggestionInput): Promise<Recipe> {
  const first = parseRecipe(await requestRecipeJson(input));
  if (first) return first;

  // Claude bazen tek seferde şemaya uymayan bir yanıt verebiliyor — bir kez
  // daha deniyoruz, kullanıcıya çirkin ham hatayı hemen göstermek yerine.
  const second = parseRecipe(await requestRecipeJson(input));
  if (second) return second;

  throw new Error("Tarif üretilirken bir sorun oluştu, tekrar dener misin?");
}
