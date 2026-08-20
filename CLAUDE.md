# CLAUDE.md — Hayat Borsası Projesi

Bu dosya, bu repo üzerinde çalışan Claude Code için proje bağlamı ve kurallarını içerir. Kod yazmadan/değiştirmeden önce bu dosyayı baştan sona oku ve burada belirtilen mimariye, isimlendirmeye ve karar setine sadık kal. Belirsiz bir konu varsa varsayım yapıp sessizce ilerleme yerine kullanıcıya sor.

---

## 1. Proje Nedir?

**Hayat Borsası**, kullanıcıların kendi hayatlarını borsa/finans terminali estetiğiyle takip ettiği, kişiselleştirilebilir bir günlük/haftalık/aylık/yıllık gelişim ve checklist uygulaması. Klasik bir "todo list" değil — kullanıcı kendi kategorilerini ve görevlerini tanımlar, her göreve kendi önem ağırlığını verir, uygulama bunlardan borsa endeksi gibi bir "gelişim skoru" hesaplar ve zaman içindeki trendi çizgi grafikle gösterir.

Referans arayüz hissi: Bir borsa/kripto terminali (örn. TradingView, Investing.com tarzı) — koyu tema, üstte endeks kutucukları, ortada grafik ve checklist paneli.

**Kritik prensip:** Uygulama hiçbir görevi zorunlu kılmaz. Tüm kategoriler ve görevler kullanıcı tarafından oluşturulur/düzenlenir. Varsayılan şablon kategoriler sadece öneri niteliğindedir.

---

## 2. Geliştirme Aşaması Sırası

1. **Faz 1 — Web MVP** (şu an buradayız): Next.js + Supabase ile web uygulaması
2. **Faz 2 — Pro/Ödeme katmanı**: iyzico entegrasyonu
3. **Faz 3 — Mobil**: React Native (Expo) ile web ile ortak iş mantığı kullanılarak mobile taşıma

Şu anda sadece **Faz 1 (Web MVP)** üzerinde çalışıyoruz. Mobil veya ödeme kodu istenmeden yazılmayacak.

**İstisna (2026-08-19, kullanıcı bilinçli onayıyla):** Faz 3 (mobil), Faz 2'yi (ödeme/iyzico) beklemeden öne çekildi — bkz. bölüm 8 ve bölüm 9. Ödeme katmanı hâlâ yok, sıradaki adım değil; mobil bitince veya paralel gündeme gelince tekrar ele alınacak.

---

## 3. Teknoloji Stack'i (KESİN — değiştirilmeyecek)

| Katman | Teknoloji |
|---|---|
| Frontend framework | **Next.js** (App Router kullan, Pages Router değil) |
| Dil | **TypeScript** (JavaScript değil — tüm dosyalar `.ts` / `.tsx`) |
| UI / Stil | **Tailwind CSS** + gerekirse `shadcn/ui` bileşenleri |
| Grafik / çizgi endeks görselleştirme | **Recharts** |
| Veritabanı + Auth + Backend | **Supabase** (PostgreSQL) |
| Kimlik doğrulama yöntemi | Web: Supabase Auth — **sadece e-posta/şifre** (OAuth/Google yok). Mobil: e-posta/şifre + Google OAuth — **istisna, 2026-08-20, kullanıcı bilinçli onayıyla**, bkz. bölüm 8 ve bölüm 9 |
| Sesli not → yazı | Web Speech API (tarayıcı yerleşik) — ses dosyası saklanmaz, sadece deşifre edilen metin kaydedilir |
| Yapay zeka / rapor üretimi | **Claude API (Anthropic)** — `/v1/messages` endpoint |
| Ödeme (Faz 2'de) | iyzico |
| Hosting | Vercel |
| Dil / lokalizasyon | Sadece **Türkçe** (ilk hedef kitle Türkiye) — tüm arayüz metinleri Türkçe olacak |

**Kullanma:** .NET, Firebase, MongoDB, Redux (gerekmedikçe — React Context/Zustand yeterli), CSS-in-JS kütüphaneleri (styled-components vb.), Pages Router.

**Mobil (Faz 3, 2026-08-19'da başladı — bkz. bölüm 8 istisnası):** React Native + Expo (expo-router), repo kökünde npm workspaces monorepo altında `apps/mobile`. Web ile paylaşılan iş mantığı (skor hesaplama, Supabase sorgu fonksiyonları, chart/format yardımcıları) `packages/shared` (`@hayat-borsasi/shared`) paketinde — bkz. bölüm 9.

---

## 4. Veri Modeli (Supabase / PostgreSQL)

Aşağıdaki tablo yapısını temel al, gerektiğinde genişlet ama isimlendirmeyi bozma:

- `profiles` — kullanıcı profili (Supabase `auth.users` ile 1-1 ilişkili: id, display_name, created_at, is_pro)
- `categories` — kullanıcıya özel kategoriler (id, user_id, name, icon/emoji, sort_order)
- `tasks` — kategoriye bağlı görevler (id, category_id, user_id, title, weight [kullanıcının verdiği önem puanı, örn. 1-10], frequency [daily/weekly/monthly], is_active)
- `daily_entries` — bir kullanıcının bir günkü kaydı (id, user_id, date, note_text [textarea/sesli not metni], total_score)
- `daily_task_logs` — o güne ait hangi task'ların işaretlendiği (id, daily_entry_id, task_id, completed boolean)
- `weekly_reviews` — haftalık özel sorulara verilen cevaplar (id, user_id, week_start_date, answers jsonb, weekly_score)
- `monthly_reviews` — aylık özel sorulara verilen cevaplar (id, user_id, month, answers jsonb, monthly_score)
- `ai_reports` — AI'dan üretilen özet raporlar (id, user_id, period_type [daily/weekly/monthly/yearly], period_start, period_end, content_text, created_at)

Tüm tablolarda **Row Level Security (RLS)** aktif olacak — bir kullanıcı sadece kendi verisine erişebilmeli. Her tablo için `user_id = auth.uid()` politikası yazılacak. RLS'siz bir tablo asla production'a çıkmayacak.

---

## 5. Skor Hesaplama Mantığı

- Her `task`'ın bir `weight` değeri vardır (kullanıcı belirler, örn. 1–10).
- Günlük skor = (o gün tamamlanan task'ların ağırlık toplamı / o gün aktif olan tüm task'ların ağırlık toplamı) × 100. Yani 0–100 arası bir yüzde skoru.
- Bir önceki güne göre fark, borsa endeksi görünümünde artı/eksi yüzde olarak gösterilir (örn. "▲ %4.2").
- Haftalık skor = o haftaki günlük skorların ortalaması, ardından `weekly_reviews` cevaplarındaki çarpan/ceza-ödül ile ayarlanır.
- Aylık skor = o ayki haftalık skorların ortalaması, `monthly_reviews` ile ayarlanır.
- Bu formülü değiştirmeden önce kullanıcıya danış — bu, ürünün çekirdek mantığı.

---

## 6. Temel Ekranlar (Faz 1 kapsamı)

1. **Auth** — Giriş / Kayıt (e-posta + şifre)
2. **Dashboard** — üstte endeks kutucukları (günlük skor, haftalık skor, kategori bazlı mini skorlar), ortada ana skor çizgi grafiği, altında bugünün checklist'i
3. **Kategori & Görev Yönetimi** — kategori oluşturma/silme, her kategoriye görev ekleme, her göreve ağırlık (1-10) atama
4. **Günlük Giriş Ekranı** — checklist (tik atma), textarea (günlük not), mikrofon butonu (sesli not → metne çevirme)
5. **Rapor / AI Özet** — "Günümü/Haftamı/Ayımı özetle" butonu → Claude API'ye günün/haftanın verisi gönderilir, dönen metin ekranda gösterilir ve `ai_reports` tablosuna kaydedilir
6. **Karakter Kartı** — kategorilere göre otomatik hesaplanan "stat" kartı (örn. Girişimcilik, Akademisyenlik, Disiplin, Sosyal Sermaye, Sağlık, Maneviyat) — her stat kendi mini trend çizgisiyle
7. **Ayarlar** — profil, Pro durumu (Faz 2'ye kadar sadece görünüm, işlevsel değil)

---

## 7. Kod Standartları

- TypeScript strict mode açık olacak.
- Component'ler küçük ve tek sorumluluklu tutulacak; bir dosya çok büyürse böl.
- Supabase client çağrıları için ayrı bir `lib/supabase` katmanı kullan — component içine ham sorgu yazma.
- Claude API çağrıları için ayrı bir `lib/ai` katmanı / API route (`app/api/...`) kullan — API anahtarı **asla** client tarafında (frontend'de) açığa çıkmayacak, sadece server-side (Next.js API route / server action) üzerinden çağrılacak.
- Tüm kullanıcıya görünen metinler Türkçe olacak; kod içi değişken/fonksiyon isimleri İngilizce kalabilir (endüstri standardı).
- Karanlık tema varsayılan olacak (Tailwind `dark` sınıfı / CSS değişkenleri ile), renk paleti borsa/finans terminaline uygun: yeşil (artış/pozitif), kırmızı (azalış/negatif), koyu lacivert/siyah arka plan.
- Her yeni tablo/migration için Supabase migration dosyası oluştur, elle panelden tablo oluşturma yerine kod tabanlı migration tercih et.

### 7.1 Mobil (`apps/mobile`) — zorunlu kurallar (2026-08-19/20 hata serisinden çıkarılan dersler)

Faz 3'ün ilk turunda art arda çöken/veri yüklemeyen bir dizi hata yaşandı (bkz. bölüm 9'daki geçmiş). Kök nedenleri tekrar etmemek için `apps/mobile` içinde kod eklerken/değiştirirken şu kurallara **uy**:

- **React sürümü kökle mobil arasında AYNI olacak** (şu an `19.1.0`). Kök `package.json` ile `apps/mobile/package.json`'daki `react`/`react-dom` sürümü sapmasın — sapma, npm'in iki farklı fiziksel React kopyası hoist etmesine ve "Cannot read properties of null (reading 'useState'/'useEffect')" çökmesine yol açıyordu. Birini yükseltirsen ikisini birden yükselt, `npm install` sonrası `find`/`Get-ChildItem` ile tek kopya kaldığını doğrula.
- **Kökte (`src/app/_layout.tsx`) `AuthProvider` dışında ikinci bir özel Context/Provider ekleme.** Tema gibi global state gerekiyorsa `apps/mobile/src/lib/theme-context.tsx`'teki `useSyncExternalStore` tabanlı, Provider'sız "harici store" desenini kullan. İki iç içe özel Provider, nedeni netleşmeyen tekrarlanabilir bir "Invalid hook call" çökmesine yol açtı.
- **`apps/mobile/app.json`'da `experiments.reactCompiler` açma.** Bu, `useMemoCache` üzerinden çöküşe sebep oldu; kapalı kalacak.
- **Modül üst seviyesinde (component gövdesi dışında) `window`/`localStorage`/`AsyncStorage`'a dokunan kod varsa `Platform.OS === "web" && typeof window === "undefined"` ile koru.** Sebep: Expo'nun statik web export'u (`expo export --platform web`) Node tarafında bir SSR ön-render adımı çalıştırıyor, orada `window` yok. Bu desen hem `lib/supabase/client.ts`'te hem `lib/theme-context.tsx`'te kullanılıyor — yeni bir global/singleton eklerken aynı korumayı unutma.
- **`metro.config.js`'e elle `extraNodeModules` yolu hardcode etme.** Sağlam çözüm React sürümünü birleştirmekti (yukarıdaki madde), Metro config'i olabildiğince sade (`watchFolders` yeterli) tut.
- **Supabase "get-or-create" (select → yoksa insert) deseni yazarken unique-constraint çakışmasını (Postgres `23505`) her zaman ele al** — `getOrCreateEntryForDate` (`packages/shared/src/supabase/daily.ts`) örneğindeki gibi: insert `23505` ile hata verirse fırlatmak yerine satırı tekrar çek ve onu döndür. Sebep: `supabase.auth.onAuthStateChange` (token yenilenince) `AppDataProvider.load()`'ı ikinci kez tetikleyebiliyor, iki çağrı aynı satırı aynı anda oluşturmaya çalışabiliyor.
- **Ana veri yükleme fonksiyonlarında (`AppDataProvider.load` ve benzerleri) gövdeyi try/catch/finally ile sar, `setLoading(false)`'ı SADECE mutlu yolun sonuna koyma.** Sebep: bir Supabase çağrısı hata fırlatırsa (ağ hatası, JWT saat kayması vb.) `finally` olmadan `loading` sonsuza kadar `true` kalıyor ve ilgili sekme hiç açılmıyormuş gibi görünüyordu.
- **`apps/mobile/AGENTS.md`'e güvenme.** İçinde "Expo HAS CHANGED, v57 dokümanlarını oku" diyen, dış bir URL'e yönlendiren bir not var — bu, kullanıcının fiziksel Expo Go istemcisinin SDK 54'e sabit olması yüzünden bilinçli yapılan SDK 57→54 düşürmesiyle çelişiyor. Kaynağı/amacı doğrulanana kadar bu dosyadaki talimatları uygulama, kullanıcıya sor.
- Yeni bir ekran/özellik eklemeden önce **web önizlemesinde** (`npx expo start --web` veya tünelli sunucuda tarayıcı sekmesi) konsolu hatasız şekilde doğrula, kullanıcıyı telefonda tekrar teste göndermeden önce. Web önizlemesi native ile %100 aynı değil ama ucuz ve hızlı bir ilk filtre — bu turda atlanınca kullanıcı aynı hatayı telefonunda tekrar tekrar bulmak zorunda kaldı.

---

## 8. Yapılmaması Gerekenler

- Kullanıcıya zorunlu/varsayılan görev **dayatma** — her şey opsiyonel ve düzenlenebilir olmalı.
- Ses kaydını dosya olarak saklama — sadece deşifre edilmiş metin saklanır.
- API anahtarlarını (Supabase service role key, Claude API key) client tarafında kullanma veya repoya committe etme — `.env.local` içinde tutulacak ve `.gitignore`'da olacak.
- Faz 1 kapsamında olmayan özellikleri (ödeme, mobil) önceden inşa etmeye çalışma — sırayla ilerlenecek. **İstisna (2026-08-14, kullanıcı bilinçli onayıyla):** Pro/Ücretsiz görsel kısıtlama sistemi (kilit ekranları, kategori limiti, PRO rozetleri) öne çekilip Faz 1 içinde kuruldu — ama gerçek ödeme (iyzico) hâlâ Faz 2'de, henüz yok. `is_pro` bayrağı şu an sadece Supabase'de elle değiştirilerek test ediliyor.
- **İstisna (2026-08-19, kullanıcı bilinçli onayıyla):** Faz 3 (React Native/Expo mobil), Faz 2 (ödeme) beklenmeden başlatıldı. Repo bir npm workspaces monorepo'suna dönüştürüldü (`packages/shared` + `apps/mobile`) — bkz. bölüm 9. Ödeme katmanı hâlâ Faz 2'de, henüz yok.
- **İstisna (2026-08-20, kullanıcı bilinçli onayıyla — "Tam OAuth entegrasyonunu şimdi kur"):** Bölüm 3'teki "sadece e-posta/şifre, OAuth yok" kuralı **sadece mobil** için gevşetildi — `apps/mobile`'a Google ile giriş eklendi (bkz. bölüm 9). **Web hâlâ sadece e-posta/şifre** — bu istisna web'e uygulanmadı, web tarafında OAuth/Google eklenmeyecek.

---

## 9. Şu Anki Durum / Sıradaki Görev

> Bu bölümü proje ilerledikçe güncelle. Son güncelleme: 2026-08-20.

**Mobil (Faz 3) — 2026-08-19'da başlatıldı:**
- Repo, mevcut web uygulamasını kökten taşımadan bir **npm workspaces monorepo**'suna dönüştürüldü (kök `package.json` → `"workspaces": ["packages/*", "apps/*"]`).
- **`packages/shared`** (`@hayat-borsasi/shared`): platform-bağımsız iş mantığı buraya taşındı — `scoring.ts`, `chartSeries.ts`, `format.ts`, `report.ts`, `types.ts` (`IconKey`, `DailyScorePoint` — tek doğruluk kaynağı burası), ve tüm `supabase/*.ts` CRUD sorgu fonksiyonları (`categories/daily/history/reports/subtasks/tasks` — hepsi `SupabaseClient`'ı parametre olarak alıyor, client'ı kendileri oluşturmuyor). Web'deki eski `src/lib/...` dosyaları artık bu pakete tek satırlık re-export shim'leri (`export * from "@hayat-borsasi/shared/..."`) — hiçbir mevcut `@/lib/...` import'u değişmedi, `npm run build` ile regresyon doğrulandı. `next.config.ts`'e `transpilePackages: ["@hayat-borsasi/shared"]` eklendi (paket ham TS olarak dağıtılıyor).
- **`apps/mobile`** (`@hayat-borsasi/mobile`): Expo SDK 57 + expo-router (`src/app` router kökü, `@/*` → `./src/*` alias — web'le aynı konvansiyon). Supabase client'ı `@supabase/supabase-js` + `@react-native-async-storage/async-storage` ile kuruldu (native'de AsyncStorage, web'de supabase-js'in kendi SSR-güvenli varsayılan storage'ı — AsyncStorage'ın web shim'i Expo Router'ın statik dışa aktarımındaki Node render adımında `window is not defined` ile patlıyordu, `Platform.OS !== "web"` koşuluyla düzeltildi, bkz. `src/lib/supabase/client.ts`). `.env.local` içinde sadece `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` var (public/anon anahtarlar — service-role/Anthropic/cron anahtarları mobile'a hiç kopyalanmadı).
- Auth (giriş/kayıt, `app/(auth)/giris.tsx` + `kayit.tsx`), alt sekme (tab bar) navigasyonlu **5 ekran** — Dashboard (`dashboard.tsx`, günlük endeks + kategori bazlı checklist), Günlük Giriş (`gunluk-giris.tsx`, bugünün notu — sesli not/mikrofon henüz yok, bkz. altta), Kategoriler (`kategoriler.tsx`, kategori oluşturma/silme + her kategoriye görev ekleme/silme, ağırlık ve sıklık seçimiyle), Karakter Kartı (`karakter-karti.tsx`, tier/skor/istatistikler + kategori bazlı bar grafiği — web'in Recharts radar grafiği yerine RN'de basit bar liste, yeni bir chart kütüphanesi eklemeden), Ayarlar (`ayarlar.tsx`, profil/iletişim düzenleme, Plan durumu salt-okunur, veri sıfırlama, çıkış yap) — hepsi gerçek Supabase verisiyle, telefonda (Expo Go) ve web önizlemede elle test edildi. Yönlendirme `Stack.Protected` (expo-router SDK 53+ auth-gate deseni) ile — oturum yoksa `(auth)`, varsa `(app)` grubu (tab bar) gösteriliyor. `apps/mobile/src/lib/app-data-context.tsx` ve `profile-context.tsx`, web'deki eşdeğerlerinin shared paket + RN Supabase client kullanan birebir portları.
- **İkon eşleme:** Web'in `IconKey` (30 değer, `@hayat-borsasi/shared/types`) → `MaterialCommunityIcons` glif ismi eşlemesi `apps/mobile/src/lib/icon-map.ts`'te — web'in kendi SVG ikon bileşenleri RN'de kullanılamadığı için.
- **SDK 57 → 54'e düşürüldü:** İlk kurulumda kullanıcının Play Store'daki Expo Go'su SDK 57'yi desteklemiyordu (mağaza sürümü SDK 54'te sabit) — `npx expo install expo@^54.0.0 && npx expo install --fix` ile tüm expo-*/react-native paketleri SDK 54 uyumlu sürümlere indirildi.
- **Monorepo/Metro fix:** `apps/mobile/metro.config.js` eklendi (`disableHierarchicalLookup: true` + açık `nodeModulesPaths`) — bu olmadan Metro, kökteki (web'in kullandığı, farklı sürüm) React kopyasını buluyor ve "Cannot read properties of null (reading 'useEffect')" hatasıyla çöküyordu; resmi Expo monorepo rehberindeki standart çözüm.
- **Marka ikonu/splash:** Web navbar'ındaki cyan TrendUp SVG path'i birebir kullanılarak (AI görsel üretimi değil, `sharp` ile programatik SVG→PNG) app icon, Android adaptive icon (foreground/background/monochrome) ve splash ekranı üretildi — koyu zemin `#040506` + cyan `#0ad1eb` glif. Expo şablonunun kendi demo görselleri (react-logo, expo-logo vb.) ve riskli yeni `expo.icon` bundle formatı kaldırıldı, düz `icon.png` referansına geçildi.
- **Rapor/AI Özet** (`app/(app)/rapor.tsx`) tamamlandı — mobil, `ai/claude.ts`'i taşımak yerine (server-only, Claude API anahtarı cihazda asla olmamalı) web'in **deploy edilmiş** `https://hayat-borsasi.vercel.app/api/rapor` route'unu HTTPS üzerinden çağırıyor. Bunun için `src/app/api/rapor/route.ts`'e üç değişiklik yapıldı (web'in çerez tabanlı akışını bozmadan, geriye dönük uyumlu): (1) `Authorization: Bearer <access_token>` header desteği — mobilde çerez yok, Supabase oturum token'ı bununla taşınıyor; (2) `export const maxDuration = 60` — Claude çağrısı Vercel'in varsayılan fonksiyon süresini aşabiliyordu; (3) CORS header'ları (`Access-Control-Allow-Origin: *` + `OPTIONS` handler) — mobil farklı origin'den istek attığı için preflight'ta bu header'lar olmadan tarayıcı "Failed to fetch" ile engelliyordu (native cihazda bu CORS sorunu zaten yoktu, ama web önizlemesiyle test etmek ve genel sağlamlık için eklendi). Mobil `.env.local`'da `EXPO_PUBLIC_API_BASE_URL=https://hayat-borsasi.vercel.app`.
- Doğrulandı: kök `npm install` (workspace linkleri), kök + mobil `tsc --noEmit`, kök `npm run build` (web regresyon), `npx expo export --platform web` (17 route başarıyla statik derlendi), **gerçek telefonda Expo Go (tünel modu, `expo start --tunnel`) ile giriş yapıldı, görev işaretlendi, not kaydedildi, kategori/görev eklendi — hepsi gerçek Supabase verisine yazdı.** Karakter Kartı ve Ayarlar web önizlemede gerçek hesap verisiyle doğrulandı. Rapor ekranı, test hesabının `is_pro`'su geçici olarak açılıp (CLAUDE.md'nin öngördüğü elle test yöntemiyle) deploy edilmiş backend'e gerçek bir istek atılarak uçtan uca doğrulandı — gerçek Claude yanıtı döndü, sonra `is_pro` eski haline (`false`) döndürüldü.
- **Web tarafında da fark edilir:** `/api/rapor` artık CORS header'ları + `maxDuration=60` içeriyor — web kullanıcıları için görünmez bir değişiklik ama Faz 1'deki AI Rapor'un da (varsa) benzer bir zaman aşımı riskini örtük olarak gideriyor.
- **Google ile giriş (2026-08-20, bölüm 8'deki istisna):** `apps/mobile/src/lib/auth-context.tsx`'e `signInWithGoogle` eklendi — `supabase.auth.signInWithOAuth` (PKCE, bkz. `supabase/client.ts`'teki `flowType: "pkce"`) + `expo-web-browser`'ın `openAuthSessionAsync`'i ile tarayıcıda Google akışı açılıyor, redirect `mobile://auth/callback`'e (app.json'daki `scheme: "mobile"`) dönüyor, dönen `code` `exchangeCodeForSession` ile session'a çevriliyor. Giriş ekranı (`giris.tsx`) artık önce bir seçim ekranı gösteriyor ("Google ile devam et" / "E-posta ile devam et") — e-posta seçilirse eskisi gibi form açılıyor. Kayıt ekranına (`kayit.tsx`) da aynı Google butonu formun üstüne eklendi. **ÇALIŞMASI İÇİN KULLANICININ YAPMASI GEREKENLER (henüz yapılmadı, benim tarafımdan yapılamaz):** (1) Google Cloud Console'da bir OAuth 2.0 Client ID (Web application tipinde) oluşturulup Authorized redirect URI'ye `https://uskedyxjwpbjxwtmkmnn.supabase.co/auth/v1/callback` eklenmeli; (2) Supabase Dashboard → Authentication → Providers → Google'da bu Client ID/Secret girilip provider aktif edilmeli; (3) Supabase Dashboard → Authentication → URL Configuration → Additional Redirect URLs'e `mobile://auth/callback` eklenmeli. Bu üç adım atılmadan Google butonu hata verir. Web tarafına bu özellik eklenmedi (bkz. bölüm 3 ve 8).
- **Input/kart derinlik stili (2026-08-20):** `constants/theme.ts`'e `Elevation` (tema başına gölge değerleri) + `hooks/use-theme.ts`'e `useElevatedStyle()` eklendi. Giriş/Kayıt'taki e-posta/şifre input'ları, Kategoriler'deki kategori/görev ekleme kutuları, Günlük Giriş'teki not textarea'sı ve Ayarlar'daki tüm profil input'ları artık `theme.backgroundSelected` (arka plandan belirgin şekilde daha açık) + gölge (`useElevatedStyle()`) kullanıyor — önceden hepsi `backgroundElement` gibi arka plana çok yakın bir tonda olduğu için input'lar "kayboluyordu".
- **Sırada (henüz yapılmadı):** Web'deki 6 ekranın hepsi artık mobilde de var — kapsam tamamlandı. Kalan bilinen eksikler: Sesli not (mikrofon) — Web Speech API yerine RN'de native bir STT çözümü gerekecek, henüz araştırılmadı, kasıtlı olarak Günlük Giriş ekranından çıkarıldı. Manuel açık/koyu tema tercihi (şu an sadece cihazın sistem temasını takip ediyor, web'deki gibi elle değiştirme + kalıcı saklama yok) — Ayarlar ekranından kasıtlı olarak çıkarıldı. Gece otomatik rapor arşivleme mobilde yok (web'deki cron zaten tüm kullanıcılar için ortak, mobile özel bir şey gerekmiyor).

**Tamamlanmış (Faz 1 çekirdeği):**
- Tüm temel ekranlar (Dashboard, Kategori/Görev, Günlükler, AI Rapor, Karakter Kartı, Ayarlar, Pro) + herkese açık landing sayfası
- Gerçek Supabase Auth (e-posta/şifre) + RLS'li 10 tablo şeması + gerekli GRANT'ler (`authenticated` ve `service_role` için ayrı ayrı — ikisi de default olarak GRANT almıyor, migration'da elle verilmesi gerekiyor)
- Tüm uygulama verisi (kategori/görev/alt görev/günlük log/not/rapor/profil) gerçek Supabase sorgularına taşındı, mock veri yok
- Görev sıklığı (Günlük/Haftalık/Aylık) + alt görevler (subtasks) sistemi, optimistic UI güncellemeleriyle
- AI Rapor ekranı: "Anlık [Dönem] Özetle" (Günlük/Aylık/Yıllık) ile ekranda gösterilen, arşive kaydedilmeyen önizleme üretir (`claude-opus-5`, server-side `src/lib/ai/claude.ts` + `src/app/api/rapor/route.ts`)
- Gece yarısı otomatik AI rapor arşivleme (cron): Her gece TR 00:00'da (`vercel.json` → `0 21 * * *` UTC) Vercel Cron, `CRON_SECRET` ile korunan `/api/cron/daily-report`'u çağırır, service_role ile (`src/lib/supabase/admin.ts` + `src/lib/ai/daily-archive.ts`) tüm kullanıcılar için gerçek günlük raporu üretip `ai_reports`'a kaydeder — idempotent. Otomatik tetiklenmesi henüz gece yarısı doğrulanmadı (bkz. hafıza notu). Haftalık/aylık tetikleyici hâlâ yok.
- **Gerçek geçmiş ortalama:** `src/lib/supabase/history.ts` + `AppDataProvider`'daki `dailyHistory` (son 365 gün) sayesinde Haftalık/Aylık/Yıllık endeksler gerçek takvime hizalı ortalamalar kullanıyor (`src/lib/chartSeries.ts`: `buildCalendarMonthSeries`/`buildCalendarYearSeries`/`buildDailySeries`/`buildTwoHourSeries`/`makeScoreForDate`/`nonNullScores` — tekilleştirilmiş, Dashboard/Rapor/Karakter Kartı hepsi aynı yardımcıları kullanıyor). Skor Trendi grafiği sütun/çizgisel seçenekli.
- **Skor formülü değişikliği (kullanıcı onayıyla):** Kategori kutucukları, kategori detay sayfası ve Dashboard'daki Günlük Endeks dün-bugün kıyası yerine "yıllık katkı oranı" gösteriyor (o kategori/genel için geçmiş 365 günün skor toplamı / 365). `calculateScore` (bkz. bölüm 5) değişmedi, sadece DELTA gösterimi değişti.
- **Açık/Koyu tema sistemi:** `src/lib/theme-context.tsx` + `globals.css`'teki `:root[data-theme="light"]` bloğu. Koyu tema varsayılan (ninjatools.io paletinden), açık tema apple.com/tr/airpods paletinden türetildi (yazı kontrastı sonradan koyulaştırıldı). Ayarlar/profil menüsünden değiştirilebiliyor, localStorage'da saklanıyor, `layout.tsx`'teki inline script sayfa boyanmadan önce uyguluyor. Koyu temada kartlara gerçek derinlik hissi veren özel `--shadow-card` (üstte hafif ışık çizgisi + altta gölge) tüm ana kartlarda kullanılıyor.
- **Pro/Ücretsiz kısıtlama sistemi (görsel, ödeme yok — bkz. bölüm 8'deki istisna notu):** `profiles.is_pro` bayrağına göre: AI Rapor sayfası ücretsiz kullanıcılara bulanık+kilitli (`/api/rapor` route'unda da sunucu tarafı kontrol var), Kategori Ekle 6 kategoriden sonra upsell moduna geçiyor (`FREE_CATEGORY_LIMIT`), profil avatarında/sidebar'da altın "PRO" rozetleri var. Ayrı bir **`/pro` sayfası** var (Aylık $5 / Yıllık $40, tek plan, "Yakında" ile devre dışı gerçek ödeme CTA'sı) — tüm "Pro'ya Geç" linkleri artık `/ayarlar` yerine buraya gidiyor. Gerçek ödeme akışı (iyzico) hâlâ yok.
- **Karakter Kartı — futbolcu kartı tasarımı:** `src/components/karakter/CharacterCard.tsx` — skora göre otomatik tier rengi (Bronz/Gümüş/Altın/Elmas), avatar, gecikmeli fade-in animasyonlu istatistik satırları (En Güçlü/Zayıf Alan, Kategori Sayısı, Toplam Görev, Sıralama — sıralama şu an tek kullanıcı olduğu için sabit #1, gerçek çoklu kullanıcı sıralaması yok).
- **Profil genişletildi:** `profiles` tablosuna `phone`/`address`/`occupation` sütunları eklendi. Ayarlar sayfasında tüm iletişim alanları (E-posta dahil) artık "tıkla-düzenle" satırları (`src/components/ayarlar/EditableField.tsx`). **E-posta değişikliği Supabase Auth'un kendi güvenli akışını kullanıyor** (`supabase.auth.updateUser({ email })`) — doğrudan tabloya yazmıyor, yeni adrese onay linki gidiyor, mevcut `/auth/confirm` route'u bunu zaten karşılıyor.
- **Sidebar — Kategoriler açılır/kapanır** oldu, ok ikonu artık çerçeveli/gölgeli bir buton içinde.
- **Onboarding — "İlk alışkanlıklarını seç" ekranı (2026-08-20, sadece web):** Yeni `/onboarding` sayfası (`src/app/(app)/onboarding/`) — kullanıcı hesap açtıktan sonra hiç kategorisi yoksa (`profiles.onboarding_completed_at` NULL + 0 kategori, kontrol `OnboardingGate.tsx`'te) buraya yönlendiriliyor. 7 hazır kategori şablonu (`packages/shared/src/onboardingTemplates.ts` — `ONBOARDING_TEMPLATES`, mobilde de kullanılabilir diye shared'da) kart grid'de çoklu seçilebiliyor, **hiçbiri zorunlu değil** ("Şimdilik atla" linki var — bölüm 1'deki dayatma-yok prensibi burada da geçerli). Seçilenler normal `categories` satırı olarak oluşturuluyor (`insertCategoriesFromTemplates`), özel bir tablo/mantık yok. **Yeni migration (henüz uygulanmadı — kullanıcı Supabase SQL editöründen veya `supabase db push` ile kendi uygulayacak):** `supabase/migrations/20260820120000_onboarding.sql` → `profiles.onboarding_completed_at` sütunu ekliyor, var olan kullanıcılar için `created_at`'e backfill ediyor (geriye dönük onboarding'e düşmesinler diye).
  - **Tüm 7 modül kodu tamam (2026-08-20, sadece web) — hiçbiri henüz canlı DB'de doğrulanmadı, 3 migration bekliyor.** Kullanıcı ("sen hiç durma tüm kategorileri yap sonra ben en son supabase içerisinde eklerim") migration'ları tek tek uygulayıp test etmek yerine hepsini kodlatıp sona bıraktı — yani bu blok tamamen **runtime-doğrulanmamış** kod içeriyor, ilk gerçek kullanımda sorun çıkarsa şaşırma.
  - **Bekleyen 3 migration (sırayla çalıştır, üçü de idempotent — güvenle tekrar tekrar çalıştırılabilir):** `20260820120000_onboarding.sql` → `20260820140000_habit_break.sql` → `20260820160000_habit_modules.sql`. **Önemli geçmiş not:** `habit_break` migration'ı ilk denemede kısmi uygulanmıştı (`tasks.is_habit_break` sütunu eklenmiş ama `habit_relapses`/`habit_notes` tabloları oluşmamıştı — servis-role script'iyle test edilirken yakalandı, kök neden netleşmedi). Bu yüzden **üç migration da** artık `IF NOT EXISTS` / `DROP POLICY IF EXISTS` / enum'lar için exception-yutan `DO` bloklarıyla yeniden yazıldı — kısmi bir uygulama olsa bile dosyayı baştan çalıştırmak güvenli.
  - **Kategori → modül eşlemesi:** Yeni `categories.module_type` enum sütunu (`standard | focus | finance | nutrition | style | digital | sport`) — sadece onboarding şablonlarından oluşan kategorilere set ediliyor (`ONBOARDING_TEMPLATES[].moduleType`, `packages/shared/src/onboardingTemplates.ts`), kullanıcının kendi oluşturduğu kategoriler hep `standard` kalır (dayatma yok). `KategoriClient.tsx` bu alana göre ilgili paneli render ediyor. **İstisna: Alışkanlık Bırakma kategori değil GÖREV bazlı** (`tasks.is_habit_break`) — herhangi bir kategorideki herhangi bir göreve uygulanabilir, `moduleType`'tan bağımsız.
  - **Alışkanlık Bırakma** (`tasks.is_habit_break`, `habit_relapses`, `habit_notes`): görev eklerken "bu bırakmaya çalıştığım bir alışkanlık" işaretlenebiliyor (`AddTaskForm.tsx`). Seri (streak) hesabı saf fonksiyon (`packages/shared/src/habits.ts` → `calculateStreak`/`fillDateRange`) ile `daily_task_logs` geçmişinden (son 120 gün) türetiliyor — ayrı bir sayaç sütunu/trigger yok. Kategori sayfasında "Alışkanlık Takibi" bölümü (`HabitBreakCard.tsx`): seri rozeti + "Nüksetmeyi Kaydet" (bugünü nükset işaretler, görev o gün tamamlanmışsa geri alır) + motivasyon notu ekle/sil. **Kısmen doğrulandı:** servis-role script'iyle `fetchTaskCompletionDates`'in PostgREST embed sorgusu (`daily_task_logs!inner(completed)` + `.eq("daily_task_logs.task_id", ...)`) ve `calculateStreak` sentetik veriyle test edildi, doğru sonuç verdi (test verisi temizlendi) — ama gerçek UI akışı (buton tıklama vb.) hiç denenmedi.
  - **Ders & Odaklanma — Pomodoro** (`focus_sessions`, `PomodoroTimer.tsx`): 25dk sabit sayaç, tamamlanınca oturum kaydediliyor, bugünkü toplam gösteriliyor. Duruş/dikkat takibi (kamera) HENÜZ YOK.
  - **Finans & Portföy** (`portfolio_transactions`, `PortfolioPanel.tsx`): manuel alım/satım kaydı (sembol, hisse/altın, alış/satış, miktar, birim fiyat, tarih), maliyet bazlı pozisyon özeti (`calculatePositions`, ortalama maliyet). **Canlı fiyat/anlık kâr-zarar HENÜZ YOK** — NosyAPI entegrasyonu (bkz. yukarıdaki karar) ayrı bir iş, bu turda yapılmadı.
  - **Sağlıklı Beslenme** (`meal_logs`, `MealLogPanel.tsx` + `/api/meal-analysis` + `src/lib/ai/meal-analysis.ts`): yemek fotoğrafı Claude vision'a (`claude-opus-5`) gönderilip kalori/protein/karbonhidrat/yağ tahmini alınıyor, **fotoğrafın kendisi hiçbir yerde saklanmıyor** (sadece analiz sonucu `meal_logs`'a yazılıyor — sesli notla aynı "dosya değil deşifre edilmiş veri" prensibi). Manuel giriş de mümkün (fotoğrafsız).
  - **Stil & Giyim** (`outfit_logs`, `OutfitGallery.tsx`): **projedeki ilk Supabase Storage kullanımı** — yeni `outfit-photos` bucket'ı (private, `{user_id}/{dosya}` klasör konvansiyonuyla RLS), fotoğraflar `createSignedUrl` ile (1 saatlik) gösteriliyor. Galeri grid, not ekleme, silme (DB satırı + storage dosyası birlikte siliniyor).
  - **Dijital Gelişim** (`digital_focus_logs`, `DigitalFocusPanel.tsx`): tamamen elle giriş (site adı + dakika), bugünkü toplam gösteriliyor — otomatik takip yok (yukarıdaki teknik kısıt kararı).
  - **Spor & Vücut** (`workout_sets`, `WorkoutLogPanel.tsx`): set/tekrar/ağırlık girişi, egzersiz bazlı gruplanmış bugünkü setler. **Kamera tabanlı vücut/yüz analizi HENÜZ YOK** — bilinçli olarak sona bırakıldı (en yeni teknik alan + en hassas veri türü, ayrıca opt-in/kapatılabilir olması gerekiyor).
- **Sekme başlığı (tab title) mimari düzeltmesi:** Tüm (app) sayfaları artık ince bir sunucu bileşeni (`page.tsx`, gerçek Next.js `metadata` export ediyor) + asıl arayüzü taşıyan ayrı bir client bileşenine (`XClient.tsx`) bölündü — önceki `useEffect` tabanlı `document.title` çözümü Next.js'in kendi metadata senkronizasyonuyla yarışıp kayboluyordu. Kategori sayfası özel: `generateMetadata` içinde sadece kategori adı için ayrı, hafif, RLS korumalı bir sunucu sorgusu var (`src/app/(app)/kategori/[slug]/page.tsx`). Bilinen kalan küçük sorun: kategoriler arası geçişte başlık ~1sn eski kalıp sonra güncelleniyor (bkz. hafıza notu — önbellekleme ile ileride çözülecek, kritik değil).

**Ertelenmiş, unutulmasın (acil değil, sırayla dönülecek):**
- Resend e-posta doğrulaması sadece sandbox modda (kendi test e-postana gidiyor) — gerçek kullanıcılara açmadan önce özel domain doğrulanmalı.
- **Bilinen kapsam eksiği:** `weekly_reviews` ve `monthly_reviews` tabloları şemada var ve skor formülü (bkz. bölüm 5) bunların cevaplarıyla haftalık/aylık skoru ayarlamayı öngörüyor, ama bu cevapları toplayan bir ekran/UI henüz yok.
- **Mimari — client-side veri çekme gecikmesi (en son yapılacak, kullanıcı bilerek erteledi):** `AppDataProvider` hâlâ tüm ana veriyi (kategoriler, görevler, günlük not) tarayıcıda `useEffect` ile çekiyor — sekme başlığı sorunu ayrıca (server metadata ile) çözüldü ama bu genel mimari sorun (kısa "yükleniyor" anı) hâlâ duruyor. Kapsamı geniş, Faz 1'in EN SONUNA bırakıldı.
- **Haftalık/Aylık AI rapor otomatik arşivleme:** Bilinçli ertelendi. Plan: **haftalık** ~18-19 Ağustos 2026, **aylık** ~11 Eylül 2026 civarı ele alınacak. Kullanıcı tekrar gündeme getirmeden başlatma.
- **Kategori URL'leri okunur değil** (`/kategori/<uuid>`) — kullanıcı fark etti, "ileride" dedi, isterse okunur slug sistemi (ayrı DB sütunu + üretim/çakışma mantığı) kurulabilir.
- **Prod'a deploy edilince yapılacak:** Vercel proje ayarlarına `CRON_SECRET` ve `SUPABASE_SERVICE_ROLE_KEY` environment variable olarak eklenmesi gerekiyor — unutulursa cron 401 ile başarısız olur. (Bu adım muhtemelen tamamlandı, cron manuel testte çalıştı — ama otomatik gece tetiklenmesi hâlâ doğrulanmadı.)
- **Google ile giriş kurulumu (2026-08-20, kullanıcı bilinçli erteledi):** Mobil kodu tamam (`giris.tsx`/`kayit.tsx`'teki "Google ile devam et" butonu UI'da duruyor, `signInWithGoogle` yazıldı) ama Google Cloud + Supabase tarafındaki 3 kurulum adımı (bkz. yukarıdaki "Google ile giriş" notu) **bilinçli olarak ileriye ertelendi** — kullanıcı isteyene kadar bu adımları tekrar gündeme getirme, buton öylece dursun (tıklanırsa hata döner, bu bilinen ve kabul edilmiş bir durum).
