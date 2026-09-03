-- Faz 2 (Ödeme/iyzico) iskeleti (2026-09-03, kullanıcı onaylı — bkz.
-- CLAUDE.md "eksikler" envanteri madde 1). Bu tablo SADECE bir ödeme
-- denemesinin durumunu takip ediyor — gerçek para hareketi iyzico'nun
-- kendi API'sinde oluyor, biz burada sonucu kaydediyoruz.
--
-- Kritik güvenlik kararı: `authenticated` rolüne SADECE select+insert
-- veriliyor, update/delete YOK. Bir kullanıcı client'tan doğrudan bir
-- satır insert edebilir (status='pending' varsayılanıyla, zararsız) ama
-- kendi siparişini 'success' yapıp Pro'ya sahte geçemez — status'ü
-- SADECE server (iyzico callback route'u, admin/service_role client'la)
-- güncelleyebiliyor. `profiles.is_pro`'yu tetikleyen tek yol bu.
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  amount numeric not null,
  currency text not null default 'TRY',
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'cancelled')),
  provider text not null default 'iyzico',
  provider_conversation_id text,
  provider_payment_id text,
  provider_raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_orders enable row level security;
create index if not exists payment_orders_user_id_idx on public.payment_orders (user_id);
create index if not exists payment_orders_conversation_id_idx on public.payment_orders (provider_conversation_id);

drop policy if exists "payment_orders_select_own" on public.payment_orders;
create policy "payment_orders_select_own" on public.payment_orders
  for select using (auth.uid() = user_id);
drop policy if exists "payment_orders_insert_own" on public.payment_orders;
create policy "payment_orders_insert_own" on public.payment_orders
  for insert with check (auth.uid() = user_id and status = 'pending');

grant select, insert on public.payment_orders to authenticated;
grant select, insert, update, delete on public.payment_orders to service_role;

notify pgrst, 'reload schema';
