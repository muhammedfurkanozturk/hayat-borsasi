-- "eksikler" envanteri madde 5 — Yol Haritam'a bilinçli ertelenmiş "zaman
-- etiketi" (ör. "3 gün önce tamamlandı") eklendi. `completed boolean`
-- NE ZAMAN true olduğunu tutmuyordu — bu sütun toggleRoadmapNode her
-- tamamlanma/geri-alma anında set/null ediliyor (bkz. packages/shared).
alter table public.roadmap_nodes
  add column if not exists completed_at timestamptz;

notify pgrst, 'reload schema';
