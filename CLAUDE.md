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

---

## 3. Teknoloji Stack'i (KESİN — değiştirilmeyecek)

| Katman | Teknoloji |
|---|---|
| Frontend framework | **Next.js** (App Router kullan, Pages Router değil) |
| Dil | **TypeScript** (JavaScript değil — tüm dosyalar `.ts` / `.tsx`) |
| UI / Stil | **Tailwind CSS** + gerekirse `shadcn/ui` bileşenleri |
| Grafik / çizgi endeks görselleştirme | **Recharts** |
| Veritabanı + Auth + Backend | **Supabase** (PostgreSQL) |
| Kimlik doğrulama yöntemi | Supabase Auth — **sadece e-posta/şifre** (OAuth/Google şimdilik yok) |
| Sesli not → yazı | Web Speech API (tarayıcı yerleşik) — ses dosyası saklanmaz, sadece deşifre edilen metin kaydedilir |
| Yapay zeka / rapor üretimi | **Claude API (Anthropic)** — `/v1/messages` endpoint |
| Ödeme (Faz 2'de) | iyzico |
| Hosting | Vercel |
| Dil / lokalizasyon | Sadece **Türkçe** (ilk hedef kitle Türkiye) — tüm arayüz metinleri Türkçe olacak |

**Kullanma:** .NET, Firebase, MongoDB, Redux (gerekmedikçe — React Context/Zustand yeterli), CSS-in-JS kütüphaneleri (styled-components vb.), Pages Router.

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

---

## 8. Yapılmaması Gerekenler

- Kullanıcıya zorunlu/varsayılan görev **dayatma** — her şey opsiyonel ve düzenlenebilir olmalı.
- Ses kaydını dosya olarak saklama — sadece deşifre edilmiş metin saklanır.
- API anahtarlarını (Supabase service role key, Claude API key) client tarafında kullanma veya repoya committe etme — `.env.local` içinde tutulacak ve `.gitignore`'da olacak.
- Faz 1 kapsamında olmayan özellikleri (ödeme, mobil, Pro kısıtlamaları) önceden inşa etmeye çalışma — sırayla ilerlenecek.

---

## 9. Şu Anki Durum / Sıradaki Görev

> Bu bölümü proje ilerledikçe güncelle. Son güncelleme: 2026-08-13.

**Tamamlanmış (Faz 1 çekirdeği):**
- Tüm temel ekranlar (Dashboard, Kategori/Görev, Günlükler, AI Rapor, Karakter Kartı, Ayarlar) + herkese açık landing sayfası
- Gerçek Supabase Auth (e-posta/şifre) + RLS'li 9 tablo şeması + gerekli GRANT'ler (`authenticated` ve `service_role` için ayrı ayrı — ikisi de default olarak GRANT almıyor, migration'da elle verilmesi gerekiyor)
- Tüm uygulama verisi (kategori/görev/alt görev/günlük log/not/rapor) gerçek Supabase sorgularına taşındı, mock veri yok
- Görev sıklığı (Günlük/Haftalık/Aylık) + alt görevler (subtasks) sistemi, optimistic UI güncellemeleriyle
- AI Rapor ekranı: "Anlık [Dönem] Özetle" ile ekranda gösterilen, arşive kaydedilmeyen önizleme üretir (`claude-opus-5`, server-side `src/lib/ai/claude.ts` + `src/app/api/rapor/route.ts`)
- **Gece yarısı otomatik AI rapor arşivleme (cron) — TAMAMLANDI:** Her gece Türkiye saatiyle 00:00'da (`vercel.json` → `0 21 * * *` UTC) Vercel Cron, `CRON_SECRET` ile korunan `/api/cron/daily-report` route'unu çağırır. Bu route service_role client'ı (`src/lib/supabase/admin.ts`) ile tüm kullanıcıları gezer (`src/lib/ai/daily-archive.ts`), o günü aktif olan (bir `daily_entries` kaydı olan) her kullanıcı için gerçek skor/delta/kategori kırılımını hesaplar, Claude'a gönderir ve sonucu `ai_reports`'a kaydeder. Aynı gün için tekrar tetiklenirse (`period_type=daily` + `period_start=tarih` zaten varsa) atlar — idempotent. Yerelde manuel tetiklenip uçtan uca doğrulandı (`processed`/`skipped` sayaçlarıyla). Haftalık/aylık için eşdeğer bir tetikleyici henüz yok.

**Ertelenmiş, unutulmasın (acil değil, sırayla dönülecek):**
- Haftalık/Aylık/Yıllık endeksler şu an gerçek gün-gün geçmiş ortalama yerine bugünün canlı skorunu gösteriyor — yeterli geçmiş veri (birden fazla günün `daily_task_logs` kaydı) birikince gerçek ortalama hesaplamasına geçilecek.
- Resend e-posta doğrulaması sadece sandbox modda (kendi test e-postana gidiyor) — gerçek kullanıcılara açmadan önce özel domain doğrulanmalı.
- **Bilinen kapsam eksiği:** `weekly_reviews` ve `monthly_reviews` tabloları şemada var ve skor formülü (bkz. bölüm 5) bunların cevaplarıyla haftalık/aylık skoru ayarlamayı öngörüyor, ama bu cevapları toplayan bir ekran/UI henüz yok — haftalık/aylık skor şu an sadece günlük ortalamadan hesaplanıyor, `answers` çarpan/ceza-ödül mantığı uygulanmıyor.
- **Mimari — client-side veri çekme gecikmesi (en son yapılacak, kullanıcı bilerek erteledi):** `AppDataProvider` (`src/lib/supabase/app-data-context.tsx`) tüm veriyi (kategoriler, görevler, günlük not) sayfa tarayıcıda açıldıktan sonra `useEffect` içinde Supabase'e istek atarak çekiyor — bu yüzden her sayfa açılışında kısa bir "yükleniyor" anı oluyor (şu an sadece iskelet/skeleton ile hafifletildi, kök neden çözülmedi). Gerçek çözüm: veriyi sunucu tarafında (Server Component / server-side fetch, `src/lib/supabase/server.ts` zaten var) çekip HTML'e gömmek — Next.js'in asıl gücü bu. Kapsamı geniş (Dashboard, Kategori, Günlükler, Rapor dahil neredeyse her sayfayı etkiler), bu yüzden Faz 1'in EN SONUNA bırakıldı — diğer her şey bittikten sonra yapılacak.
- **Haftalık/Aylık AI rapor otomatik arşivleme:** Günlük cron kuruldu ama hafta/ay sonu için eşdeğer bir tetikleyici (schedule + agregasyon mantığı) henüz yok. Bilinçli olarak ertelendi — gerçek `daily_task_logs` verisi birikmeden haftalık/aylık ortalama mantığını kurmanın/test etmenin anlamı yok. Plan: **haftalık** kısım 18-19 Ağustos 2026 (Salı/Çarşamba) civarı, yaklaşık bir haftalık gerçek günlük veri birikince ele alınacak; **aylık** kısım ~11 Eylül 2026 (bugünden 29 gün sonra) civarı, yeterli günlük/haftalık veri birikince ele alınacak. Bu tarihler gelmeden bu maddeyi proaktif başlatma — kullanıcı tekrar gündeme getirsin.
- **Prod'a deploy edilince yapılacak:** `vercel.json`'daki cron sadece Vercel'e deploy edilince gerçekten otomatik çalışır (yerelde `npm run dev` ile tetiklenmez, sadece manuel curl ile test edilebilir). Deploy edilince Vercel proje ayarlarına `CRON_SECRET` ve `SUPABASE_SERVICE_ROLE_KEY` environment variable olarak eklenmesi gerekiyor (`.env.local`'deki değerlerle aynı) — unutulursa cron 401 ile başarısız olur.
