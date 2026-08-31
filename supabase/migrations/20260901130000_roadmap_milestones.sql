-- Madde 8 (Onepin ilhamı) — Onepin'in gerçek yapısı araştırıldı (WebFetch,
-- onepin.io): "One Thing → aylık Milestone'lar → haftalık/günlük Task'lar"
-- 3 katmanlı, ZORUNLU zaman bazlı bir hiyerarşi. Bizim Yol Haritam KONU
-- bazlı bir ağaç (roadmap.sh esintili) — Onepin'in katı aylık yapısını
-- dayatmak mevcut şablonları kırardı. Bunun yerine Onepin'in ÖZÜNÜ
-- (kilometre taşı işaretleme + kişisel hedef tarih + aksiyona geçirilebilir
-- not) mevcut ağaca ekliyoruz: herhangi bir düğüm (omurga veya dal, hangi
-- derinlikte olursa olsun) "kilometre taşı" işaretlenebilir, kendi hedef
-- tarihini alabilir, kısa bir aksiyon notu taşıyabilir.
alter table public.roadmap_nodes
  add column if not exists is_milestone boolean not null default false,
  add column if not exists target_date date,
  add column if not exists action_note text;

notify pgrst, 'reload schema';
