# DESIGN.md — Hayat Borsası Tasarım Sistemi

Bu dosya, projenin görsel tasarım kararlarını ve **neden** öyle karar verildiğini belgeler. Kod tabanındaki `CLAUDE.md` mimari/ürün kararlarını tutar; bu dosya sadece görsel katmanı kapsar. İlk uygulama 2026-08-31'de Dashboard'da yapıldı, kullanıcı testinde kontrast sorunu bulunup aynı gün düzeltildi, ardından renk/tipografi/tıklama-hissi site geneline yayıldı.

## Kutucuk kontrastı — kullanıcı testinde bulunan gerçek sorun

İlk revizyonda `--surface`/`--border-soft` zemine (`--background`) çok yakındı — kutucuklar ekranda neredeyse hiç seçilmiyordu, ve `.card-lift:active`'in tek başına `translateY(-1px)` ile sağladığı tıklama geri bildirimi yetersiz hissettiriyordu. Kullanıcı gerçek tarayıcıda test edip bunu bildirdi. Düzeltme:
- `--surface`: `#0c0d10` → `#17181d`, `--border`: `#2c2d31` → `#4a4b52`, `--border-soft`: `#18191c` → `#28292e` — hepsi belirgin şekilde daha açık, zeminden net ayrışıyor.
- `--shadow-card`'daki üst ışık çizgisi opaklığı 0.07 → 0.13.
- `CategoryTile.tsx`'in dış çerçevesi `border` (1px) → `border-2` (2px) — projedeki diğer ikincil kart bileşenleriyle (ExerciseCard, HabitBreakCard vb.) tutarlı.
- `.card-lift:active`'e `scale(0.98)` eklendi (`.btn`'nin zaten yaptığı gibi) — gerçek bir "bas" hissi için, sadece 1px kaymak yetmiyordu. Bu sınıf 6 sayfada zaten paylaşıldığı için düzeltme otomatik olarak her yere yayıldı.

## Neden bu revizyon gerekliydi

Önceki sistem "koyu tema + borsa estetiği" ilkesine sadıktı ama teşhis şuydu: neredeyse-siyah arka plan (`#040506`) + tek parlak neon vurgu (camgöbeği `#0ad1eb`) + hero bölgesinde köşede bulanık bir radial-gradient glow — bu üçü birleşince jenerik "koyu SaaS" kalıbının ta kendisiydi, sadece rengi cyan'dı. Ayrıca `next/font/google`'dan (Geist) sistem font yığınına acil bir geçiş yapılmıştı (ağ erişimi sorunuyla ilgili bir çökmeyi çözmek için, bkz. CLAUDE.md) — bu da sitenin **hiç karakterli tipografisi kalmamasına** yol açmıştı. Layout tarafında ise `rounded-2xl border shadow-card p-5` deseni her yerde tekrarlanıyordu — shadcn/ui'nin Card bileşeninin elle yeniden üretimi, hiyerarşisiz.

## Renk

| Token | Değer | Rol |
|---|---|---|
| `--background` | `#08090b` | Ana zemin — nötr neredeyse-siyah (lacivert değil), öncekiyle aynı ruhta |
| `--accent` (**birincil vurgu**) | `#d9713a` | Bakır/turuncu-kızıl |
| `--pro` (**ikincil vurgu**) | `#f5b400` | Altın — Pro/Altın tier için zaten vardı, sistemde resmen "ikincil vurgu" rolüne yükseltildi |
| `--positive` | `#36d39f` | Artış — değişmedi |
| `--negative` | `#f43e5c` | Azalış — değişmedi |
| `--foreground` / `--muted` | `#e9e6e0` / `#948f86` | Soğuk mavi-gri yerine sıcak, ticker-kağıdı tonları |

**Birincil vurgu neden bakır, neden cyan değil:** Cyan hem "koyu zemin + tek neon vurgu" klişesinin imzasıydı hem de `--positive`'in yeşiliyle aynı soğuk/teknolojik aileden geliyordu — göz ikisini ayırt etmiyordu. Bakır; 1867'nin mekanik ticker-tape makinelerinin pirinç/bakır mekanizmasına bir gönderme, gerçek borsa tarihine bağlı, rastgele seçilmemiş bir referans. Altın (Pro) ve kırmızı (azalış) arasında net, üçüncü bir sıcak ton.

**Köşedeki bulanık glow tamamen kaldırıldı** (`body{}`'deki `radial-gradient` — bkz. commit diff) — bu, klişenin en belirgin parmak iziydi, işlevsiz bir dekorasyondu. Yerini imza öğe (aşağıda) aldı.

## Tipografi

**IBM Plex Sans (başlık + gövde) + IBM Plex Mono (rakam/veri)** — `next/font/local` ile **self-hosted** (`src/app/fonts/*.woff2`, `latin-ext` alt kümesi — Türkçe karakterleri kapsıyor). 3 ağırlık (400/500/600 Sans, 400/500 Mono) repoya gömülü.

**Neden self-hosted, neden next/font/google değil:** Önceki next/font/google (Geist) kurulumu, build/dev sırasında `fonts.googleapis.com`'a bağlanmaya çalışıp ağ erişimi olmadığında Next.js'in worker havuzunu bozup "Jest worker encountered N child process exceptions" çökmesine yol açıyordu (bkz. CLAUDE.md). Font dosyaları artık repoda gömülü olduğu için **hiçbir build/dev anında dış ağa istek atılmıyor** — bu sorun kalıcı olarak ortadan kalktı.

**Neden IBM Plex:** Gerçek finans/mainframe terminal hesaplama tarihiyle bağı var (IBM, erken dönem borsa/bankacılık sistemlerinin donanımını üretiyordu) — rastgele "trend" bir seçim değil. OFL lisanslı (yasal olarak repoya gömülebilir). Plex Mono tabular (hizalı) rakamlarla geliyor — borsa verisi hizalaması için tasarlanmış.

## Layout — iki katmanlı köşe/yoğunluk sistemi

Her şey aynı "kart" değil, iki net katman var:
- **Konteyner/navigasyon** (sayfa kartları, modal'lar): yumuşak köşe (`rounded-2xl`), önceki gibi kalıyor.
- **Veri** (görev listeleri, işlem geçmişi vb.): `.ledger-row` sınıfı — keskin/minimal köşe, tam kart çerçevesi yerine ince alt-çizgi ayırıcı, sık dikey boşluk. `globals.css`'e eklendi, ilk uygulaması `DailyChecklist.tsx`'te (kategori-başına ayrı kutu yerine tek akan liste).

```
┌─┬───────────────────────────────────────────┐
│ │ ▲THY 2.1%  ▼BEL -0.4%  ▲SPOR 5.0% ···      │ ← imza öğe (ticker şeridi)
│S├───────────────────────────────────────────┤
│i│      72.4                                  │ ← tek "nefes alan" hero sayı
│d│      ▲ +3.2 dün'e göre                     │
│e│  ───────────────────────────────────────   │
│b│  SAĞLIK    84%  ████████░░  ▲1.2           │ ← .ledger-row, sık
│a│  FİNANS    61%  ██████░░░░  ▼0.4           │
│r│  SPOR      73%  ███████░░░  ▲2.0           │
└─┴───────────────────────────────────────────┘
```

## İmza öğe: Market Ticker

`src/components/dashboard/MarketTicker.tsx` — sayfa başlığının hemen altında, kesintisiz kayan bir şerit (`globals.css` → `.ticker-track`, `prefers-reduced-motion`'da otomatik duruyor, üstüne gelince duraklıyor). Kategori kutucuklarıyla **aynı yıllık katkı oranı** (`delta`) metriğini borsa formatında (▲/▼ + %) gösteriyor — ikinci bir "günlük değişim" metriği icat etmedi, çünkü CLAUDE.md'de bilinçli olarak dünle-kıyaslamadan yıllık-katkıya geçilmişti (bölüm 9), tutarlılık için aynı sayı kullanılıyor. Dekoratif/yinelenen olduğu için `aria-hidden="true"` — ekran okuyucular kategori kutucuklarındaki asıl veriyi zaten okuyor.

## Klişe kontrolü (öz-eleştiri)

- **Kalıp 1 (krem+serif+turuncu):** Eşleşmiyor — koyu zemin, serif yok.
- **Kalıp 2 (siyah+tek neon+köşe glow):** En büyük risk buydu. Cyan→bakır tek başına yeterli olmazdı (formül aynı kalırdı) — bu yüzden glow kaldırıldı VE tek vurgu yerine işlevsel olarak ayrılmış üç renk ailesi kuruldu (bakır=marka/etkileşim, altın=prim, yeşil/kırmızı=SADECE veri).
- **Kalıp 3 (gazete/keskin köşe):** Defter-satırı fikri kısmen ondan ödünç alındı ama her yer keskinleşmedi — sadece veri katmanında.
- **Jenerik shadcn kart:** Asıl teşhis edilen sorundu — iki katmanlı köşe sistemi doğrudan çözüyor.

## Kategori kimlikleri — Açık/Koyu tema senkronizasyonu (kritik düzeltme, 2026-09-03)

Kategori Bazlı Tasarım Farklılaştırma turunda (bkz. CLAUDE.md, 2026-08-31/09-02) 8 kategorinin her biri kendi referans-uygulama kimliğini (Yazio/Freeletics/Whering/Robinhood/Duolingo/Miro/Headspace/Polarsteps) aldı — ama bu ilk uygulamada 6/8 kategori, zemin/kart/metin renklerini **genel site temasından (açık/koyu) bağımsız, tek bir moda sabit** kodlamıştı (bazıları hep koyu — Finans/Robinhood, Seyahat/Polarsteps —, bazıları hep açık — Yol Haritam/Miro, Ders&Odaklanma —, biri sabit sıcak açık — Alışkanlık Bırakma/Headspace). Kullanıcı siteyi açık temaya alınca bu kategoriler "asılı kalmış" — genel geçişe uymayan — bir renk gösteriyordu.

**Kural netleştirildi:** Kategori KİMLİĞİ (imza vurgu rengi + kompozisyon/his) ile kategori TEMASI (açık/koyu) birbirinden bağımsız iki eksen. Kimlik sabit kalır, tema genel site anahtarına uyar. Örnek: Finans & Portföy'ün Robinhood kimliği (saf zemin + neon yeşil) her iki modda da "Robinhood" hissi verir — ama açık modda zemin beyaza, koyu modda saf siyaha döner; neon yeşil vurgu HER İKİ modda da aynı kalır.

**Uygulanan teknik desen** (6 dosyanın hepsinde aynı): kök-token-ezme sabiti (`{ "--background": ..., "--surface": ... }`) `Record<"dark"|"light", Record<string,string>>` bir palet objesine dönüştürüldü, component `useTheme()` (`src/lib/theme-context.tsx`) çağırıp `PALETTE[theme]`'i `style` prop'una spread ediyor. Vurgu/pozitif/negatif renkler (marka kimliğinin kendisi) paletin DIŞINDA, ayrı bir sabit obje olarak kalıyor — hiçbir zaman tema ile değişmiyor.

| Kategori | Kimlik | Vurgu (sabit) | Değişen |
|---|---|---|---|
| Spor & Vücut | Freeletics | mavi `#2e7dff` | zemin/kart/metin |
| Finans & Portföy | Robinhood | neon yeşil `#00e676` (+ pozitif/negatif) | zemin/kart/metin |
| Ders & Odaklanma (Checklist) | Duolingo | turuncu `#ff9600` | zemin/kart/metin |
| Ders & Odaklanma (Pomodoro) | Duolingo | mavi `#1cb0f6` | zemin/kart/metin |
| Yol Haritam | Miro | leylak `#a78bfa` | zemin/kart/metin ("beyaz tahta" ↔ "koyu tahta") |
| Alışkanlık Bırakma | Headspace | terracotta `#c1502e` | sıcak "kağıt" zemin ↔ sıcak koyu zemin |
| Seyahat | Polarsteps | teal `#2dd4bf` (+ pembe-kırmızı) | gece-lacivert ↔ açık gök-mavisi zemin |

**Dokunulmayan 2 kategori:** Sağlıklı Beslenme (Yazio) ve Stil & Giyim (Whering) zaten SADECE `--accent`/`--accent-soft`/`--accent-foreground`'ı eziyordu, zemin/kart token'larına hiç dokunmuyordu — bu yüzden baştan beri genel site temasına doğru şekilde uyuyorlardı, değişiklik gerekmedi.

**Kartların kendi iç renk sistemleri bu değişiklikten ETKİLENMEDİ** — örn. Alışkanlık Bırakma'daki her kartın `hashHabitColor(task.id)` ile deterministik kendi rengi (`HabitBreakCard.tsx`) ayrı bir sistem, task.id'ye bağlı, site temasından zaten bağımsız olması GEREKEN bir tasarım kararı.

**Doğrulama:** Her kategori tek tek hem açık hem koyu modda gerçek tarayıcıda test edildi — JS `getComputedStyle` ile zemin renginin doğru palete geçtiği kanıtlandı (ekran görüntüsü tek başına güvenilmez: küçük/JPEG-sıkıştırılmış bir screenshot'ta orta tonlu koyu gri, çok daha koyu bir sidebar'ın yanında "açık" gibi görünebiliyor — bu turda birkaç kez yanlış pozitif "bozuk" izlenimine yol açtı, computed style ile çözüldü). Sonunda 8 kategorinin hepsi açık modda, sonra hepsi koyu modda tek tek gezilip görsel olarak da doğrulandı.

## Kapsam / durum

- ✅ Renk token'ları (kontrast düzeltmesi dahil), tipografi, glow kaldırma, `.card-lift` tıklama hissi — **site genelinde**, otomatik olarak her sayfada (CSS custom property'ler + paylaşılan sınıflar sayesinde, ayrı ayrı sayfa güncellemesi gerekmedi). Dashboard + Ayarlar sayfalarında gerçek tarayıcıda görsel olarak doğrulandı.
- ⏳ Ticker + ledger-row layout deseni (kutu-içinde-kutu yerine ince ayırıcılı liste) — **şimdilik sadece Dashboard'un görev listesinde** (`DailyChecklist.tsx`). Diğer sayfalardaki liste/tablo benzeri alanlara (Kategori sayfası görev listesi, işlem geçmişleri, Günlük arşivi vb.) istenirse ayrı bir adımda yayılabilir — bu, onlarca dosyayı tek tek değiştirmeyi gerektiren ayrı bir iş, kullanıcıya sorulmadan yapılmadı.
- Silinen kod yok — sadece `layout.tsx` (font kaynağı), `globals.css` (token değerleri + glow kaldırma + yeni utility'ler), `CategoryTile.tsx` (kontrast), `DailyChecklist.tsx` (layout) değişti.
