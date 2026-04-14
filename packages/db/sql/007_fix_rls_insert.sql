-- ============================================================
-- Fix: RLS policies for INSERT operations
-- The original policies used USING which doesn't apply to INSERT.
-- Need WITH CHECK for INSERT to work.
-- Run in Supabase SQL Editor
-- ============================================================

-- Water logs
drop policy if exists "Users can manage own water logs" on water_logs;
create policy "Users can manage own water logs"
  on water_logs for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Meal logs
drop policy if exists "Users can manage own meal logs" on meal_logs;
create policy "Users can manage own meal logs"
  on meal_logs for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Meal items
drop policy if exists "Users can manage own meal items" on meal_items;
create policy "Users can manage own meal items"
  on meal_items for all
  using (
    meal_log_id in (select id from meal_logs where user_id = auth_user_id())
  )
  with check (
    meal_log_id in (select id from meal_logs where user_id = auth_user_id())
  );

-- Diary entries
drop policy if exists "Users can manage own diary entries" on diary_entries;
create policy "Users can manage own diary entries"
  on diary_entries for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Transactions
drop policy if exists "Users can manage own transactions" on transactions;
create policy "Users can manage own transactions"
  on transactions for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Accounts
drop policy if exists "Users can manage own accounts" on accounts;
create policy "Users can manage own accounts"
  on accounts for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Goals
drop policy if exists "Users can manage own nutrition goals" on nutrition_goals;
create policy "Users can manage own nutrition goals"
  on nutrition_goals for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Meal templates
drop policy if exists "Users can manage own meal templates" on meal_templates;
create policy "Users can manage own meal templates"
  on meal_templates for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Recipes
drop policy if exists "Users can manage own recipes" on recipes;
create policy "Users can manage own recipes"
  on recipes for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Investment assets
drop policy if exists "Users can manage own investment assets" on investment_assets;
create policy "Users can manage own investment assets"
  on investment_assets for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());

-- Investment positions
drop policy if exists "Users can manage own investment positions" on investment_positions;
create policy "Users can manage own investment positions"
  on investment_positions for all
  using (user_id = auth_user_id())
  with check (user_id = auth_user_id());
