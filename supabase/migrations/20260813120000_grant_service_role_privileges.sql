-- authenticated rolüyle aynı sorun service_role için de geçerliymiş:
-- RLS'i bypass etse bile Postgres, tabloya temel GRANT olmadan erişim
-- vermiyor ("permission denied for table ..."). Gece cron job'ı
-- (service_role ile RLS'siz çalışıyor) tüm kullanıcıların verisini
-- okuyabilmek için bu GRANT'lere ihtiyaç duyuyor.

grant usage on schema public to service_role;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.categories to service_role;
grant select, insert, update, delete on public.tasks to service_role;
grant select, insert, update, delete on public.subtasks to service_role;
grant select, insert, update, delete on public.daily_entries to service_role;
grant select, insert, update, delete on public.daily_task_logs to service_role;
grant select, insert, update, delete on public.daily_subtask_logs to service_role;
grant select, insert, update, delete on public.weekly_reviews to service_role;
grant select, insert, update, delete on public.monthly_reviews to service_role;
grant select, insert, update, delete on public.ai_reports to service_role;

notify pgrst, 'reload schema';
