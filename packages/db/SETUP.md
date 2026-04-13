# Настройка Supabase Database

## 1. Создание проекта

1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Создайте новый проект (или используйте существующий)
3. Скопируйте URL проекта: `https://xxxx.supabase.co`

## 2. Применение миграции

### Вариант A: SQL Editor (рекомендуется)

1. В Supabase Dashboard перейдите в **SQL Editor**
2. Скопируйте содержимое `packages/db/sql/001_full_schema.sql`
3. Вставьте в SQL Editor и нажмите **Run**

### Вариант B: Через CLI

```bash
npm i -g supabase
supabase login
supabase link --project-ref ваш-проект
supabase db push
```

## 3. Включение триггера регистрации

После применения миграции выполните в SQL Editor:

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

Это автоматически создаёт профиль в `users` при регистрации.

## 4. Данные для существующих пользователей

Если пользователи уже зарегистрированы, но не имеют базовых данных, выполните:

```sql
-- Содержимое файла packages/db/sql/002_backfill_defaults.sql
```

Этот скрипт создаст счета и категории для всех существующих пользователей.
**Запускать только один раз!**

## 5. Автоматические базовые данные

При регистрации нового пользователя **автоматически создаются**:

| Данные | Описание |
|--------|----------|
| **Счёт** | `Наличные (RUB)` — базовый финансовый счёт |
| **Категории доходов** | Зарплата, Фриланс, Подарок, Инвестиции (4 шт) |
| **Категории расходов** | Продукты, Транспорт, Развлечения, Здоровье, Одежда, Коммунальные, Подписки, Образование, Рестораны, Путешествия (10 шт) |
| **Упражнения** | 15 базовых упражнений (общие для всех) |
| **Продукты питания** | 15 базовых продуктов с КБЖУ (общие для всех) |

**Больше не нужно создавать счёт и категории вручную** — они появляются автоматически при регистрации.

## 6. Настройка переменных окружения

Скопируйте `apps/next/.env.example` → `apps/next/.env.local`:

```bash
# Публичные (клиент)
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-public-ключ

# Серверные (опционально)
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-ключ

# Database (для Drizzle ORM, seed)
DATABASE_URL=postgresql://postgres:пароль@db.ваш-проект.supabase.co:5432/postgres
```

### Где найти ключи:

| Ключ | Путь |
|------|------|
| `anon public` | Settings → API → Project API keys |
| `service_role` | Settings → API → Project API keys |
| `db-password` | Settings → Database → Connection info |

## 7. Включение Email Auth

1. Settings → Authentication → Providers
2. Включите **Email**
3. Для разработки: отключите **Confirm email**
4. Для продакшена: включите **Confirm email**

## 8. Проверка

```bash
pnpm dev
```

1. Зарегистрируйтесь через форму
2. В Supabase Table Editor проверьте:
   - `users` — появилась запись
   - `accounts` — есть счёт "Наличные"
   - `transaction_categories` — 14 категорий (4 дохода + 10 расходов)
   - `exercise_definitions` — 15 упражнений
   - `food_items` — 15 продуктов

## Структура таблиц

| Модуль | Таблицы |
|--------|---------|
| Core | `users`, `activity_events` |
| Diary | `diary_entries`, `tags`, `diary_entry_tags`, `diary_media` |
| Finance | `accounts`, `transaction_categories`, `transactions`, `transfers`, `budgets`, `recurring_rules` |
| Nutrition | `food_items`, `recipes`, `recipe_items`, `meal_logs`, `meal_items`, `water_logs` |
| Fitness | `exercise_definitions`, `workout_sessions`, `workout_exercises`, `workout_sets` |
| Collections | `collection_items` |
| Feed | `feed_posts`, `feed_comments`, `feed_likes` |

Все таблицы защищены RLS политиками — пользователи видят только свои данные.
Глобальные данные (упражнения, продукты) доступны всем на чтение.
