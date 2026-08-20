-- Kalan 6 hazır kategori modülü için şema: Ders & Odaklanma (Pomodoro),
-- Finans & Portföy, Sağlıklı Beslenme, Stil & Giyim, Dijital Gelişim,
-- Spor & Vücut (set/tekrar/ağırlık — kamera tabanlı vücut analizi HENÜZ
-- YOK, bilinçli olarak sonraya bırakıldı, bkz. CLAUDE.md bölüm 9).
--
-- Bir kategorinin hangi özel modülü açtığını `categories.module_type`
-- belirliyor — sadece onboarding şablonlarından oluşturulan kategorilere
-- set ediliyor, kullanıcının kendi oluşturduğu kategoriler her zaman
-- 'standard' kalır (dayatma yok, bkz. bölüm 1).
--
-- Bu dosya baştan sona idempotent yazıldı — önceki bir migration'da
-- (habit_break) bir kısmi uygulama denemesinde bazı ifadeler çalışıp
-- bazıları çalışmadan kesilmişti; aynı riski burada almamak için tablo/
-- sütun/index'ler IF NOT EXISTS, policy'ler DROP POLICY IF EXISTS +
-- CREATE, enum'lar (IF NOT EXISTS desteklemiyor) exception-yutan DO
-- bloklarıyla yazıldı. Dosya güvenle tekrar tekrar çalıştırılabilir.

do $$ begin
  create type public.category_module_type as enum (
    'standard', 'focus', 'finance', 'nutrition', 'style', 'digital', 'sport'
  );
exception when duplicate_object then null;
end $$;

alter table public.categories
  add column if not exists module_type public.category_module_type not null default 'standard';

-- ---------------------------------------------------------------------------
-- focus_sessions — Ders & Odaklanma / Pomodoro
-- ---------------------------------------------------------------------------
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  duration_minutes integer not null check (duration_minutes > 0),
  completed_at timestamptz not null default now()
);

alter table public.focus_sessions enable row level security;
create index if not exists focus_sessions_user_id_idx on public.focus_sessions (user_id);
create index if not exists focus_sessions_category_id_idx on public.focus_sessions (category_id);

drop policy if exists "focus_sessions_select_own" on public.focus_sessions;
create policy "focus_sessions_select_own" on public.focus_sessions
  for select using (auth.uid() = user_id);
drop policy if exists "focus_sessions_insert_own" on public.focus_sessions;
create policy "focus_sessions_insert_own" on public.focus_sessions
  for insert with check (auth.uid() = user_id);
drop policy if exists "focus_sessions_delete_own" on public.focus_sessions;
create policy "focus_sessions_delete_own" on public.focus_sessions
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.focus_sessions to authenticated;

-- ---------------------------------------------------------------------------
-- portfolio_transactions — Finans & Portföy (manuel alım/satım kaydı;
-- canlı fiyat/kâr-zarar HENÜZ YOK — NosyAPI entegrasyonu bekliyor, bkz.
-- CLAUDE.md bölüm 9)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.portfolio_asset_type as enum ('stock', 'gold');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.portfolio_transaction_type as enum ('buy', 'sell');
exception when duplicate_object then null;
end $$;

create table if not exists public.portfolio_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  symbol text not null,
  asset_type public.portfolio_asset_type not null,
  transaction_type public.portfolio_transaction_type not null,
  quantity numeric(18, 6) not null check (quantity > 0),
  price_per_unit numeric(18, 2) not null check (price_per_unit >= 0),
  transaction_date date not null,
  created_at timestamptz not null default now()
);

alter table public.portfolio_transactions enable row level security;
create index if not exists portfolio_transactions_user_id_idx on public.portfolio_transactions (user_id);
create index if not exists portfolio_transactions_category_id_idx on public.portfolio_transactions (category_id);

drop policy if exists "portfolio_transactions_select_own" on public.portfolio_transactions;
create policy "portfolio_transactions_select_own" on public.portfolio_transactions
  for select using (auth.uid() = user_id);
drop policy if exists "portfolio_transactions_insert_own" on public.portfolio_transactions;
create policy "portfolio_transactions_insert_own" on public.portfolio_transactions
  for insert with check (auth.uid() = user_id);
drop policy if exists "portfolio_transactions_delete_own" on public.portfolio_transactions;
create policy "portfolio_transactions_delete_own" on public.portfolio_transactions
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.portfolio_transactions to authenticated;

-- ---------------------------------------------------------------------------
-- meal_logs — Sağlıklı Beslenme (fotoğraf saklanmaz, sadece Claude vision
-- analizinin sonucu — bkz. CLAUDE.md bölüm 8'deki "dosya değil deşifre
-- edilmiş veri" prensibi, sesli not için de aynı kural geçerli)
-- ---------------------------------------------------------------------------
create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  date date not null,
  description text not null default '',
  calories numeric(7, 1),
  protein_g numeric(7, 1),
  carbs_g numeric(7, 1),
  fat_g numeric(7, 1),
  ai_summary text,
  created_at timestamptz not null default now()
);

alter table public.meal_logs enable row level security;
create index if not exists meal_logs_user_id_idx on public.meal_logs (user_id);
create index if not exists meal_logs_category_id_idx on public.meal_logs (category_id);

drop policy if exists "meal_logs_select_own" on public.meal_logs;
create policy "meal_logs_select_own" on public.meal_logs
  for select using (auth.uid() = user_id);
drop policy if exists "meal_logs_insert_own" on public.meal_logs;
create policy "meal_logs_insert_own" on public.meal_logs
  for insert with check (auth.uid() = user_id);
drop policy if exists "meal_logs_delete_own" on public.meal_logs;
create policy "meal_logs_delete_own" on public.meal_logs
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.meal_logs to authenticated;

-- ---------------------------------------------------------------------------
-- outfit_logs — Stil & Giyim (bu kategori istisna: galeri fikri fotoğrafın
-- gerçekten saklanmasını gerektiriyor, bu yüzden ilk kez bir Storage
-- bucket'ı kuruyoruz, kullanıcı klasörü bazlı RLS ile)
-- ---------------------------------------------------------------------------
create table if not exists public.outfit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  date date not null,
  note_text text not null default '',
  photo_path text,
  created_at timestamptz not null default now()
);

alter table public.outfit_logs enable row level security;
create index if not exists outfit_logs_user_id_idx on public.outfit_logs (user_id);
create index if not exists outfit_logs_category_id_idx on public.outfit_logs (category_id);

drop policy if exists "outfit_logs_select_own" on public.outfit_logs;
create policy "outfit_logs_select_own" on public.outfit_logs
  for select using (auth.uid() = user_id);
drop policy if exists "outfit_logs_insert_own" on public.outfit_logs;
create policy "outfit_logs_insert_own" on public.outfit_logs
  for insert with check (auth.uid() = user_id);
drop policy if exists "outfit_logs_delete_own" on public.outfit_logs;
create policy "outfit_logs_delete_own" on public.outfit_logs
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.outfit_logs to authenticated;

insert into storage.buckets (id, name, public)
  values ('outfit-photos', 'outfit-photos', false)
  on conflict (id) do nothing;

-- Dosya yolu konvansiyonu: {user_id}/{dosya_adı} — klasörün ilk parçası
-- auth.uid() değilse erişim/yükleme reddediliyor.
drop policy if exists "outfit_photos_select_own" on storage.objects;
create policy "outfit_photos_select_own" on storage.objects
  for select using (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "outfit_photos_insert_own" on storage.objects;
create policy "outfit_photos_insert_own" on storage.objects
  for insert with check (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "outfit_photos_delete_own" on storage.objects;
create policy "outfit_photos_delete_own" on storage.objects
  for delete using (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- digital_focus_logs — Dijital Gelişim (elle giriş — tarayıcıdan siteler
-- arası otomatik takip teknik olarak mümkün değil, bkz. CLAUDE.md bölüm 9)
-- ---------------------------------------------------------------------------
create table if not exists public.digital_focus_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  date date not null,
  site_name text not null,
  minutes integer not null check (minutes > 0),
  created_at timestamptz not null default now()
);

alter table public.digital_focus_logs enable row level security;
create index if not exists digital_focus_logs_user_id_idx on public.digital_focus_logs (user_id);
create index if not exists digital_focus_logs_category_id_idx on public.digital_focus_logs (category_id);

drop policy if exists "digital_focus_logs_select_own" on public.digital_focus_logs;
create policy "digital_focus_logs_select_own" on public.digital_focus_logs
  for select using (auth.uid() = user_id);
drop policy if exists "digital_focus_logs_insert_own" on public.digital_focus_logs;
create policy "digital_focus_logs_insert_own" on public.digital_focus_logs
  for insert with check (auth.uid() = user_id);
drop policy if exists "digital_focus_logs_delete_own" on public.digital_focus_logs;
create policy "digital_focus_logs_delete_own" on public.digital_focus_logs
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.digital_focus_logs to authenticated;

-- ---------------------------------------------------------------------------
-- workout_sets — Spor & Vücut (set/tekrar/ağırlık; kamera tabanlı vücut/
-- yüz analizi HENÜZ YOK, bilinçli olarak sona bırakıldı)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  exercise_name text not null,
  set_number integer not null default 1,
  reps integer not null check (reps > 0),
  weight_kg numeric(6, 2),
  date date not null,
  created_at timestamptz not null default now()
);

alter table public.workout_sets enable row level security;
create index if not exists workout_sets_user_id_idx on public.workout_sets (user_id);
create index if not exists workout_sets_category_id_idx on public.workout_sets (category_id);

drop policy if exists "workout_sets_select_own" on public.workout_sets;
create policy "workout_sets_select_own" on public.workout_sets
  for select using (auth.uid() = user_id);
drop policy if exists "workout_sets_insert_own" on public.workout_sets;
create policy "workout_sets_insert_own" on public.workout_sets
  for insert with check (auth.uid() = user_id);
drop policy if exists "workout_sets_delete_own" on public.workout_sets;
create policy "workout_sets_delete_own" on public.workout_sets
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.workout_sets to authenticated;

notify pgrst, 'reload schema';
