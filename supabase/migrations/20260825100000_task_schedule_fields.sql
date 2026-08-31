-- Habitify "Build New Habit" panelinden ilham (Bölüm 4, 2026-08-25) —
-- görev oluşturma formuna Zaman Dilimi + Başlangıç/Bitiş tarihi eklendi.
-- Habitify'daki "Goal: N times/day", "Reminders" (bildirim altyapımız yok)
-- ve "Magic Fill" (AI) bilinçli olarak alınmadı — skor formülünü
-- değiştirmeden (bkz. CLAUDE.md bölüm 5) veya sahte/işlevsiz bir kontrol
-- eklemeden yapılabilecek, düşük riskli alanlar bunlar. Mevcut RLS
-- policy'leri tasks tablosunu zaten kapsıyor, yeni policy/grant gerekmiyor.
alter table public.tasks
  add column if not exists time_of_day text[],
  add column if not exists start_date date,
  add column if not exists end_date date;

notify pgrst, 'reload schema';
