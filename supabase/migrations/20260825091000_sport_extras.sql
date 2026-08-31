-- Spor & Vücut modülüne 2 yeni ek özellik: antrenman şablonları/rutinleri
-- ve vücut ölçümü (kilo) takibi (piyasa araştırması sonrası kullanıcı
-- onaylı öneri listesinden, bkz. CLAUDE.md). exercises/workout_sets
-- tablolarına dokunulmadı — kişisel rekor (PR) ve dinlenme süresi
-- zamanlayıcısı için yeni tablo gerekmiyor (workout_sets'ten türetiliyor /
-- tamamen istemci taraflı).

-- ---------------------------------------------------------------------------
-- workout_templates + workout_template_items — kullanıcının kendi
-- oluşturduğu rutinler (örn. "İtiş Günü"). item'larda kendi user_id'si var
-- (subtasks tablosuyla aynı desen — join'li RLS yerine denormalize).
-- ---------------------------------------------------------------------------
create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.workout_templates enable row level security;
create index if not exists workout_templates_user_id_idx on public.workout_templates (user_id);
create index if not exists workout_templates_category_id_idx on public.workout_templates (category_id);

drop policy if exists "workout_templates_select_own" on public.workout_templates;
create policy "workout_templates_select_own" on public.workout_templates
  for select using (auth.uid() = user_id);
drop policy if exists "workout_templates_insert_own" on public.workout_templates;
create policy "workout_templates_insert_own" on public.workout_templates
  for insert with check (auth.uid() = user_id);
drop policy if exists "workout_templates_delete_own" on public.workout_templates;
create policy "workout_templates_delete_own" on public.workout_templates
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.workout_templates to authenticated;
grant select, insert, delete on public.workout_templates to service_role;

create table if not exists public.workout_template_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  exercise_name text not null,
  sort_order integer not null default 0
);

alter table public.workout_template_items enable row level security;
create index if not exists workout_template_items_user_id_idx on public.workout_template_items (user_id);
create index if not exists workout_template_items_template_id_idx on public.workout_template_items (template_id);

drop policy if exists "workout_template_items_select_own" on public.workout_template_items;
create policy "workout_template_items_select_own" on public.workout_template_items
  for select using (auth.uid() = user_id);
drop policy if exists "workout_template_items_insert_own" on public.workout_template_items;
create policy "workout_template_items_insert_own" on public.workout_template_items
  for insert with check (auth.uid() = user_id);
drop policy if exists "workout_template_items_delete_own" on public.workout_template_items;
create policy "workout_template_items_delete_own" on public.workout_template_items
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.workout_template_items to authenticated;
grant select, insert, delete on public.workout_template_items to service_role;

-- ---------------------------------------------------------------------------
-- body_measurements — sadece kilo (gerekirse ileride başka alan eklenir)
-- ---------------------------------------------------------------------------
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  date date not null,
  weight_kg numeric(5, 2) not null check (weight_kg > 0),
  created_at timestamptz not null default now()
);

alter table public.body_measurements enable row level security;
create index if not exists body_measurements_user_id_idx on public.body_measurements (user_id);
create index if not exists body_measurements_category_id_idx on public.body_measurements (category_id);

drop policy if exists "body_measurements_select_own" on public.body_measurements;
create policy "body_measurements_select_own" on public.body_measurements
  for select using (auth.uid() = user_id);
drop policy if exists "body_measurements_insert_own" on public.body_measurements;
create policy "body_measurements_insert_own" on public.body_measurements
  for insert with check (auth.uid() = user_id);
drop policy if exists "body_measurements_delete_own" on public.body_measurements;
create policy "body_measurements_delete_own" on public.body_measurements
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.body_measurements to authenticated;
grant select, insert, delete on public.body_measurements to service_role;

notify pgrst, 'reload schema';
