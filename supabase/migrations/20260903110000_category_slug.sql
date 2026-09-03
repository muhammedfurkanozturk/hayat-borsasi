-- "eksikler" envanteri madde 9 — kategori URL'leri okunur değildi
-- (/kategori/<uuid>). Slug kullanıcı başına benzersiz (aynı isimde
-- kategoriler farklı kullanıcılarda çakışmasın diye global değil).
alter table public.categories
  add column if not exists slug text;

-- Var olan kategoriler için geriye dönük, basit bir slug üret (Türkçe
-- karakterleri elle çevirip boşlukları tireye çeviriyor) — aynı kullanıcının
-- aynı isimli/aynı slug'a düşen ikinci kategorisi varsa satır numarasıyla
-- ayrıştırılıyor (ör. "spor-vucut-2").
with normalized as (
  select
    id,
    user_id,
    lower(
      translate(name, 'çÇğĞıİöÖşŞüÜ', 'ccggiiooссuu')
    ) as base_lower
  from public.categories
),
slugged as (
  select
    id,
    user_id,
    regexp_replace(regexp_replace(trim(both '-' from regexp_replace(base_lower, '[^a-z0-9]+', '-', 'g')), '-+', '-', 'g'), '^$', 'kategori') as base_slug
  from normalized
),
numbered as (
  select
    id,
    user_id,
    base_slug,
    row_number() over (partition by user_id, base_slug order by id) as rn
  from slugged
)
update public.categories c
set slug = case when n.rn = 1 then n.base_slug else n.base_slug || '-' || n.rn end
from numbered n
where c.id = n.id and c.slug is null;

alter table public.categories
  alter column slug set not null,
  add constraint categories_user_slug_unique unique (user_id, slug);

notify pgrst, 'reload schema';
