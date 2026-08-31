-- Bölüm 2d + 2e (Sağlıklı Beslenme kapsamlı düzeltme turu, 2026-08-28):
--
-- 2d) Aynı yemek bir öğüne iki kez sürüklenince yan yana iki ayrı kart
--     oluşuyordu — meal_logs'a bir "quantity" (miktar) çarpanı eklendi,
--     aynı saved_food_id + meal_id + date zaten varsa yeni satır yerine
--     bu satırın quantity'si artırılacak (uygulama tarafı,
--     insertMealLogFromSavedFood).
--
-- 2e) "Sık Yapılan Öğünler" — kullanıcının bir öğünün o anki içeriğini
--     (birden çok saved_foods parçası) isimli bir şablon olarak kaydedip
--     tek tıkla başka bir güne/öğüne uygulayabilmesi için.

alter table public.meal_logs
  add column if not exists quantity numeric not null default 1;

create table if not exists public.meal_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.meal_presets enable row level security;
create index if not exists meal_presets_user_id_idx on public.meal_presets (user_id);
create index if not exists meal_presets_category_id_idx on public.meal_presets (category_id);

drop policy if exists "meal_presets_select_own" on public.meal_presets;
create policy "meal_presets_select_own" on public.meal_presets
  for select using (auth.uid() = user_id);
drop policy if exists "meal_presets_insert_own" on public.meal_presets;
create policy "meal_presets_insert_own" on public.meal_presets
  for insert with check (auth.uid() = user_id);
drop policy if exists "meal_presets_update_own" on public.meal_presets;
create policy "meal_presets_update_own" on public.meal_presets
  for update using (auth.uid() = user_id);
drop policy if exists "meal_presets_delete_own" on public.meal_presets;
create policy "meal_presets_delete_own" on public.meal_presets
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.meal_presets to authenticated;
grant select, insert, update, delete on public.meal_presets to service_role;

-- roadmap_nodes/workout_template_items ile aynı desen: join'li RLS yerine
-- her satırda kendi user_id'si — sorgu ve policy daha basit kalıyor.
create table if not exists public.meal_preset_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preset_id uuid not null references public.meal_presets (id) on delete cascade,
  saved_food_id uuid not null references public.saved_foods (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.meal_preset_items enable row level security;
create index if not exists meal_preset_items_preset_id_idx on public.meal_preset_items (preset_id);
create index if not exists meal_preset_items_user_id_idx on public.meal_preset_items (user_id);

drop policy if exists "meal_preset_items_select_own" on public.meal_preset_items;
create policy "meal_preset_items_select_own" on public.meal_preset_items
  for select using (auth.uid() = user_id);
drop policy if exists "meal_preset_items_insert_own" on public.meal_preset_items;
create policy "meal_preset_items_insert_own" on public.meal_preset_items
  for insert with check (auth.uid() = user_id);
drop policy if exists "meal_preset_items_delete_own" on public.meal_preset_items;
create policy "meal_preset_items_delete_own" on public.meal_preset_items
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.meal_preset_items to authenticated;
grant select, insert, delete on public.meal_preset_items to service_role;

notify pgrst, 'reload schema';
