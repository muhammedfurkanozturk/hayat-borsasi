-- Madde 9 (roadmap.sh keşif eki) — "Yer İşareti" (bookmark) fikri, gerçek
-- roadmap.sh'te doğrulanamadı (WebFetch araştırmasında görünmedi) ama
-- kullanıcının kendi isteğinde açıkça istendiği için eklendi: 97+ düğümlük
-- büyük bir ağaçta önemli konulara hızlı erişim için. Madde 8'deki
-- is_milestone'dan (başarı/kilometre taşı anlamı) KASITLI OLARAK ayrı bir
-- alan — bookmark "sonra bakacağım", milestone "bunu önemsiyorum/bitirdim
-- diye işaretliyorum" anlamına geliyor, ikisi farklı amaçlar.HE
alter table public.roadmap_nodes
  add column if not exists bookmarked boolean not null default false;

notify pgrst, 'reload schema';



