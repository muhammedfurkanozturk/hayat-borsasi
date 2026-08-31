-- Yeni "Seyahat" kategorisi (been.app/Visited'tan ilham, kullanıcı onaylı)
-- — 4 seviyeli coğrafi drill-down (Dünya → ülke → il → ilçe →
-- kullanıcı-tanımlı "mekan"), scratch-map dolgu efekti, "Seyahat
-- Pasaportu" istatistik kartı, temalı bucket list'ler (UNESCO/milli park).
-- Vize kontrolcüsü (Madde 6) BİLİNÇLİ OLARAK kapsam dışı — bkz. CLAUDE.md.
alter type public.category_module_type add value if not exists 'travel';

-- ---------------------------------------------------------------------------
-- travel_visits — ülke/il/ilçe seviyelerindeki "ziyaret edildi" işaretleri.
-- Üç seviye TEK tabloda (level ayrımıyla) tutuluyor çünkü hepsi aynı şekle
-- sahip (bir referans koda karşı ziyaret durumu) — roadmap_nodes'taki
-- "tek tablo, denormalize user_id" felsefesiyle tutarlı. ref_code:
-- level='country' için ISO 3166-1 alpha-2 (örn. "TR"), level='province'
-- için "TR-34" gibi il plaka kodu, level='district' için
-- "TR-34:Kadıköy" gibi bileşik bir anahtar (borders-of-turkey'nin il
-- adı alanıyla eşleşecek şekilde uygulama tarafında üretiliyor).
create table if not exists public.travel_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  level text not null check (level in ('country', 'province', 'district')),
  ref_code text not null,
  visited_at date,
  note text,
  photo_url text,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, level, ref_code)
);

alter table public.travel_visits enable row level security;
create index if not exists travel_visits_user_id_idx on public.travel_visits (user_id);
create index if not exists travel_visits_category_id_idx on public.travel_visits (category_id);

drop policy if exists "travel_visits_select_own" on public.travel_visits;
create policy "travel_visits_select_own" on public.travel_visits
  for select using (auth.uid() = user_id);
drop policy if exists "travel_visits_insert_own" on public.travel_visits;
create policy "travel_visits_insert_own" on public.travel_visits
  for insert with check (auth.uid() = user_id);
drop policy if exists "travel_visits_update_own" on public.travel_visits;
create policy "travel_visits_update_own" on public.travel_visits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "travel_visits_delete_own" on public.travel_visits;
create policy "travel_visits_delete_own" on public.travel_visits
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.travel_visits to authenticated;
grant select, insert, update, delete on public.travel_visits to service_role;

-- ---------------------------------------------------------------------------
-- travel_places — Level 4: kullanıcının bir il/ilçe/ülke altında serbestçe
-- oluşturduğu "mekan" (belirli bir tarihi yer, plaj, restoran vb.),
-- kendi seçtiği ikonla (bkz. icons.tsx TRAVEL_PLACE_ICONS).
-- ---------------------------------------------------------------------------
create table if not exists public.travel_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  parent_level text not null check (parent_level in ('country', 'province', 'district')),
  parent_ref_code text not null,
  name text not null,
  icon_key text not null default 'landmark',
  visited_at date,
  note text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.travel_places enable row level security;
create index if not exists travel_places_user_id_idx on public.travel_places (user_id);
create index if not exists travel_places_category_id_idx on public.travel_places (category_id);
create index if not exists travel_places_parent_idx on public.travel_places (parent_level, parent_ref_code);

drop policy if exists "travel_places_select_own" on public.travel_places;
create policy "travel_places_select_own" on public.travel_places
  for select using (auth.uid() = user_id);
drop policy if exists "travel_places_insert_own" on public.travel_places;
create policy "travel_places_insert_own" on public.travel_places
  for insert with check (auth.uid() = user_id);
drop policy if exists "travel_places_update_own" on public.travel_places;
create policy "travel_places_update_own" on public.travel_places
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "travel_places_delete_own" on public.travel_places;
create policy "travel_places_delete_own" on public.travel_places
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.travel_places to authenticated;
grant select, insert, update, delete on public.travel_places to service_role;

-- ---------------------------------------------------------------------------
-- travel_bucket_progress — temalı bucket list'lerin (UNESCO, milli parklar)
-- işaretlenme durumu. Liste içeriğinin kendisi statik TS verisi
-- (packages/shared/src/travelThemes.ts, roadmapTemplates.ts ile aynı
-- "materialize etmeden, sadece ilerleme takip et" deseni) — bu tablo
-- SADECE hangi item_key'lerin işaretlendiğini tutuyor.
-- ---------------------------------------------------------------------------
create table if not exists public.travel_bucket_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  theme_key text not null,
  item_key text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, theme_key, item_key)
);

alter table public.travel_bucket_progress enable row level security;
create index if not exists travel_bucket_progress_user_id_idx on public.travel_bucket_progress (user_id);
create index if not exists travel_bucket_progress_category_id_idx on public.travel_bucket_progress (category_id);

drop policy if exists "travel_bucket_progress_select_own" on public.travel_bucket_progress;
create policy "travel_bucket_progress_select_own" on public.travel_bucket_progress
  for select using (auth.uid() = user_id);
drop policy if exists "travel_bucket_progress_insert_own" on public.travel_bucket_progress;
create policy "travel_bucket_progress_insert_own" on public.travel_bucket_progress
  for insert with check (auth.uid() = user_id);
drop policy if exists "travel_bucket_progress_delete_own" on public.travel_bucket_progress;
create policy "travel_bucket_progress_delete_own" on public.travel_bucket_progress
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.travel_bucket_progress to authenticated;
grant select, insert, delete on public.travel_bucket_progress to service_role;

-- ---------------------------------------------------------------------------
-- travel-photos — Level 4 mekanlara (ve ileride ülke/il/ilçe notlarına)
-- opsiyonel fotoğraf, clothing-photos/meal-photos ile aynı private bucket
-- + kullanıcı-klasörü RLS deseni.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('travel-photos', 'travel-photos', false)
  on conflict (id) do nothing;

drop policy if exists "travel_photos_select_own" on storage.objects;
create policy "travel_photos_select_own" on storage.objects
  for select using (bucket_id = 'travel-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "travel_photos_insert_own" on storage.objects;
create policy "travel_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'travel-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "travel_photos_delete_own" on storage.objects;
create policy "travel_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'travel-photos' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
