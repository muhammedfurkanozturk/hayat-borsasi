-- "Kötü Alışkanlıklar" artık görev bazlı bir bayrak (tasks.is_habit_break +
-- AddTaskForm'daki checkbox) değil, kendi başına bir kategori modülü.
-- Görev seviyesindeki is_habit_break sütunu ve mevcut habit_relapses/
-- habit_notes tabloları aynen kullanılmaya devam ediyor — sadece bu
-- kategori tipindeki bir kategoriye eklenen HER görev otomatik olarak
-- is_habit_break=true ile oluşturuluyor (bkz. HabitTrackerPanel).
alter type public.category_module_type add value if not exists 'habit';

notify pgrst, 'reload schema';
