-- Alt görevler (subtasks) — bir görevin altında opsiyonel, günlük takip
-- edilen alt maddeler. tasks/daily_task_logs ile birebir aynı desen:
-- subtasks tanım tablosu + daily_subtask_logs günlük işaretleme tablosu.

create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subtasks enable row level security;
create index subtasks_task_id_idx on public.subtasks (task_id);
create index subtasks_user_id_idx on public.subtasks (user_id);

create policy "subtasks_select_own" on public.subtasks
  for select using (auth.uid() = user_id);
create policy "subtasks_insert_own" on public.subtasks
  for insert with check (auth.uid() = user_id);
create policy "subtasks_update_own" on public.subtasks
  for update using (auth.uid() = user_id);
create policy "subtasks_delete_own" on public.subtasks
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.subtasks to authenticated;

-- ---------------------------------------------------------------------------
-- daily_subtask_logs — kendi user_id'si yok, daily_entries üzerinden dolaylı korunuyor
-- ---------------------------------------------------------------------------
create table public.daily_subtask_logs (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries (id) on delete cascade,
  subtask_id uuid not null references public.subtasks (id) on delete cascade,
  completed boolean not null default false,
  unique (daily_entry_id, subtask_id)
);

alter table public.daily_subtask_logs enable row level security;
create index daily_subtask_logs_daily_entry_id_idx on public.daily_subtask_logs (daily_entry_id);

create policy "daily_subtask_logs_select_own" on public.daily_subtask_logs
  for select using (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );
create policy "daily_subtask_logs_insert_own" on public.daily_subtask_logs
  for insert with check (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );
create policy "daily_subtask_logs_update_own" on public.daily_subtask_logs
  for update using (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );
create policy "daily_subtask_logs_delete_own" on public.daily_subtask_logs
  for delete using (
    exists (
      select 1 from public.daily_entries de
      where de.id = daily_entry_id and de.user_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.daily_subtask_logs to authenticated;

notify pgrst, 'reload schema';
