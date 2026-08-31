-- "Ders & Odaklanma" zenginleştirmesi (kullanıcı onaylı, piyasa
-- araştırması sonrası — Prodpod/Chronoid'ten ilham, kod/tasarım
-- kopyalanmadı). focus_sessions'ın yerine geçmiyor, üstüne ekleniyor.

-- ---------------------------------------------------------------------------
-- focus_subjects — Prodpod'daki (piyasa araştırması) ders/konu bazlı seans
-- takibi fikri. meals/exercises ile aynı desen: kullanıcının kendi
-- oluşturduğu kalıcı bir kütüphane.
-- ---------------------------------------------------------------------------
create table if not exists public.focus_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.focus_subjects enable row level security;
create index if not exists focus_subjects_user_id_idx on public.focus_subjects (user_id);
create index if not exists focus_subjects_category_id_idx on public.focus_subjects (category_id);

drop policy if exists "focus_subjects_select_own" on public.focus_subjects;
create policy "focus_subjects_select_own" on public.focus_subjects
  for select using (auth.uid() = user_id);
drop policy if exists "focus_subjects_insert_own" on public.focus_subjects;
create policy "focus_subjects_insert_own" on public.focus_subjects
  for insert with check (auth.uid() = user_id);
drop policy if exists "focus_subjects_delete_own" on public.focus_subjects;
create policy "focus_subjects_delete_own" on public.focus_subjects
  for delete using (auth.uid() = user_id);

grant select, insert, delete on public.focus_subjects to authenticated;
grant select, insert, delete on public.focus_subjects to service_role;

-- ---------------------------------------------------------------------------
-- focus_sessions — ders bağlantısı + kamera özeti (kod incelemesiyle
-- doğrulandı: kamera görüntüsü hiç saklanmıyor, sadece seans sonunda tek
-- bir özet sayı — "kaç saniye ekrandan uzak/dikkatsizdin" — kaydediliyor).
-- ---------------------------------------------------------------------------
alter table public.focus_sessions
  add column if not exists subject_id uuid references public.focus_subjects (id) on delete set null,
  add column if not exists distracted_seconds integer check (distracted_seconds is null or distracted_seconds >= 0);

create index if not exists focus_sessions_subject_id_idx on public.focus_sessions (subject_id);

notify pgrst, 'reload schema';
