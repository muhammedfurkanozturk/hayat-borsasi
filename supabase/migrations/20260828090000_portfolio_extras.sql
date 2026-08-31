-- "Finans & Portföy" zenginleştirmesi (kullanıcı onaylı, piyasa araştırması
-- sonrası — Delta/Snowball/Sharesight'tan ilham, kod/tasarım kopyalanmadı).
-- portfolio_transactions'ın yerine geçmiyor, üstüne ekleniyor.

-- ---------------------------------------------------------------------------
-- price_alerts — Delta'daki (piyasa araştırması) fiyat alarmı fikri.
-- ÖNEMLİ SINIRLAMA: Vercel Hobby (ücretsiz) planında cron job'lar günde en
-- fazla 1 kez tetiklenebiliyor — bu yüzden bu "anlık" değil, günde bir kez
-- (BIST kapanışına yakın) kontrol edilen bir alarm. triggered_at dolunca
-- kontrol durur (tek seferlik) — dismissed_at kullanıcı bildirimi
-- kapattığında set edilir.
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.price_alert_direction as enum ('above', 'below');
exception when duplicate_object then null;
end $$;

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  symbol text not null,
  target_price numeric(12, 2) not null check (target_price > 0),
  direction public.price_alert_direction not null,
  triggered_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.price_alerts enable row level security;
create index if not exists price_alerts_user_id_idx on public.price_alerts (user_id);
create index if not exists price_alerts_category_id_idx on public.price_alerts (category_id);
create index if not exists price_alerts_untriggered_idx on public.price_alerts (symbol) where triggered_at is null;

drop policy if exists "price_alerts_select_own" on public.price_alerts;
create policy "price_alerts_select_own" on public.price_alerts
  for select using (auth.uid() = user_id);
drop policy if exists "price_alerts_insert_own" on public.price_alerts;
create policy "price_alerts_insert_own" on public.price_alerts
  for insert with check (auth.uid() = user_id);
drop policy if exists "price_alerts_update_own" on public.price_alerts;
create policy "price_alerts_update_own" on public.price_alerts
  for update using (auth.uid() = user_id);
drop policy if exists "price_alerts_delete_own" on public.price_alerts;
create policy "price_alerts_delete_own" on public.price_alerts
  for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.price_alerts to authenticated;
grant select, insert, update, delete on public.price_alerts to service_role;

-- ---------------------------------------------------------------------------
-- portfolio_transactions — realized P&L (Sharesight'tan ilham) ve
-- ortalama maliyet hesabının doğru sırayla (kronolojik) çalışabilmesi için
-- created_at zaten vardı, sadece indeksleniyor (sık sorgulanacak).
-- ---------------------------------------------------------------------------
create index if not exists portfolio_transactions_date_idx on public.portfolio_transactions (transaction_date, created_at);

notify pgrst, 'reload schema';
