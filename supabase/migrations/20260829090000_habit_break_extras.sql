-- "Alışkanlık Bırakma" zenginleştirmesi (kullanıcı onaylı, piyasa
-- araştırması sonrası — Quitzilla/Delust'tan ilham, kod/tasarım
-- kopyalanmadı). Not: relapse'de geçmiş verinin silinmesi diye bir sorun
-- YOKTU (kod incelemesiyle doğrulandı, bkz. CLAUDE.md) — bu migration
-- sadece yeni özellikler ekliyor, mevcut habit_relapses/habit_notes/
-- daily_task_logs mantığına dokunmuyor.

-- ---------------------------------------------------------------------------
-- tasks — para/zaman tasarrufu hesaplayıcısı (Quitzilla'dan ilham).
-- is_habit_break ile aynı desen: habit-özel alanlar da tasks'ta, sadece
-- is_habit_break=true satırlarda anlamlı.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.habit_cost_period as enum ('day', 'week', 'month');
exception when duplicate_object then null;
end $$;

alter table public.tasks
  add column if not exists habit_cost_amount numeric(10, 2) check (habit_cost_amount is null or habit_cost_amount >= 0),
  add column if not exists habit_cost_period public.habit_cost_period;

-- ---------------------------------------------------------------------------
-- habit_rewards — Quitzilla'daki "tasarrufa bağlı özel ödül" fikri.
-- "Ulaşıldı mı" durumu DB'de tutulmuyor (achieved_at yok) — istemci
-- tarafında canlı hesaplanan tasarruf tutarıyla target_amount kıyaslanarak
-- türetiliyor, ekstra bir yazma/senkronizasyon akışı gerektirmiyor.
-- ---------------------------------------------------------------------------
create table if not exists public.habit_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  title text not null,
  target_amount numeric(10, 2) not null check (target_amount > 0),
  created_at timestamptz not null default now()
);

alter table public.habit_rewards enable row level security;
create index if not exists habit_rewards_task_id_idx on public.habit_rewards (task_id);
create index if not exists habit_rewards_user_id_idx on public.habit_rewards (user_id);

drop policy if exists "habit_rewards_select_own" on public.habit_rewards;
create policy "habit_rewards_select_own" on public.habit_rewards
  for select using (auth.uid() = user_id);
drop policy if exists "habit_rewards_insert_own" on public.habit_rewards;
create policy "habit_rewards_insert_own" on public.habit_rewards
  for insert with check (auth.uid() = user_id);
drop policy if exists "habit_rewards_delete_own" on public.habit_rewards;
create policy "habit_rewards_delete_own" on public.habit_rewards
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.habit_rewards to authenticated;
grant select, insert, delete on public.habit_rewards to service_role;

notify pgrst, 'reload schema';
