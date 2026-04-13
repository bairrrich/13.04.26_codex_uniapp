-- ============================================================
-- Fix: Add missing Investment tables for Finance module
-- Run this in Supabase SQL Editor if you already ran 001_full_schema.sql
-- ============================================================

-- Investment assets (stocks, bonds, crypto definitions)
create table if not exists investment_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  symbol text not null,
  name text not null,
  currency_code char(3) not null default 'RUB',
  created_at timestamptz not null default now()
);

create index if not exists idx_investment_assets_user_id
  on investment_assets (user_id);

-- Investment positions (user's holdings)
create table if not exists investment_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  asset_id uuid not null references investment_assets(id) on delete cascade,
  quantity numeric(20,8) not null,
  avg_price_minor bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_investment_positions_user_id
  on investment_positions (user_id);

-- RLS policies
alter table investment_assets enable row level security;
alter table investment_positions enable row level security;

drop policy if exists "Users can manage own investment assets" on investment_assets;
create policy "Users can manage own investment assets"
  on investment_assets for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own investment positions" on investment_positions;
create policy "Users can manage own investment positions"
  on investment_positions for all using (user_id = auth_user_id());

-- Triggers
drop trigger if exists update_investment_assets_updated_at on investment_assets;
create trigger update_investment_assets_updated_at
  before update on investment_assets
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_investment_positions_updated_at on investment_positions;
create trigger update_investment_positions_updated_at
  before update on investment_positions
  for each row execute procedure public.update_updated_at_column();
