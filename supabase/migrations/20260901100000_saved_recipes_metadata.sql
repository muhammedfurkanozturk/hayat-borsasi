-- Tarifler — KitchenAid'den ilham alınan filtreleme sistemi (2026-08-29).
-- Zorluk/öğün türü/ilham/diyet artık tarifle birlikte kaydediliyor,
-- "Tarif Listem"deki filtrelemeyi mümkün kılıyor. Hepsi nullable/varsayılan
-- boş — eski kayıtlar bu sütunlar olmadan da geçerli kalıyor.
alter table public.saved_recipes add column if not exists zorluk text;
alter table public.saved_recipes add column if not exists ogun_turu text;
alter table public.saved_recipes add column if not exists ilham text;
alter table public.saved_recipes add column if not exists diyetler jsonb not null default '[]'::jsonb;
alter table public.saved_recipes add column if not exists varyasyon_onerisi text not null default '';

notify pgrst, 'reload schema';
