-- Kullanıcı isteği (2026-08-28): Kalori Takibi sihirbazı aktivite düzeyi
-- çarpanını (TDEE hesaplaması için) sabit ×1.55 varsayıyordu, kullanıcıya
-- hiç sorulmuyordu. Artık gerçek bir adım olarak soruluyor, bu yüzden
-- kalıcı olarak saklanması gerekiyor.

alter table public.nutrition_profiles add column if not exists activity_level text;

notify pgrst, 'reload schema';
