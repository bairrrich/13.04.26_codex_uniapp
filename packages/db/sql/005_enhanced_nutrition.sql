-- ============================================================
-- Enhanced Nutrition Module Schema
-- Run AFTER 001_full_schema.sql
-- ============================================================

-- Nutrition goals (one per user)
create table if not exists nutrition_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade unique,
  calories bigint not null default 2000,
  protein_g numeric(5,1) not null default 150,
  fat_g numeric(5,1) not null default 65,
  carbs_g numeric(5,1) not null default 250,
  fiber_g numeric(5,1) default 30,
  water_ml bigint not null default 2000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_nutrition_goals_user_id
  on nutrition_goals (user_id);

drop trigger if exists update_nutrition_goals_updated_at on nutrition_goals;
create trigger update_nutrition_goals_updated_at
  before update on nutrition_goals
  for each row execute procedure public.update_updated_at_column();

-- Enhanced food_items with more nutrition columns
alter table food_items add column if not exists fiber_g numeric(5,1);
alter table food_items add column if not exists sugar_g numeric(5,1);
alter table food_items add column if not exists sodium_mg numeric(8,1);

-- Enhanced meal_items with inline nutrition (for custom foods)
alter table meal_items alter column food_item_id drop not null;
alter table meal_items add column if not exists name text;
alter table meal_items add column if not exists calories numeric(8,1);
alter table meal_items add column if not exists protein_g numeric(5,1);
alter table meal_items add column if not exists fat_g numeric(5,1);
alter table meal_items add column if not exists carbs_g numeric(5,1);
alter table meal_items add column if not exists fiber_g numeric(5,1);

-- Meal templates (saved meals for quick logging)
create table if not exists meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_meal_templates_user_id
  on meal_templates (user_id);

-- Enhanced recipe_items with nutrition
alter table recipe_items add column if not exists name text;
alter table recipe_items add column if not exists calories numeric(8,1);
alter table recipe_items add column if not exists protein_g numeric(5,1);
alter table recipe_items add column if not exists fat_g numeric(5,1);
alter table recipe_items add column if not exists carbs_g numeric(5,1);

-- RLS policies
alter table nutrition_goals enable row level security;
alter table meal_templates enable row level security;

drop policy if exists "Users can manage own nutrition goals" on nutrition_goals;
create policy "Users can manage own nutrition goals"
  on nutrition_goals for all using (user_id = auth_user_id());

drop policy if exists "Users can manage own meal templates" on meal_templates;
create policy "Users can manage own meal templates"
  on meal_templates for all using (user_id = auth_user_id());

-- Seed default food items
insert into food_items (source, name, kcal, protein_g, fat_g, carbs_g, fiber_g) values
  ('global', 'Куриная грудка (варёная)', 165, 31.0, 3.6, 0, 0),
  ('global', 'Рис белый (варёный)', 130, 2.7, 0.3, 28.0, 0.4),
  ('global', 'Овсянка (на воде)', 150, 5.0, 3.0, 27.0, 4.0),
  ('global', 'Яйцо куриное (варёное)', 155, 13.0, 11.0, 1.1, 0),
  ('global', 'Банан', 89, 1.1, 0.3, 23.0, 2.6),
  ('global', 'Творог 5%', 120, 17.0, 5.0, 3.0, 0),
  ('global', 'Гречка (варёная)', 132, 4.5, 2.3, 24.0, 3.4),
  ('global', 'Лосось (запечённый)', 208, 20.0, 13.0, 0, 0),
  ('global', 'Молоко 2.5%', 52, 2.8, 2.5, 4.7, 0),
  ('global', 'Хлеб чёрный', 259, 9.0, 3.0, 49.0, 6.0),
  ('global', 'Огурец свежий', 15, 0.8, 0.1, 2.8, 0.5),
  ('global', 'Помидор свежий', 20, 0.6, 0.2, 4.2, 1.2),
  ('global', 'Картофель (варёный)', 77, 2.0, 0.4, 17.0, 1.8),
  ('global', 'Говядина (тушёная)', 250, 26.0, 16.0, 0, 0),
  ('global', 'Тунец (консервы)', 132, 29.0, 1.0, 0, 0),
  ('global', 'Яблоко', 52, 0.3, 0.2, 14.0, 2.4),
  ('global', 'Греческий йогурт 2%', 73, 10.0, 2.0, 3.6, 0),
  ('global', 'Миндаль', 579, 21.0, 49.0, 22.0, 12.5),
  ('global', 'Авокадо', 160, 2.0, 15.0, 9.0, 7.0),
  ('global', 'Кефир 1%', 40, 3.0, 1.0, 4.0, 0)
on conflict (source, external_id) do nothing;
