-- ============================================================
-- Mock Data: Finance Module (Last 7 Days)
-- Run AFTER 001_full_schema.sql and 002_backfill_defaults.sql
-- For Supabase SQL Editor
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
  v_account_id uuid;
  v_income_salary uuid;
  v_income_freelance uuid;
  v_expense_food uuid;
  v_expense_transport uuid;
  v_expense_restaurant uuid;
  v_expense_clothes uuid;
  v_expense_subscriptions uuid;
  v_expense_fun uuid;
  v_expense_utilities uuid;
  v_expense_health uuid;
BEGIN
  -- Get first user
  SELECT id INTO v_user_id FROM users LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please register first.';
    RETURN;
  END IF;

  -- Get first account
  SELECT id INTO v_account_id FROM accounts WHERE user_id = v_user_id LIMIT 1;
  IF v_account_id IS NULL THEN
    RAISE NOTICE 'No account found for user %', v_user_id;
    RETURN;
  END IF;

  -- Get categories
  SELECT id INTO v_income_salary FROM transaction_categories WHERE name = 'Зарплата' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_income_freelance FROM transaction_categories WHERE name = 'Фриланс' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_food FROM transaction_categories WHERE name = 'Продукты' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_transport FROM transaction_categories WHERE name = 'Транспорт' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_restaurant FROM transaction_categories WHERE name = 'Рестораны' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_clothes FROM transaction_categories WHERE name = 'Одежда' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_subscriptions FROM transaction_categories WHERE name = 'Подписки' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_fun FROM transaction_categories WHERE name = 'Развлечения' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_utilities FROM transaction_categories WHERE name = 'Коммунальные' AND user_id = v_user_id LIMIT 1;
  SELECT id INTO v_expense_health FROM transaction_categories WHERE name = 'Здоровье' AND user_id = v_user_id LIMIT 1;

  -- Day 7 (Monday)
  INSERT INTO transactions (user_id, account_id, category_id, kind, amount_minor, description, occurred_at) VALUES
    (v_user_id, v_account_id, v_expense_food, 'expense', 45000, 'Продукты Пятёрочка', (now() - interval '6 days' + interval '14:30')::timestamptz),
    (v_user_id, v_account_id, v_expense_restaurant, 'expense', 120000, 'Бизнес-ланч', (now() - interval '6 days' + interval '13:00')::timestamptz),
    (v_user_id, v_account_id, v_income_salary, 'income', 8500000, 'Зарплата за март', (now() - interval '6 days' + interval '09:00')::timestamptz);

  -- Day 6 (Tuesday)
  INSERT INTO transactions (user_id, account_id, category_id, kind, amount_minor, description, occurred_at) VALUES
    (v_user_id, v_account_id, v_expense_transport, 'expense', 35000, 'Яндекс Такси', (now() - interval '5 days' + interval '18:45')::timestamptz),
    (v_user_id, v_account_id, v_expense_subscriptions, 'expense', 39900, 'Яндекс Плюс', (now() - interval '5 days' + interval '00:01')::timestamptz);

  -- Day 5 (Wednesday)
  INSERT INTO transactions (user_id, account_id, category_id, kind, amount_minor, description, occurred_at) VALUES
    (v_user_id, v_account_id, v_expense_food, 'expense', 235000, 'Магнит продукты', (now() - interval '4 days' + interval '14:20')::timestamptz),
    (v_user_id, v_account_id, v_income_freelance, 'income', 1500000, 'Фриланс - проект сайта', (now() - interval '4 days' + interval '16:00')::timestamptz);

  -- Day 3 (Friday)
  INSERT INTO transactions (user_id, account_id, category_id, kind, amount_minor, description, occurred_at) VALUES
    (v_user_id, v_account_id, v_expense_restaurant, 'expense', 180000, 'Ужин с друзьями', (now() - interval '3 days' + interval '20:30')::timestamptz);

  -- Day 2 (Saturday)
  INSERT INTO transactions (user_id, account_id, category_id, kind, amount_minor, description, occurred_at) VALUES
    (v_user_id, v_account_id, v_expense_food, 'expense', 567000, 'Пятёрочка еженедельная закупка', (now() - interval '2 days' + interval '11:00')::timestamptz),
    (v_user_id, v_account_id, v_expense_fun, 'expense', 75000, 'Кино IMAX', (now() - interval '2 days' + interval '19:00')::timestamptz);

  -- Day 1 (Yesterday - Sunday)
  INSERT INTO transactions (user_id, account_id, category_id, kind, amount_minor, description, occurred_at) VALUES
    (v_user_id, v_account_id, v_expense_clothes, 'expense', 350000, 'Кроссовки Nike', (now() - interval '1 day' + interval '13:15')::timestamptz);

  -- Today
  INSERT INTO transactions (user_id, account_id, category_id, kind, amount_minor, description, occurred_at) VALUES
    (v_user_id, v_account_id, v_expense_utilities, 'expense', 450000, 'ЖКХ апрель', (now() - interval '5 hours')::timestamptz),
    (v_user_id, v_account_id, v_expense_health, 'expense', 89000, 'Аптека витамины', (now() - interval '3 hours')::timestamptz);

  -- Update balance
  UPDATE accounts SET balance_minor = (
    SELECT COALESCE(SUM(CASE WHEN kind = 'income' THEN amount_minor ELSE -amount_minor END), 0)
    FROM transactions WHERE account_id = accounts.id
  ) WHERE id = v_account_id;

  RAISE NOTICE '✅ Mock data inserted for user %', v_user_id;
END $$;

-- Summary
SELECT 'Транзакций' as metric, count(*)::text as value
FROM transactions WHERE user_id = (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 'Доходы', concat('₽ ', COALESCE(SUM(amount_minor), 0) / 100.0)
FROM transactions WHERE user_id = (SELECT id FROM users LIMIT 1) AND kind = 'income'
UNION ALL
SELECT 'Расходы', concat('₽ ', COALESCE(SUM(amount_minor), 0) / 100.0)
FROM transactions WHERE user_id = (SELECT id FROM users LIMIT 1) AND kind = 'expense';
