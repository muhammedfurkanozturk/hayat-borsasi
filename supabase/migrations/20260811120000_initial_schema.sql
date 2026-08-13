-- Hayat Borsası — ilk şema
-- CLAUDE.md bölüm 4'teki veri modelinin birebir karşılığı.
-- Her tabloda RLS aktif, her politika auth.uid() = user_id kuralına dayanıyor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles — auth.users ile 1-1
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Kullanıcı',
  is_pro boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Yeni bir auth.users satırı oluşunca otomatik profiles satırı açar.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Kullanıcı'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null default 'star',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create index categories_user_id_idx on public.categories (user_id);

create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create type public.task_frequency as enum ('daily', 'weekly', 'monthly');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  weight smallint not null default 5 check (weight between 1 and 10),
  frequency public.task_frequency not null default 'daily',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_category_id_idx on public.tasks (category_id);

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- daily_entries
-- ---------------------------------------------------------------------------
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  note_text text not null default '',
  total_score numeric(5, 2),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.daily_entries enable row level security;
create index daily_entries_user_id_date_idx on public.daily_entries (user_id, date);

create policy "daily_entries_select_own" on public.daily_entries
  for select using (auth.uid() = user_id);
create policy "daily_entries_insert_own" on public.daily_entries
  for insert with check (auth.uid() = user_id);
create policy "daily_entries_update_own" on public.daily_entries
  for update using (auth.uid() = user_id);
create policy "daily_entries_delete_own" on public.daily_entries
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- daily_task_logs — kendi user_id'si yok, daily_entries üzerinden dolaylı korunuyor
-- ---------------------------------------------------------------------------
create table public.daily_task_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  completed boolean not null default false,
  unique (daily_entry_id, task_id)
);

alter table public.daily_task_logs enable row level security;
create index daily_task_logs_daily_entry_id_idx on public.daily_task_logs (daily_entry_id);

create policy "daily_task_logs_select_own" on public.daily_task_logs
  for select using (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );
create policy "daily_task_logs_insert_own" on public.daily_task_logs
  for insert with check (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );
create policy "daily_task_logs_update_own" on public.daily_task_logs
  for update using (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );
create policy "daily_task_logs_delete_own" on public.daily_task_logs
  for delete using (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- weekly_reviews
-- ---------------------------------------------------------------------------
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  answers jsonb not null default '{}'::jsonb,
  weekly_score numeric(5, 2),
  created_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

alter table public.weekly_reviews enable row level security;
create index weekly_reviews_user_id_idx on public.weekly_reviews (user_id);

create policy "weekly_reviews_select_own" on public.weekly_reviews
  for select using (auth.uid() = user_id);
create policy "weekly_reviews_insert_own" on public.weekly_reviews
  for insert with check (auth.uid() = user_id);
create policy "weekly_reviews_update_own" on public.weekly_reviews
  for update using (auth.uid() = user_id);
create policy "weekly_reviews_delete_own" on public.weekly_reviews
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- monthly_reviews
-- ---------------------------------------------------------------------------
create table public.monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null, -- ayın ilk günü olarak saklanır, örn. 2026-08-01
  answers jsonb not null default '{}'::jsonb,
  monthly_score numeric(5, 2),
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.monthly_reviews enable row level security;
create index monthly_reviews_user_id_idx on public.monthly_reviews (user_id);

create policy "monthly_reviews_select_own" on public.monthly_reviews
  for select using (auth.uid() = user_id);
create policy "monthly_reviews_insert_own" on public.monthly_reviews
  for insert with check (auth.uid() = user_id);
create policy "monthly_reviews_update_own" on public.monthly_reviews
  for update using (auth.uid() = user_id);
create policy "monthly_reviews_delete_own" on public.monthly_reviews
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ai_reports
-- ---------------------------------------------------------------------------
create type public.report_period_type as enum ('daily', 'weekly', 'monthly', 'yearly');

create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_type public.report_period_type not null,
  period_start date not null,
  period_end date not null,
  content_text text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_reports enable row level security;
create index ai_reports_user_id_idx on public.ai_reports (user_id);

create policy "ai_reports_select_own" on public.ai_reports
  for select using (auth.uid() = user_id);
create policy "ai_reports_insert_own" on public.ai_reports
  for insert with check (auth.uid() = user_id);
create policy "ai_reports_delete_own" on public.ai_reports
  for delete using (auth.uid() = user_id);
