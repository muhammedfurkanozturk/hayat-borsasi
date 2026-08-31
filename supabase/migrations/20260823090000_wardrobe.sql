-- Stil & Giyim modülü baştan tasarlandı: eski "kombin fotoğrafı + not"
-- galerisi (outfit_logs, hâlâ şemada duruyor ama artık hiçbir kod
-- kullanmıyor) yerine parça bazlı gardırop + AI kombin puanlama sistemi.

-- ---------------------------------------------------------------------------
-- clothing_items — "Gardırobum": tek tek yüklenen giysi parçaları
-- ---------------------------------------------------------------------------
create table if not exists public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  photo_path text not null,
  photo_mime text not null default 'image/jpeg',
  ai_label text not null default '',
  created_at timestamptz not null default now()
);

alter table public.clothing_items enable row level security;
create index if not exists clothing_items_user_id_idx on public.clothing_items (user_id);
create index if not exists clothing_items_category_id_idx on public.clothing_items (category_id);

drop policy if exists "clothing_items_select_own" on public.clothing_items;
create policy "clothing_items_select_own" on public.clothing_items
  for select using (auth.uid() = user_id);
drop policy if exists "clothing_items_insert_own" on public.clothing_items;
create policy "clothing_items_insert_own" on public.clothing_items
  for insert with check (auth.uid() = user_id);
drop policy if exists "clothing_items_delete_own" on public.clothing_items;
create policy "clothing_items_delete_own" on public.clothing_items
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.clothing_items to authenticated;
grant select, insert, delete on public.clothing_items to service_role;

-- ---------------------------------------------------------------------------
-- outfits — "Kombinlerim": kaydedilmiş, AI tarafından puanlanmış kombinler
-- ---------------------------------------------------------------------------
create table if not exists public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null default '',
  ai_score integer check (ai_score between 1 and 10),
  ai_comment text,
  created_at timestamptz not null default now()
);

alter table public.outfits enable row level security;
create index if not exists outfits_user_id_idx on public.outfits (user_id);
create index if not exists outfits_category_id_idx on public.outfits (category_id);

drop policy if exists "outfits_select_own" on public.outfits;
create policy "outfits_select_own" on public.outfits
  for select using (auth.uid() = user_id);
drop policy if exists "outfits_insert_own" on public.outfits;
create policy "outfits_insert_own" on public.outfits
  for insert with check (auth.uid() = user_id);
drop policy if exists "outfits_delete_own" on public.outfits;
create policy "outfits_delete_own" on public.outfits
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.outfits to authenticated;
grant select, insert, delete on public.outfits to service_role;

-- ---------------------------------------------------------------------------
-- outfit_items — çoktan-çoğa junction (bir parça birden çok kombinde
-- kullanılabilir, kombine eklenmek parçayı gardıroptan "tüketmez")
-- ---------------------------------------------------------------------------
create table if not exists public.outfit_items (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  clothing_item_id uuid not null references public.clothing_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (outfit_id, clothing_item_id)
);

alter table public.outfit_items enable row level security;
create index if not exists outfit_items_user_id_idx on public.outfit_items (user_id);
create index if not exists outfit_items_clothing_item_id_idx on public.outfit_items (clothing_item_id);

drop policy if exists "outfit_items_select_own" on public.outfit_items;
create policy "outfit_items_select_own" on public.outfit_items
  for select using (auth.uid() = user_id);
drop policy if exists "outfit_items_insert_own" on public.outfit_items;
create policy "outfit_items_insert_own" on public.outfit_items
  for insert with check (auth.uid() = user_id);
drop policy if exists "outfit_items_delete_own" on public.outfit_items;
create policy "outfit_items_delete_own" on public.outfit_items
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.outfit_items to authenticated;
grant select, insert, delete on public.outfit_items to service_role;

-- ---------------------------------------------------------------------------
-- clothing-photos — private Storage bucket, outfit-photos ile aynı desen
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('clothing-photos', 'clothing-photos', false)
  on conflict (id) do nothing;

drop policy if exists "clothing_photos_select_own" on storage.objects;
create policy "clothing_photos_select_own" on storage.objects
  for select using (bucket_id = 'clothing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "clothing_photos_insert_own" on storage.objects;
create policy "clothing_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'clothing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "clothing_photos_delete_own" on storage.objects;
create policy "clothing_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'clothing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
