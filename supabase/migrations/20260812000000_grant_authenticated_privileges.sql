-- RLS, tabloya kimin hangi SATIRLARI görebileceğini filtreler — ama
-- Postgres'te bir rolün tabloya en azından temel erişim izni (GRANT)
-- olması ayrıca gerekir. İlk şema migration'ında bunu unuttuk, bu yüzden
-- "permission denied for table ..." hatası alınıyordu.

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.daily_entries to authenticated;
grant select, insert, update, delete on public.daily_task_logs to authenticated;
grant select, insert, update, delete on public.weekly_reviews to authenticated;
grant select, insert, update, delete on public.monthly_reviews to authenticated;
grant select, insert, update, delete on public.ai_reports to authenticated;
