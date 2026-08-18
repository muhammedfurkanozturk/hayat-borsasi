-- Profil sayfasını genişletmek için ek, opsiyonel alanlar. Hiçbiri
-- uygulamanın başka bir yerinde işlevsel olarak kullanılmıyor — sadece
-- kullanıcının kendi profilini doldurabilmesi için.

alter table public.profiles
  add column phone text not null default '',
  add column address text not null default '',
  add column occupation text not null default '';

-- profiles tablosu üzerindeki mevcut RLS politikaları ve GRANT'ler
-- (authenticated: select/insert/update/delete) satır bazlı olduğu için yeni
-- sütunlar otomatik olarak aynı korumadan yararlanıyor, ek bir politika
-- gerekmiyor.

notify pgrst, 'reload schema';
