-- EK GÖREV 3 (2026-09-01, tüm sistem denetimi) — gerçek, bulunan bir hata:
-- `clothing_items` tablosunda hiç UPDATE policy/grant'i yoktu ama
-- `updateClothingItem` (packages/shared/src/supabase/wardrobe.ts) ve
-- `ClothingItemDetailModal.tsx`'teki "AI'ın önerdiği alanları elle düzelt"
-- akışı (2026-08-27 zenginleştirmesi) zaten bunu çağırıyordu — kullanıcı
-- bir parçayı düzenleyip kaydetmeye çalıştığında sessizce RLS/grant
-- hatası alıyordu. `habit_relapses`'te daha önce yaşanan AYNI hata sınıfı
-- (bkz. 20260820190000_fix_habit_relapses_update.sql) tekrarlanmış.
drop policy if exists "clothing_items_update_own" on public.clothing_items;
create policy "clothing_items_update_own" on public.clothing_items
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant update on public.clothing_items to authenticated;
grant update on public.clothing_items to service_role;

notify pgrst, 'reload schema';
