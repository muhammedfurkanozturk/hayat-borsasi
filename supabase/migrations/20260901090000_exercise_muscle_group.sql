-- Spor & Vücut — MuscleWiki'den ilham alınan Kas Haritası özelliği
-- (2026-08-29). Kullanıcının kendi `exercises` tablosu (tamamen serbest
-- metin, "dayatma yok") ile yeni statik `exerciseLibrary.ts` referans
-- kütüphanesi arasında köprü: kullanıcı isterse kendi hareketini bir kas
-- grubuna OPSİYONEL olarak etiketleyebilsin, kas haritasındaki hacim
-- ısı-haritası bunu kullanır. Etiketlenmeyen hareketler ısı haritasına
-- katkı yapmaz, ana akış (haftalık sürükle-bırak) hiç etkilenmez.
alter table public.exercises add column if not exists primary_muscle text;

notify pgrst, 'reload schema';
