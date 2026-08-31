-- Kullanıcı bulgusu (2026-08-28): Kategori sayfasındaki "Görevler" listesi
-- ağırlığa göre sıralanmamalı — kullanıcı hangi sırayla oluşturduysa o
-- sırada kalmalı, ve yukarı/aşağı butonlarıyla elle yeniden sıralanabilmeli.
-- Bunun için kalıcı bir "sort_order" sütunu gerekiyor (created_at, elle
-- taşımayı desteklemiyor).

alter table public.tasks add column if not exists sort_order integer;

-- Geriye dönük dolgu: mevcut her görev, kendi kategorisi içindeki mevcut
-- oluşturulma sırasını (created_at) korusun.
with ranked as (
  select id, row_number() over (partition by category_id order by created_at asc) - 1 as rn
  from public.tasks
)
update public.tasks t
set sort_order = r.rn
from ranked r
where t.id = r.id and t.sort_order is null;

notify pgrst, 'reload schema';
