-- ============================================================
-- SuperApp Database Schema
-- Full migration for Supabase PostgreSQL
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. CORE
-- ============================================================

-- Users (Supabase auth.users handles auth, this is the profile table)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  avatar_url text,
  timezone text default 'Europe/Moscow',
  locale text default 'ru',
  settings jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Activity events (unified event log for feed)
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

create index if not exists idx_activity_events_type
  on activity_events (type);

-- ============================================================
-- 2. DIARY
-- ============================================================

create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  mood_score smallint check (mood_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_diary_entries_user_created_at
  on diary_entries (user_id, created_at desc);

create index if not exists idx_diary_entries_mood
  on diary_entries (user_id, mood_score)
  where mood_score is not null;

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  unique (user_id, name)
);

create index if not exists idx_tags_user_id
  on tags (user_id);

create table if not exists diary_entry_tags (
  entry_id uuid not null references diary_entries(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (entry_id, tag_id)
);

create table if not exists diary_media (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references diary_entries(id) on delete cascade,
  url text not null,
  mime_type text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. FINANCE
-- ============================================================

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  currency_code char(3) not null default 'RUB',
  balance_minor bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_accounts_user_id
  on accounts (user_id);

-- Financial goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  target_amount bigint not null check (target_amount > 0),
  current_amount bigint not null default 0 check (current_amount >= 0),
  deadline timestamptz,
  icon text default '🎯',
  color text default '#5B6CFF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_user_id
  on goals (user_id);

drop trigger if exists update_goals_updated_at on goals;
create trigger update_goals_updated_at
  before update on goals
  for each row execute procedure public.update_updated_at_column();

create table if not exists transaction_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  parent_id uuid references transaction_categories(id),
  kind text not null check (kind in ('income', 'expense')),
  color text default '#5B6CFF',
  icon text
);

create index if not exists idx_categories_user_id
  on transaction_categories (user_id) where user_id is not null;

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete restrict,
  category_id uuid references transaction_categories(id) on delete set null,
  kind text not null check (kind in ('income', 'expense', 'transfer')),
  amount_minor bigint not null check (amount_minor > 0),
  description text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_occurred_at
  on transactions (user_id, occurred_at desc);

create index if not exists idx_transactions_account_id
  on transactions (account_id);

create table if not exists transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  from_account_id uuid not null references accounts(id) on delete restrict,
  to_account_id uuid not null references accounts(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  description text,
  occurred_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid not null references transaction_categories(id) on delete cascade,
  period text not null check (period in ('daily', 'weekly', 'monthly', 'yearly')),
  limit_minor bigint not null check (limit_minor > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_budgets_user_id
  on budgets (user_id);

create table if not exists recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  category_id uuid references transaction_categories(id) on delete set null,
  rrule text not null,
  amount_minor bigint not null check (amount_minor > 0),
  next_run_at timestamptz,
  active boolean not null default true
);

-- ============================================================
-- 4. NUTRITION
-- ============================================================

create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'user',
  external_id text,
  name text not null,
  kcal numeric(6,1),
  protein_g numeric(5,1),
  fat_g numeric(5,1),
  carbs_g numeric(5,1),
  barcode text,
  unique (source, external_id)
);

create index if not exists idx_food_items_name
  on food_items using gin (to_tsvector('simple', name));

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  instructions text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipes_user_id
  on recipes (user_id);

create table if not exists recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  food_item_id uuid not null references food_items(id) on delete restrict,
  grams numeric(8,1) not null
);

create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_logs_user_eaten_at
  on meal_logs (user_id, eaten_at desc);

create table if not exists meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references meal_logs(id) on delete cascade,
  food_item_id uuid not null references food_items(id) on delete restrict,
  grams numeric(8,1) not null,
  name text, -- for custom items not in food_items
  created_at timestamptz not null default now()
);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  consumed_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml > 0)
);

create index if not exists idx_water_logs_user_consumed_at
  on water_logs (user_id, consumed_at desc);

-- ============================================================
-- 5. FITNESS
-- ============================================================

create table if not exists exercise_definitions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  muscle_group text,
  equipment text,
  description text
);

create index if not exists idx_exercises_name
  on exercise_definitions using gin (to_tsvector('simple', name));

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workout_sessions_user_started_at
  on workout_sessions (user_id, started_at desc);

create table if not exists workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercise_definitions(id) on delete restrict,
  sort_order integer not null default 0
);

create table if not exists workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  reps integer,
  weight_grams integer,
  rest_seconds integer,
  set_order integer not null default 0,
  is_warmup boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 6. COLLECTIONS
-- ============================================================

create table if not exists collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('book', 'movie', 'recipe', 'supplement')),
  title text not null,
  status text not null check (status in ('planned', 'in_progress', 'completed', 'dropped')),
  rating smallint check (rating between 1 and 5),
  metadata jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_collection_items_user_created_at
  on collection_items (user_id, created_at desc);

create index if not exists idx_collection_items_type
  on collection_items (user_id, type);

create index if not exists idx_collection_items_metadata
  on collection_items using gin (metadata);

-- ============================================================
-- 7. FEED / SOCIAL
-- ============================================================

create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid references activity_events(id) on delete cascade,
  content text,
  visibility text not null check (visibility in ('private', 'friends', 'public')) default 'private',
  created_at timestamptz not null default now()
);

create index if not exists idx_feed_posts_user_created_at
  on feed_posts (user_id, created_at desc);

create table if not exists feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_feed_comments_post_created
  on feed_comments (post_id, created_at);

create table if not exists feed_likes (
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) Policies
-- ============================================================

alter table users enable row level security;
alter table activity_events enable row level security;
alter table diary_entries enable row level security;
alter table tags enable row level security;
alter table diary_entry_tags enable row level security;
alter table diary_media enable row level security;
alter table accounts enable row level security;
alter table transaction_categories enable row level security;
alter table transactions enable row level security;
alter table transfers enable row level security;
alter table budgets enable row level security;
alter table recurring_rules enable row level security;
alter table food_items enable row level security;
alter table recipes enable row level security;
alter table recipe_items enable row level security;
alter table meal_logs enable row level security;
alter table meal_items enable row level security;
alter table water_logs enable row level security;
alter table exercise_definitions enable row level security;
alter table workout_sessions enable row level security;
alter table workout_exercises enable row level security;
alter table workout_sets enable row level security;
alter table collection_items enable row level security;
alter table feed_posts enable row level security;
alter table feed_comments enable row level security;
alter table feed_likes enable row level security;

-- Helper function to get current user ID from Supabase auth
create or replace function auth_user_id() returns uuid as $$
  select auth.uid();
$$ language sql stable;

-- Users: can only read/update their own profile
drop policy if exists "Users can view own profile" on users;
create policy "Users can view own profile"
  on users for select using (id = auth_user_id());

drop policy if exists "Users can update own profile" on users;
create policy "Users can update own profile"
  on users for update using (id = auth_user_id());

-- Generic policy template for all user-scoped tables
drop policy if exists "Users can manage own diary entries" on diary_entries;
create policy "Users can manage own diary entries"
  on diary_entries for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own tags" on tags;
create policy "Users can manage own tags"
  on tags for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own diary_entry_tags" on diary_entry_tags;
create policy "Users can manage own diary_entry_tags"
  on diary_entry_tags for all using (
    entry_id in (select id from diary_entries where user_id = auth_user_id())
  );

drop policy if exists "Users can manage own accounts" on accounts;
create policy "Users can manage own accounts"
  on accounts for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own goals" on goals;
create policy "Users can manage own goals"
  on goals for all using (user_id = auth_user_id());

drop policy if exists "Users can read global categories" on transaction_categories;
create policy "Users can read global categories"
  on transaction_categories for select using (user_id is null);

drop policy if exists "Users can manage own categories" on transaction_categories;
create policy "Users can manage own categories"
  on transaction_categories for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own transactions" on transactions;
create policy "Users can manage own transactions"
  on transactions for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own meal logs" on meal_logs;
create policy "Users can manage own meal logs"
  on meal_logs for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own meal items" on meal_items;
create policy "Users can manage own meal items"
  on meal_items for all using (
    meal_log_id in (select id from meal_logs where user_id = auth_user_id())
  );

drop policy if exists "Users can manage own water logs" on water_logs;
create policy "Users can manage own water logs"
  on water_logs for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own workouts" on workout_sessions;
create policy "Users can manage own workouts"
  on workout_sessions for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own workout exercises" on workout_exercises;
create policy "Users can manage own workout exercises"
  on workout_exercises for all using (
    session_id in (select id from workout_sessions where user_id = auth_user_id())
  );

drop policy if exists "Users can manage own workout sets" on workout_sets;
create policy "Users can manage own workout sets"
  on workout_sets for all using (
    workout_exercise_id in (
      select id from workout_exercises where session_id in (
        select id from workout_sessions where user_id = auth_user_id()
      )
    )
  );

drop policy if exists "Users can manage own collections" on collection_items;
create policy "Users can manage own collections"
  on collection_items for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own feed posts" on feed_posts;
create policy "Users can manage own feed posts"
  on feed_posts for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own feed comments" on feed_comments;
create policy "Users can manage own feed comments"
  on feed_comments for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own feed likes" on feed_likes;
create policy "Users can manage own feed likes"
  on feed_likes for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own activity events" on activity_events;
create policy "Users can manage own activity events"
  on activity_events for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own budgets" on budgets;
create policy "Users can manage own budgets"
  on budgets for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own recurring rules" on recurring_rules;
create policy "Users can manage own recurring rules"
  on recurring_rules for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own transfers" on transfers;
create policy "Users can manage own transfers"
  on transfers for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own recipes" on recipes;
create policy "Users can manage own recipes"
  on recipes for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own recipe items" on recipe_items;
create policy "Users can manage own recipe items"
  on recipe_items for all using (
    recipe_id in (select id from recipes where user_id = auth_user_id())
  );

drop policy if exists "Users can manage own diary media" on diary_media;
create policy "Users can manage own diary media"
  on diary_media for all using (
    entry_id in (select id from diary_entries where user_id = auth_user_id())
  );

-- Exercise definitions: everyone can read
drop policy if exists "Everyone can read exercises" on exercise_definitions;
create policy "Everyone can read exercises"
  on exercise_definitions for select using (true);

-- Food items: everyone can read
drop policy if exists "Everyone can read food items" on food_items;
create policy "Everyone can read food items"
  on food_items for select using (true);

-- ============================================================
-- 7b. INVESTMENTS
-- ============================================================

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

alter table investment_assets enable row level security;
alter table investment_positions enable row level security;

drop policy if exists "Users can manage own investment assets" on investment_assets;
create policy "Users can manage own investment assets"
  on investment_assets for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own investment positions" on investment_positions;
create policy "Users can manage own investment positions"
  on investment_positions for all using (user_id = auth_user_id());

drop trigger if exists update_investment_assets_updated_at on investment_assets;
create trigger update_investment_assets_updated_at
  before update on investment_assets
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists update_investment_positions_updated_at on investment_positions;
create trigger update_investment_positions_updated_at
  before update on investment_positions
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 9. TRIGGERS
-- ============================================================

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, timezone, locale)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    coalesce(new.raw_user_meta_data->>'timezone', 'Europe/Moscow'),
    coalesce(new.raw_user_meta_data->>'locale', 'ru')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Auto-create default data for new user
create or replace function public.handle_new_user_defaults()
returns trigger as $$
begin
  -- Default account (only if no accounts exist)
  if not exists (select 1 from public.accounts where user_id = new.id) then
    insert into public.accounts (user_id, name, currency_code, balance_minor)
    values (new.id, 'Наличные', 'RUB', 0);
  end if;

  -- Default income categories (only if no categories exist)
  if not exists (select 1 from public.transaction_categories where user_id = new.id) then
    insert into public.transaction_categories (user_id, name, kind, color, icon) values
      (new.id, 'Зарплата', 'income', '#22c55e', '💰'),
      (new.id, 'Фриланс', 'income', '#3b82f6', '💻'),
      (new.id, 'Подарок', 'income', '#ec4899', '🎁'),
      (new.id, 'Инвестиции', 'income', '#8b5cf6', '📈'),
      (new.id, 'Продукты', 'expense', '#f59e0b', '🛒'),
      (new.id, 'Транспорт', 'expense', '#ef4444', '🚗'),
      (new.id, 'Развлечения', 'expense', '#8b5cf6', '🎬'),
      (new.id, 'Здоровье', 'expense', '#22c55e', '💊'),
      (new.id, 'Одежда', 'expense', '#ec4899', '👕'),
      (new.id, 'Коммунальные', 'expense', '#3b82f6', '💡'),
      (new.id, 'Подписки', 'expense', '#f97316', '📱'),
      (new.id, 'Образование', 'expense', '#06b6d4', '📚'),
      (new.id, 'Рестораны', 'expense', '#f43f5e', '🍽️'),
      (new.id, 'Путешествия', 'expense', '#14b8a6', '✈️');
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- This trigger requires Supabase Auth to be enabled
-- Run this AFTER enabling Supabase Auth in your project:
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- Trigger to create default user data
create trigger on_auth_user_defaults
  after insert on auth.users
  for each row execute procedure public.handle_new_user_defaults();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Diary
drop trigger if exists update_diary_entries_updated_at on diary_entries;
create trigger update_diary_entries_updated_at
  before update on diary_entries
  for each row execute procedure public.update_updated_at_column();

-- Collections
drop trigger if exists update_collection_items_updated_at on collection_items;
create trigger update_collection_items_updated_at
  before update on collection_items
  for each row execute procedure public.update_updated_at_column();

-- Accounts
drop trigger if exists update_accounts_updated_at on accounts;
create trigger update_accounts_updated_at
  before update on accounts
  for each row execute procedure public.update_updated_at_column();

-- Transactions
drop trigger if exists update_transactions_updated_at on transactions;
create trigger update_transactions_updated_at
  before update on transactions
  for each row execute procedure public.update_updated_at_column();

-- ============================================================
-- 10. SEED DATA (global/shared data)
-- ============================================================

-- Exercise definitions (shared by all users)
insert into exercise_definitions (name, muscle_group) values
  ('Отжимания', 'Грудь/Трицепс'),
  ('Подтягивания', 'Спина/Бицепс'),
  ('Приседания', 'Ноги'),
  ('Жим лёжа', 'Грудь'),
  ('Становая тяга', 'Спина/Ноги'),
  ('Жим стоя', 'Плечи'),
  ('Планка', 'Кор'),
  ('Выпады', 'Ноги'),
  ('Тяга в наклоне', 'Спина'),
  ('Бицепс с гантелями', 'Бицепс'),
  ('Трицепс на блоке', 'Трицепс'),
  ('Жим ногами', 'Ноги'),
  ('Скручивания', 'Кор'),
  ('Бёрпи', 'Кардио'),
  ('Скакалка', 'Кардио')
on conflict (name) do nothing;

-- Common food items (shared by all users)
insert into food_items (source, name, kcal, protein_g, fat_g, carbs_g) values
  ('global', 'Куриная грудка', 165, 31.0, 3.6, 0),
  ('global', 'Рис белый', 130, 2.7, 0.3, 28.0),
  ('global', 'Овсянка', 150, 5.0, 3.0, 27.0),
  ('global', 'Яйцо куриное', 155, 13.0, 11.0, 1.1),
  ('global', 'Банан', 89, 1.1, 0.3, 23.0),
  ('global', 'Творог 5%', 120, 17.0, 5.0, 3.0),
  ('global', 'Гречка', 132, 4.5, 2.3, 24.0),
  ('global', 'Лосось', 208, 20.0, 13.0, 0),
  ('global', 'Молоко 2.5%', 52, 2.8, 2.5, 4.7),
  ('global', 'Хлеб чёрный', 259, 9.0, 3.0, 49.0),
  ('global', 'Огурец', 15, 0.8, 0.1, 2.8),
  ('global', 'Помидор', 20, 0.6, 0.2, 4.2),
  ('global', 'Картофель', 77, 2.0, 0.4, 17.0),
  ('global', 'Говядина', 250, 26.0, 16.0, 0),
  ('global', 'Тунец', 132, 29.0, 1.0, 0)
on conflict (source, external_id) do nothing;
