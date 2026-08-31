-- Sağlık modülü: öğün gruplama + sürükle-bırak + gerçek yemek fotoğrafı
-- saklama (bilinçli istisna — CLAUDE.md'deki "fotoğrafın kendisi hiçbir
-- yerde saklanmıyor" kuralına artık meal_logs için bir istisna var, ayrı
-- bir private Storage bucket + RLS ile, outfit-photos ile birebir aynı
-- desen).

-- ---------------------------------------------------------------------------
-- meals — kullanıcının kendi tanımladığı, kalıcı/tekrar kullanılan öğün
-- kovaları (gün bazlı değil — hangi güne ait olduğu zaten meal_logs.date'te)
-- ---------------------------------------------------------------------------
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;
create index if not exists meals_user_id_idx on public.meals (user_id);
create index if not exists meals_category_id_idx on public.meals (category_id);

drop policy if exists "meals_select_own" on public.meals;
create policy "meals_select_own" on public.meals
  for select using (auth.uid() = user_id);
drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own" on public.meals
  for insert with check (auth.uid() = user_id);
drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own" on public.meals
  for update using (auth.uid() = user_id);
drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own" on public.meals
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.meals to service_role;

-- ---------------------------------------------------------------------------
-- meal_logs genişletmesi — hangi öğüne sürüklendiği, gerçek fotoğrafın
-- storage yolu, porsiyon açıklaması
-- ---------------------------------------------------------------------------
alter table public.meal_logs
  add column if not exists meal_id uuid references public.meals (id) on delete set null,
  add column if not exists photo_path text,
  add column if not exists portion_text text;

create index if not exists meal_logs_meal_id_idx on public.meal_logs (meal_id);

-- Sürükle-bırak meal_id'yi UPDATE ile değiştiriyor — önceki turda
-- (habit_relapses) bu unutulup ayrı bir migration'la düzeltilmişti, bu
-- sefer baştan ekleniyor.
drop policy if exists "meal_logs_update_own" on public.meal_logs;
create policy "meal_logs_update_own" on public.meal_logs
  for update using (auth.uid() = user_id);

grant update on public.meal_logs to authenticated;
grant update on public.meal_logs to service_role;

-- ---------------------------------------------------------------------------
-- meal-photos — private Storage bucket, outfit-photos ile aynı desen
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('meal-photos', 'meal-photos', false)
  on conflict (id) do nothing;

drop policy if exists "meal_photos_select_own" on storage.objects;
create policy "meal_photos_select_own" on storage.objects
  for select using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "meal_photos_insert_own" on storage.objects;
create policy "meal_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "meal_photos_delete_own" on storage.objects;
create policy "meal_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
