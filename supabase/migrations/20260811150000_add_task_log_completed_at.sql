-- Saatlik skor grafiği (Günlük görünüm) için, görevin o gün tam olarak ne
-- zaman işaretlendiğini tutuyoruz.
alter table public.daily_task_logs
  add column completed_at timestamptz;
