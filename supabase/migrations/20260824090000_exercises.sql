-- Spor & Vücut modülü haftalık sürükle-bırak sistemine geçti: egzersiz
-- adı artık serbest metin/sabit dropdown değil, kullanıcının kendi
-- oluşturduğu kalıcı bir "hareket kütüphanesi" (meals tablosuyla aynı
-- desen — kullanıcı özelleştirir, dayatma yok). workout_sets tablosuna
-- hiç dokunulmadı, sadece hangi tarihe kaydedileceği artık haftanın
-- günlerine sürükle-bırakla belirleniyor.
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;
create index if not exists exercises_user_id_idx on public.exercises (user_id);
create index if not exists exercises_category_id_idx on public.exercises (category_id);

drop policy if exists "exercises_select_own" on public.exercises;
create policy "exercises_select_own" on public.exercises
  for select using (auth.uid() = user_id);
drop policy if exists "exercises_insert_own" on public.exercises;
create policy "exercises_insert_own" on public.exercises
  for insert with check (auth.uid() = user_id);
drop policy if exists "exercises_update_own" on public.exercises;
create policy "exercises_update_own" on public.exercises
  for update using (auth.uid() = user_id);
drop policy if exists "exercises_delete_own" on public.exercises;
create policy "exercises_delete_own" on public.exercises
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.exercises to service_role;

notify pgrst, 'reload schema';
