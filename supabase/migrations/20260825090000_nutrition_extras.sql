-- Sağlıklı Beslenme modülüne 2 yeni ek özellik: su içme takibi ve aralıklı
-- oruç zamanlayıcısı (piyasa araştırması sonrası kullanıcı onaylı öneri
-- listesinden, bkz. CLAUDE.md). meal_logs/meals tablolarına dokunulmadı.

-- ---------------------------------------------------------------------------
-- water_logs — her satır tek bir "bardak ekle" olayı (meal_logs ile aynı
-- desen: upsert yok, sadece insert/delete, günün toplamı istemci tarafında
-- toplanır)
-- ---------------------------------------------------------------------------
create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  date date not null,
  amount_ml integer not null check (amount_ml > 0),
  created_at timestamptz not null default now()
);

alter table public.water_logs enable row level security;
create index if not exists water_logs_user_id_idx on public.water_logs (user_id);
create index if not exists water_logs_category_id_idx on public.water_logs (category_id);

drop policy if exists "water_logs_select_own" on public.water_logs;
create policy "water_logs_select_own" on public.water_logs
  for select using (auth.uid() = user_id);
drop policy if exists "water_logs_insert_own" on public.water_logs;
create policy "water_logs_insert_own" on public.water_logs
  for insert with check (auth.uid() = user_id);
drop policy if exists "water_logs_delete_own" on public.water_logs;
create policy "water_logs_delete_own" on public.water_logs
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.water_logs to authenticated;
grant select, insert, delete on public.water_logs to service_role;

-- ---------------------------------------------------------------------------
-- fasting_sessions — start/stop akışı: başlarken bir satır insert edilir
-- (end_at null), durdurulunca aynı satır update edilir (end_at set edilir)
-- — bu yüzden (habit_relapses dersinden) UPDATE policy + grant de eklendi.
-- ---------------------------------------------------------------------------
create table if not exists public.fasting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  start_at timestamptz not null default now(),
  end_at timestamptz,
  target_hours numeric(4, 1) not null default 16,
  created_at timestamptz not null default now()
);

alter table public.fasting_sessions enable row level security;
create index if not exists fasting_sessions_user_id_idx on public.fasting_sessions (user_id);
create index if not exists fasting_sessions_category_id_idx on public.fasting_sessions (category_id);

drop policy if exists "fasting_sessions_select_own" on public.fasting_sessions;
create policy "fasting_sessions_select_own" on public.fasting_sessions
  for select using (auth.uid() = user_id);
drop policy if exists "fasting_sessions_insert_own" on public.fasting_sessions;
create policy "fasting_sessions_insert_own" on public.fasting_sessions
  for insert with check (auth.uid() = user_id);
drop policy if exists "fasting_sessions_update_own" on public.fasting_sessions;
create policy "fasting_sessions_update_own" on public.fasting_sessions
  for update using (auth.uid() = user_id);
drop policy if exists "fasting_sessions_delete_own" on public.fasting_sessions;
create policy "fasting_sessions_delete_own" on public.fasting_sessions
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.fasting_sessions to authenticated;
grant select, insert, update, delete on public.fasting_sessions to service_role;

notify pgrst, 'reload schema';
