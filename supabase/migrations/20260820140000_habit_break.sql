-- Alışkanlık Bırakma modülü: hangi görevlerin "bırakılmaya çalışılan
-- alışkanlık" olduğunu işaretlemek için bir bayrak, artı seri (streak)
-- hesaplamak için nüksetme kaydı ve motivasyon notları.

alter table public.tasks
  add column is_habit_break boolean not null default false;

-- Bir günde nüksetme kaydı — task_id + date başına en fazla bir kayıt.
-- daily_task_logs'tan ayrı tutuluyor çünkü opsiyonel bir not (neden
-- nüksettiğin) taşıyor ve sadece bırakma tipi görevlerde anlamlı.
create table public.habit_relapses (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  note_text text not null default '',
  created_at timestamptz not null default now(),
  unique (task_id, date)
);

alter table public.habit_relapses enable row level security;
create index habit_relapses_task_id_idx on public.habit_relapses (task_id);
create index habit_relapses_user_id_idx on public.habit_relapses (user_id);

create policy "habit_relapses_select_own" on public.habit_relapses
  for select using (auth.uid() = user_id);
create policy "habit_relapses_insert_own" on public.habit_relapses
  for insert with check (auth.uid() = user_id);
create policy "habit_relapses_delete_own" on public.habit_relapses
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.habit_relapses to authenticated;

-- Serbest biçimli motivasyon notları — bir bırakma görevine bağlı, zaman
-- damgalı mini günlük.
create table public.habit_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now()
);

alter table public.habit_notes enable row level security;
create index habit_notes_task_id_idx on public.habit_notes (task_id);
create index habit_notes_user_id_idx on public.habit_notes (user_id);

create policy "habit_notes_select_own" on public.habit_notes
  for select using (auth.uid() = user_id);
create policy "habit_notes_insert_own" on public.habit_notes
  for insert with check (auth.uid() = user_id);
create policy "habit_notes_delete_own" on public.habit_notes
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.habit_notes to authenticated;

notify pgrst, 'reload schema';
