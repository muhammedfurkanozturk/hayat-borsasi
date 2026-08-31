-- Tarif Önerisi artık kaydedilebiliyor (kullanıcı isteği) — malzemeler/
-- adımlar yapılandırılmış JSON olarak tutuluyor (Claude'dan zaten bu
-- şekilde geliyor, bkz. packages/shared/src/recipe.ts).
create table if not exists public.saved_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  tarif_adi text not null,
  hazirlik_suresi text not null default '',
  pisirme_suresi text not null default '',
  porsiyon text not null default '',
  malzemeler jsonb not null default '[]'::jsonb,
  adimlar jsonb not null default '[]'::jsonb,
  sunum_onerisi text not null default '',
  created_at timestamptz not null default now()
);

alter table public.saved_recipes enable row level security;
create index if not exists saved_recipes_user_id_idx on public.saved_recipes (user_id);
create index if not exists saved_recipes_category_id_idx on public.saved_recipes (category_id);

drop policy if exists "saved_recipes_select_own" on public.saved_recipes;
create policy "saved_recipes_select_own" on public.saved_recipes
  for select using (auth.uid() = user_id);
drop policy if exists "saved_recipes_insert_own" on public.saved_recipes;
create policy "saved_recipes_insert_own" on public.saved_recipes
  for insert with check (auth.uid() = user_id);
drop policy if exists "saved_recipes_delete_own" on public.saved_recipes;
create policy "saved_recipes_delete_own" on public.saved_recipes
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.saved_recipes to authenticated;
grant select, insert, delete on public.saved_recipes to service_role;

notify pgrst, 'reload schema';
