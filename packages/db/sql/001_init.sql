create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  entity_type text not null,
  entity_id uuid not null,
  visibility text not null check (visibility in ('private', 'friends', 'public')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_events_user_created_at
  on activity_events (user_id, created_at desc);
