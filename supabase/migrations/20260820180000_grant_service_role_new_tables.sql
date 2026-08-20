-- Bu projede hem `authenticated` hem `service_role` GRANT'i varsayılan
-- olarak almıyor, ikisine de elle verilmesi gerekiyor (bkz. CLAUDE.md
-- bölüm 9, `20260813120000_grant_service_role_privileges.sql`'deki emsal).
-- 2026-08-20'de eklenen 8 yeni tabloya sadece `authenticated` grant'i
-- verilmişti, `service_role` unutulmuştu — service-role script'iyle
-- doğrulanırken bu yakalandı. Bu dosya idempotent (GRANT'i tekrar vermek
-- hatasız bir no-op'tur), güvenle tekrar çalıştırılabilir.

grant select, insert, delete on public.habit_relapses to service_role;
grant select, insert, delete on public.habit_notes to service_role;
grant select, insert, delete on public.focus_sessions to service_role;
grant select, insert, delete on public.portfolio_transactions to service_role;
grant select, insert, delete on public.meal_logs to service_role;
grant select, insert, delete on public.outfit_logs to service_role;
grant select, insert, delete on public.digital_focus_logs to service_role;
grant select, insert, delete on public.workout_sets to service_role;

notify pgrst, 'reload schema';
