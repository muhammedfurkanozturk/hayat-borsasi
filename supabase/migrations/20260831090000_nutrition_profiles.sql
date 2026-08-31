-- Sağlıklı Beslenme — Su hedefi + Kalori Takibi kişisel profili tek tabloda.
-- Kategori bazlı (water_logs/fasting_sessions ile aynı desen): bir kullanıcı
-- birden fazla "nutrition" kategorisi açarsa her biri kendi profiline sahip
-- olabilir. Kalori hedefi (BMR/TDEE) burada SAKLANMIYOR — weight/height/age/
-- sex/goal'dan her seferinde canlı hesaplanıyor (packages/shared), kilo
-- güncellenince hedefin bayatlamaması için.
create table if not exists public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null unique references public.categories (id) on delete cascade,
  water_goal_ml integer,
  weight_kg numeric,
  height_cm numeric,
  age integer,
  sex text check (sex in ('male', 'female')),
  goal text check (goal in ('maintain', 'gain', 'lose')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nutrition_profiles enable row level security;
create index if not exists nutrition_profiles_user_id_idx on public.nutrition_profiles (user_id);

drop policy if exists "nutrition_profiles_select_own" on public.nutrition_profiles;
create policy "nutrition_profiles_select_own" on public.nutrition_profiles
  for select using (auth.uid() = user_id);
drop policy if exists "nutrition_profiles_insert_own" on public.nutrition_profiles;
create policy "nutrition_profiles_insert_own" on public.nutrition_profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "nutrition_profiles_update_own" on public.nutrition_profiles;
create policy "nutrition_profiles_update_own" on public.nutrition_profiles
  for update using (auth.uid() = user_id);
drop policy if exists "nutrition_profiles_delete_own" on public.nutrition_profiles;
create policy "nutrition_profiles_delete_own" on public.nutrition_profiles
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.nutrition_profiles to authenticated;
grant select, insert, update, delete on public.nutrition_profiles to service_role;

notify pgrst, 'reload schema';
