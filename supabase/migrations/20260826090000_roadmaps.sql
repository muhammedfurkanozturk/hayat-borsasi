-- "Dijital Gelişim" kategorisi "Yol Haritam" konseptine dönüştürüldü
-- (kullanıcı onaylı, bkz. CLAUDE.md) — roadmap.sh'teki dallanan yol
-- haritası + checklist fikrinden ilham. categories.module_type enum'ı
-- BİLİNÇLİ OLARAK değiştirilmedi ('digital' değeri artık sadece iç kod
-- detayı, kullanıcıya hiç görünmüyor) — migration riskini azaltmak için
-- (bkz. CLAUDE.md'deki geçmiş grant/policy hataları). Roadmap ilerlemesi
-- bilinçli olarak ana günlük skor motoruna (tasks/daily_task_logs) dahil
-- edilmiyor — düğümler "bir kere tamamlanan kilometre taşı", günlük
-- tekrar eden bir görev değil; kategori kendi bağımsız "% tamamlandı"
-- göstergesini gösteriyor. Eski digital_focus_logs tablosuna dokunulmadı
-- (kod tarafında artık kullanılmıyor, veri kaybı riski almamak için tablo
-- DB'de duruyor — outfit_logs'taki emsal, bkz. CLAUDE.md).

create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.roadmaps enable row level security;
create index if not exists roadmaps_user_id_idx on public.roadmaps (user_id);
create index if not exists roadmaps_category_id_idx on public.roadmaps (category_id);

drop policy if exists "roadmaps_select_own" on public.roadmaps;
create policy "roadmaps_select_own" on public.roadmaps
  for select using (auth.uid() = user_id);
drop policy if exists "roadmaps_insert_own" on public.roadmaps;
create policy "roadmaps_insert_own" on public.roadmaps
  for insert with check (auth.uid() = user_id);
drop policy if exists "roadmaps_delete_own" on public.roadmaps;
create policy "roadmaps_delete_own" on public.roadmaps
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.roadmaps to authenticated;
grant select, insert, delete on public.roadmaps to service_role;

-- ---------------------------------------------------------------------------
-- roadmap_nodes — workout_template_items ile aynı desen: kendi user_id'si
-- var (join'li RLS yerine denormalize). parent_node_id kendine referans
-- veriyor (dallanan ağaç), kök düğümlerde null. completed elle
-- güncellendiği için (checklist tıklaması) UPDATE policy + grant de var
-- (habit_relapses dersi — sadece INSERT yetmiyordu).
-- ---------------------------------------------------------------------------
create table if not exists public.roadmap_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  parent_node_id uuid references public.roadmap_nodes (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.roadmap_nodes enable row level security;
create index if not exists roadmap_nodes_user_id_idx on public.roadmap_nodes (user_id);
create index if not exists roadmap_nodes_roadmap_id_idx on public.roadmap_nodes (roadmap_id);
create index if not exists roadmap_nodes_parent_node_id_idx on public.roadmap_nodes (parent_node_id);

drop policy if exists "roadmap_nodes_select_own" on public.roadmap_nodes;
create policy "roadmap_nodes_select_own" on public.roadmap_nodes
  for select using (auth.uid() = user_id);
drop policy if exists "roadmap_nodes_insert_own" on public.roadmap_nodes;
create policy "roadmap_nodes_insert_own" on public.roadmap_nodes
  for insert with check (auth.uid() = user_id);
drop policy if exists "roadmap_nodes_update_own" on public.roadmap_nodes;
create policy "roadmap_nodes_update_own" on public.roadmap_nodes
  for update using (auth.uid() = user_id);
drop policy if exists "roadmap_nodes_delete_own" on public.roadmap_nodes;
create policy "roadmap_nodes_delete_own" on public.roadmap_nodes
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.roadmap_nodes to authenticated;
grant select, insert, update, delete on public.roadmap_nodes to service_role;

notify pgrst, 'reload schema';
