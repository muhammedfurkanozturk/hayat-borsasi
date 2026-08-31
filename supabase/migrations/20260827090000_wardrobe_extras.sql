-- "Stil & Giyim" zenginleştirmesi (kullanıcı onaylı, piyasa araştırması
-- sonrası — Indyx / Stylegen AI / SELION.AI / Cladwell'den ilham, kod/
-- tasarım kopyalanmadı). clothing_items/outfits/outfit_items'ın yerine
-- geçmiyor, üstüne ekleniyor.

-- ---------------------------------------------------------------------------
-- clothing_items — yapılandırılmış AI etiketleri (SELION.AI'den ilham,
-- tüm alanlar değil en değerli 4'ü: kategori/renk/mevsim/resmiyet) +
-- opsiyonel fiyat (cost-per-wear hesaplamak için, Indyx'ten ilham).
-- Mevcut satırlar için hepsi nullable — geriye dönük uyumlu, eski
-- ai_label tek metin alanı da kalmaya devam ediyor.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.clothing_category as enum ('ust', 'alt', 'elbise', 'ayakkabi', 'dis_giyim', 'aksesuar');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.clothing_season as enum ('yaz', 'kis', 'ara_mevsim', 'tum_mevsim');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.clothing_formality as enum ('gunluk', 'spor', 'is', 'ozel');
exception when duplicate_object then null;
end $$;

alter table public.clothing_items
  add column if not exists category public.clothing_category,
  add column if not exists color text,
  add column if not exists season public.clothing_season,
  add column if not exists formality public.clothing_formality,
  add column if not exists price_try numeric(10, 2) check (price_try is null or price_try >= 0);

-- ---------------------------------------------------------------------------
-- outfit_wears — bir kombinin "bugün giyildi" olarak işaretlendiği her
-- olay (Indyx'teki giyilme takvimi/cost-per-wear fikri). outfit_items
-- ile aynı desen: sadece insert/delete, kendi user_id'si var.
-- ---------------------------------------------------------------------------
create table if not exists public.outfit_wears (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.outfit_wears enable row level security;
create index if not exists outfit_wears_user_id_idx on public.outfit_wears (user_id);
create index if not exists outfit_wears_outfit_id_idx on public.outfit_wears (outfit_id);

drop policy if exists "outfit_wears_select_own" on public.outfit_wears;
create policy "outfit_wears_select_own" on public.outfit_wears
  for select using (auth.uid() = user_id);
drop policy if exists "outfit_wears_insert_own" on public.outfit_wears;
create policy "outfit_wears_insert_own" on public.outfit_wears
  for insert with check (auth.uid() = user_id);
drop policy if exists "outfit_wears_delete_own" on public.outfit_wears;
create policy "outfit_wears_delete_own" on public.outfit_wears
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.outfit_wears to authenticated;
grant select, insert, delete on public.outfit_wears to service_role;

notify pgrst, 'reload schema';
