# SuperApp (Life Management OS)

## 0) Быстрый старт

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
```

- Supabase project URL: `https://toxqvyaqrgcgkdsmkeqd.supabase.co`
- Env переменные: `apps/next/.env.example`
- Деплой: Vercel (Root Directory = `apps/next`)

## Status (Production-Ready Core ✅)

- ✅ **Iteration A** — Foundation: Turborepo, pnpm workspaces, TypeScript
- ✅ **Iteration B** — Data & Auth: Drizzle ORM schema, Supabase Auth, ErrorBoundary, Logger
- ✅ **Iteration C** — Core Features: Diary, Finance (9 tabs), Nutrition (3 tabs), Fitness
- ✅ **Iteration D** — Feed + Social + Collections: Activity Feed, Collections
- ✅ **UI System** — @superapp/ui: Button, Input, Card, Text, Heading, Modal, Select, TextArea, Badge, Skeleton, Avatar, Sidebar, AppHeader, AppFooter
- ✅ **Responsive** — Mobile sidebar overlay, adaptive grids
- ⬜ **Iteration E** — Reliability: Background jobs, tests, SLA

## 3) Модули (актуальный статус)

### 💰 Финансы (9 вкладок)

| Вкладка | Описание |
|---------|----------|
| Обзор | Сводка баланса, быстрые действия, последние операции |
| Счета | CRUD счетов (RUB/USD/EUR), общий баланс |
| Транзакции | Доходы/расходы/переводы, фильтры, экспорт CSV, быстрые суммы |
| Категории | CRUD категорий с иконками и цветами (12 шт) |
| Бюджеты | Лимиты по категориям, прогресс-бары, предупреждения |
| Цели | Финансовые цели с прогрессом, пополнение, иконки/цвета |
| Инвестиции | Акции/облигации/ETF/крипта, позиции |
| Повторения | Автоматические транзакции с расписанием |
| Аналитика | Pie chart расходов, breakdown по категориям, тренды |

### 🍽️ Питание (3 вкладки)

| Вкладка | Описание |
|---------|----------|
| 📅 День | Кольца макро, поиск продуктов (live), порции, вода, приёмы пищи |
| 📖 Рецепты | CRUD рецептов с временем и порциями |
| 📊 Статистика | Pie chart макро, итоги за неделю, среднее в день |

### 📔 Дневник
- CRUD записей с настроением (1-5 эмодзи)
- Поиск, редактирование inline, график настроения

### 🏋️ Фитнес
- Тренировки с упражнениями, подходы, вес, отдых

### 📚 Коллекции
- Книги, фильмы, рецепты, добавки с рейтингами и статусами

### 📰 Лента
- Посты и события активности

### 🏠 Главная
- Dashboard со статистикой, быстрые действия

### ⚙️ Настройки
- Профиль, email, timezone, выход

## 1) Цели и нефункциональные требования

- Единая кодовая база для **Web + iOS + Android** с максимальным переиспользованием UI и бизнес-логики.
- Чёткое разделение слоёв: `UI` → `Application` → `Domain` → `Infrastructure`.
- Офлайн-устойчивость для мобильного клиента (локальный кэш + синхронизация).
- Наблюдаемость: аудит изменений, продуктовая аналитика, ошибкоустойчивые фоновые задачи.
- Масштабируемость модулей без «сцепления» между доменами.

## 2) Целевая структура монорепозитория (Turborepo)

```text
apps/
  next/                 # Web (Next.js): SSR/SEO, web routing
  expo/                 # Mobile (Expo React Native): iOS/Android
packages/
  app/                  # Экраны, фичи, use-cases, client state
  ui/                   # Tamagui design system (atoms/molecules/layout)
  db/                   # Prisma/Drizzle schema + migrations + seed
  api/                  # tRPC/REST contracts, DTO, validation (zod)
  config/               # tsconfig/eslint/prettier/shared build config
```

### Роли пакетов

- `packages/ui`: только визуальный слой и токены темы; бизнес-логика запрещена.
- `packages/app`: orchestration-слой (hooks/use-cases), навигация Solito, интеграция API.
- `packages/api`: единый контракт между web/mobile и backend.
- `packages/db`: источник истины для моделей, индексов и миграций.

## 3) Архитектура модулей (feature-first)

Рекомендуемый шаблон для каждого модуля в `packages/app/features/<module>`:

```text
features/<module>/
  components/           # UI для фичи
  hooks/                # React hooks/use-cases
  model/                # типы домена, мапперы, валидация
  services/             # API calls / репозитории
  store/                # Zustand slices (если нужно)
  index.ts              # public API модуля
```

### Домены

1. **Diary** — записи, настроение, теги, media.
2. **Finance** — счета, транзакции, бюджеты, recurring, инвестиции.
3. **Nutrition** — приемы пищи, КБЖУ, вода, пользовательские блюда.
4. **Fitness** — тренировки, упражнения, подходы, прогресс.
5. **Collections** — книги/фильмы/рецепты/добавки (гибкая JSONB-модель).
6. **Feed** — унифицированная лента активностей из других модулей.

## 4) Контракты интеграции между модулями

Чтобы избежать tight coupling, модуль публикует событие в единый канал:

- `activity.created`
- `goal.completed`
- `budget.limit_reached`
- `workout.completed`

Минимальный контракт события:

```ts
{
  id: string;
  userId: string;
  type: string;               // e.g. workout.completed
  entityType: string;         // workout | diary | recipe | transaction
  entityId: string;
  visibility: 'private' | 'friends' | 'public';
  createdAt: string;
  payload: Record<string, unknown>;
}
```

Feed читает только этот контракт и не зависит от внутренних таблиц модулей.

## 5) PostgreSQL: логическая схема (v2)

### 5.1 Core

- `users(id, email unique, name, avatar_url, timezone, locale, settings jsonb, created_at)`
- `activity_events(id, user_id, type, entity_type, entity_id, payload jsonb, created_at)`

### 5.2 Diary

- `diary_entries(id, user_id, content, mood_score smallint, created_at, updated_at)`
- `tags(id, user_id, name)`
- `diary_entry_tags(entry_id, tag_id)`
- `diary_media(id, entry_id, url, mime_type, size_bytes)`

### 5.3 Finance

- `accounts(id, user_id, name, currency_code char(3), balance_minor bigint)`
- `transaction_categories(id, user_id, name, parent_id, kind)`
- `transactions(id, user_id, account_id, category_id, kind, amount_minor bigint, occurred_at)`
- `transfers(id, user_id, from_account_id, to_account_id, amount_minor bigint, occurred_at)`
- `budgets(id, user_id, category_id, period, limit_minor bigint)`
- `recurring_rules(id, user_id, account_id, category_id, rrule, amount_minor bigint, next_run_at)`
- `investment_assets(id, user_id, symbol, name, currency_code)`
- `investment_positions(id, user_id, asset_id, quantity numeric(20,8), avg_price_minor bigint)`

### 5.4 Nutrition

- `food_items(id, source, external_id, name, kcal, protein_g, fat_g, carbs_g, barcode)`
- `recipes(id, user_id, title, instructions)`
- `recipe_items(recipe_id, food_item_id, grams)`
- `meal_logs(id, user_id, eaten_at, meal_type)`
- `meal_items(id, meal_log_id, food_item_id, grams)`
- `water_logs(id, user_id, consumed_at, amount_ml)`

### 5.5 Fitness

- `exercise_definitions(id, name, muscle_group)`
- `workout_sessions(id, user_id, started_at, ended_at, notes)`
- `workout_exercises(id, session_id, exercise_id, sort_order)`
- `workout_sets(id, workout_exercise_id, reps, weight_grams, rest_seconds, set_order)`

### 5.6 Collections

- `collection_items(id, user_id, type, title, status, rating, metadata jsonb, created_at)`

### 5.7 Feed / Social

- `feed_posts(id, user_id, event_id, content, visibility, created_at)`
- `feed_comments(id, post_id, user_id, content, created_at)`
- `feed_likes(post_id, user_id, created_at)`

## 6) Индексы и ограничения (минимальный набор)

- Уникальные: `users(email)`, `tags(user_id, name)`.
- Частые фильтры: `transactions(user_id, occurred_at desc)`, `meal_logs(user_id, eaten_at desc)`, `workout_sessions(user_id, started_at desc)`.
- Feed: `feed_posts(user_id, created_at desc)`, `activity_events(user_id, created_at desc)`.
- JSONB: `GIN` индексы на `collection_items.metadata` и `activity_events.payload`.
- Внешние ключи со стратегией `ON DELETE`:
  - `CASCADE` для дочерних сущностей (напр. sets внутри workout).
  - `RESTRICT` для критичных связей финансов.

## 7) Data Flow (runtime)

1. UI отправляет command (`createWorkoutSession`).
2. Клиент делает optimistic update (TanStack Query).
3. API валидирует DTO (`zod`) и выполняет use-case в транзакции.
4. Use-case сохраняет доменные записи + `activity_events`.
5. Проекция Feed строит `feed_posts` из событий с учётом `visibility`.
6. Клиент получает invalidation ключей и синхронизирует экран.

## 8) План внедрения (итерации)

### Iteration A — Foundation

- Поднять monorepo-каркас (`apps/*`, `packages/*`).
- Вынести единые UI-токены в `packages/ui`.
- Настроить `packages/api` + валидацию контрактов.

### Iteration B — Data & Auth

- Ввести `packages/db`, миграции и seed-данные.
- Реализовать auth + user settings + timezone/locale.
- Подключить аудит/логирование ошибок.

### Iteration C — Core Features

- Довести Diary, Finance, Nutrition, Fitness до production-ready CRUD.
- Добавить recurring/бюджеты/прогресс-графики.

### Iteration D — Feed + Social

- Ввести `activity_events` и проекцию Feed.
- Добавить комментарии/лайки и настройки приватности.

### Iteration E — Reliability

- Фоновые задачи (recurring, recalculation, reminders).
- E2E/контрактные тесты и SLA на критические API.

## 9) Технические решения по умолчанию

- API: Supabase Client (direct)
- ORM: `Drizzle ORM` (для серверных операций и миграций)
- Client state: React useState/useEffect
- Очереди/джобы: `BullMQ`/`pg-boss` (Iteration E).
- Observability: встроенный logger + Sentry (подключается через env).

## 10) Definition of Done для модуля

Модуль считается готовым, если выполнены все пункты:

- CRUD + валидация + обработка ошибок.
- Миграции/индексы/ограничения в БД.
- Unit + integration тесты use-case слоя.
- Контракт API задокументирован и покрыт тестом.
- События модуля публикуются в `activity_events`.
- UI соответствует дизайн-системе и поддерживает loading/empty/error состояния.

## 11) Реализованные модули (Status: Iteration D Complete)

### 📔 Diary (Дневник)
- CRUD записей с настроением (1-5 эмодзи)
- Теги и медиа (schema ready)
- Страница: `/diary`

### 💰 Finance (Финансы)
- Счета, транзакции, категории
- Доходы/расходы с суммами
- Страница: `/finance`

### 🍽️ Nutrition (Питание)
- Журнал приёмов пищи (завтрак/обед/ужин/перекус)
- Лог воды (ml)
- Страница: `/nutrition`

### 🏋️ Fitness (Фитнес)
- Тренировки с упражнениями
- Подходы, вес, отдых
- Страница: `/fitness`

### 📚 Collections (Коллекции)
- Книги, фильмы, рецепты, добавки
- Статусы и рейтинг (1-5 звёзд)
- Страница: `/collections`

### 📰 Feed (Лента)
- Посты и события активности
- Видимость (private/public)
- Страница: `/feed`

### 🔐 Auth
- Supabase Auth (email/password, sign up/sign in)
- User profile с timezone/locale
- Компоненты: `AuthForm`, `UserProfile`

### 🛡️ Infrastructure
- ErrorBoundary для обработки ошибок
- Logger с контекстом (error/warn/info/debug)
- Not-found page
- Drizzle ORM schema для всех таблиц
