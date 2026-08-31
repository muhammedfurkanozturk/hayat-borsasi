-- Kaydedilen Yemekler artık kalıcı bir kütüphane (kullanıcı bulgusu:
-- havuzdan bir öğüne sürüklenince orijinal kayboluyordu/taşınıyordu,
-- oysa tekrar tekrar farklı öğünlere/günlere sürüklenebilmesi gerekiyordu).
--
-- saved_foods = kalıcı kütüphane (bir yemek fotoğrafı analiz edildiğinde/
-- elle eklendiğinde/barkodla bulunduğunda BURAYA düşer, hiç silinmez).
-- meal_logs   = bir güne/öğüne "yendi" olarak sürüklenen KOPYALAR — kendi
-- besin değeri sütunlarını taşımaya devam ediyor (her zaman join'e gerek
-- kalmasın diye), saved_food_id sadece izlenebilirlik için.

create table if not exists public.saved_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  description text not null,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  ai_summary text,
  photo_path text,
  portion_text text,
  created_at timestamptz not null default now()
);

alter table public.saved_foods enable row level security;
create index if not exists saved_foods_user_id_idx on public.saved_foods (user_id);
create index if not exists saved_foods_category_id_idx on public.saved_foods (category_id);

drop policy if exists "saved_foods_select_own" on public.saved_foods;
create policy "saved_foods_select_own" on public.saved_foods
  for select using (auth.uid() = user_id);
drop policy if exists "saved_foods_insert_own" on public.saved_foods;
create policy "saved_foods_insert_own" on public.saved_foods
  for insert with check (auth.uid() = user_id);
drop policy if exists "saved_foods_update_own" on public.saved_foods;
create policy "saved_foods_update_own" on public.saved_foods
  for update using (auth.uid() = user_id);
drop policy if exists "saved_foods_delete_own" on public.saved_foods;
create policy "saved_foods_delete_own" on public.saved_foods
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.saved_foods to authenticated;
grant select, insert, update, delete on public.saved_foods to service_role;

-- meal_logs artık SADECE bir öğüne atanmış (o gün "yendi" olarak kaydedilen)
-- kopyaları tutuyor. saved_food_id, hangi kütüphane kaydından kopyalandığını
-- işaretler (silinirse null olur — geçmiş günlük kaydı bundan etkilenmez,
-- kendi besin değeri kopyası zaten meal_logs'ta duruyor).
alter table public.meal_logs
  add column if not exists saved_food_id uuid references public.saved_foods (id) on delete set null;

create index if not exists meal_logs_saved_food_id_idx on public.meal_logs (saved_food_id);

-- meal_id'nin eski "on delete set null" davranışı, öğün silinince yemeği
-- "havuza" geri döndürüyordu — o havuz artık meal_logs'ta değil saved_foods'ta
-- yaşıyor, bu yüzden bir öğün silinince o güne ait KOPYALAR da silinmeli
-- (kütüphanedeki asıl kayıt etkilenmez). FK'yi cascade'e çeviriyoruz.
alter table public.meal_logs drop constraint if exists meal_logs_meal_id_fkey;
alter table public.meal_logs
  add constraint meal_logs_meal_id_fkey foreign key (meal_id) references public.meals (id) on delete cascade;

-- Geriye dönük veri taşıma: mevcut her meal_logs satırı için bir saved_foods
-- kopyası oluşturup saved_food_id ile bağlıyoruz (veri kaybı olmasın diye
-- HEM atanmış HEM atanmamış satırlar için) — sonra atanmamış (meal_id is
-- null, eski "havuz") satırları siliyoruz, çünkü onlar artık saved_foods'ta
-- yaşıyor.
with mapped as (
  select id as meal_log_id, gen_random_uuid() as new_saved_food_id
  from public.meal_logs
  where saved_food_id is null
),
ins as (
  insert into public.saved_foods (id, user_id, category_id, description, calories, protein_g, carbs_g, fat_g, ai_summary, photo_path, portion_text, created_at)
  select m.new_saved_food_id, ml.user_id, ml.category_id, ml.description, ml.calories, ml.protein_g, ml.carbs_g, ml.fat_g, ml.ai_summary, ml.photo_path, ml.portion_text, ml.created_at
  from mapped m
  join public.meal_logs ml on ml.id = m.meal_log_id
)
update public.meal_logs ml
set saved_food_id = m.new_saved_food_id
from mapped m
where ml.id = m.meal_log_id;

delete from public.meal_logs where meal_id is null;

notify pgrst, 'reload schema';
