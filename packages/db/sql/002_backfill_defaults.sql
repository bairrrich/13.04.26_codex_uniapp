-- ============================================================
-- Fix: Backfill default data for ALL existing auth users
-- Run this ONCE to ensure every user has profiles + defaults
-- ============================================================

-- 1. Ensure all auth.users have profiles in public.users
insert into public.users (id, email, name, timezone, locale)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  coalesce(au.raw_user_meta_data->>'timezone', 'Europe/Moscow'),
  coalesce(au.raw_user_meta_data->>'locale', 'ru')
from auth.users au
where not exists (
  select 1 from public.users u where u.id = au.id
);

-- 2. Create default accounts for users without any
insert into public.accounts (user_id, name, currency_code, balance_minor)
select u.id, 'Наличные', 'RUB', 0
from public.users u
where not exists (
  select 1 from public.accounts a where a.user_id = u.id
);

-- 3. Create default income categories for users without any
insert into public.transaction_categories (user_id, name, kind, color, icon)
select u.id, cat.name, cat.kind, cat.color, cat.icon
from public.users u
cross join (
  values
    ('Зарплата', 'income', '#22c55e', '💰'),
    ('Фриланс', 'income', '#3b82f6', '💻'),
    ('Подарок', 'income', '#ec4899', '🎁'),
    ('Инвестиции', 'income', '#8b5cf6', '📈')
) as cat(name, kind, color, icon)
where not exists (
  select 1 from public.transaction_categories c
  where c.user_id = u.id and c.kind = 'income'
);

-- 4. Create default expense categories for users without any
insert into public.transaction_categories (user_id, name, kind, color, icon)
select u.id, cat.name, cat.kind, cat.color, cat.icon
from public.users u
cross join (
  values
    ('Продукты', 'expense', '#f59e0b', '🛒'),
    ('Транспорт', 'expense', '#ef4444', '🚗'),
    ('Развлечения', 'expense', '#8b5cf6', '🎬'),
    ('Здоровье', 'expense', '#22c55e', '💊'),
    ('Одежда', 'expense', '#ec4899', '👕'),
    ('Коммунальные', 'expense', '#3b82f6', '💡'),
    ('Подписки', 'expense', '#f97316', '📱'),
    ('Образование', 'expense', '#06b6d4', '📚'),
    ('Рестораны', 'expense', '#f43f5e', '🍽️'),
    ('Путешествия', 'expense', '#14b8a6', '✈️')
) as cat(name, kind, color, icon)
where not exists (
  select 1 from public.transaction_categories c
  where c.user_id = u.id and c.kind = 'expense'
);

-- 5. Verify results
select
  'users' as table_name,
  count(*) as total_users
from public.users
union all
select
  'accounts',
  count(*)
from public.accounts
union all
select
  'categories',
  count(*)
from public.transaction_categories
where user_id is not null;
