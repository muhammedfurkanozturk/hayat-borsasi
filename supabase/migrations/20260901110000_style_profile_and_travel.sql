-- Stil & Giyim — Acloset'ten ilham (2026-08-29). AI Stilist'in ten tonu/
-- vücut tipini (TAMAMEN OPSİYONEL, zorlanmıyor) dikkate alabilmesi için
-- küçük bir profil tablosu — nutrition_profiles ile aynı desen (category_id
-- unique, tek satır).
create table if not exists public.style_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null unique references public.categories (id) on delete cascade,
  skin_tone text,
  body_type text,
  updated_at timestamptz not null default now()
);

alter table public.style_profiles enable row level security;
create index if not exists style_profiles_user_id_idx on public.style_profiles (user_id);

drop policy if exists "style_profiles_select_own" on public.style_profiles;
create policy "style_profiles_select_own" on public.style_profiles
  for select using (auth.uid() = user_id);
drop policy if exists "style_profiles_insert_own" on public.style_profiles;
create policy "style_profiles_insert_own" on public.style_profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "style_profiles_update_own" on public.style_profiles;
create policy "style_profiles_update_own" on public.style_profiles
  for update using (auth.uid() = user_id);

grant select, insert, update on public.style_profiles to authenticated;
grant select, insert, update on public.style_profiles to service_role;

notify pgrst, 'reload schema';
