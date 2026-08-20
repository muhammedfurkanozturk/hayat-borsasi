-- upsertRelapse (packages/shared/src/supabase/habits.ts) aynı güne ikinci
-- kez basılırsa ON CONFLICT (task_id, date) DO UPDATE kullanıyor — bu,
-- INSERT yetkisi yetmez, UPDATE policy + grant de gerektirir. İlk
-- migration'da (20260820140000) bu unutulmuştu, servis-role script'iyle
-- doğrularken yakalandı. İdempotent, güvenle tekrar çalıştırılabilir.

drop policy if exists "habit_relapses_update_own" on public.habit_relapses;
create policy "habit_relapses_update_own" on public.habit_relapses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant update on public.habit_relapses to authenticated;
grant update on public.habit_relapses to service_role;

notify pgrst, 'reload schema';
