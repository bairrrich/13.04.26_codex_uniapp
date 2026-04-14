import { pgTable, uuid, text, timestamp, jsonb, index, smallint } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ==================== CORE ====================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  timezone: text('timezone').default('Europe/Moscow'),
  locale: text('locale').default('ru'),
  settings: jsonb('settings').default('{}'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const activityEvents = pgTable(
  'activity_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    visibility: text('visibility', { enum: ['private', 'friends', 'public'] })
      .notNull()
      .default('private'),
    payload: jsonb('payload').notNull().default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_activity_events_user_created_at').on(table.userId, table.createdAt),
  ],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  activityEvents: many(activityEvents),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  user: one(users, {
    fields: [activityEvents.userId],
    references: [users.id],
  }),
}));

// ==================== DIARY ====================

export const diaryEntries = pgTable('diary_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  moodScore: smallint('mood_score'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (table) => [table.unique().on(table.userId, table.name)],
);

export const diaryEntryTags = pgTable('diary_entry_tags', {
  entryId: uuid('entry_id')
    .notNull()
    .references(() => diaryEntries.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const diaryMedia = pgTable('diary_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => diaryEntries.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: text('size_bytes'),
});

export const diaryEntriesRelations = relations(diaryEntries, ({ many, one }) => ({
  user: one(users, {
    fields: [diaryEntries.userId],
    references: [users.id],
  }),
  tags: many(diaryEntryTags),
  media: many(diaryMedia),
}));

export const tagsRelations = relations(tags, ({ many, one }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  entries: many(diaryEntryTags),
}));

// ==================== FINANCE ====================

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  currencyCode: text('currency_code', { length: 3 }).notNull(),
  balanceMinor: bigint('balance_minor', { mode: 'number' }).notNull(),
});

export const transactionCategories = pgTable('transaction_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  parentId: uuid('parent_id').references((): any => transactionCategories.id),
  kind: text('kind', { enum: ['income', 'expense'] }).notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id')
    .references(() => transactionCategories.id, { onDelete: 'set null' }),
  kind: text('kind', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
});

export const transfers = pgTable('transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  fromAccountId: uuid('from_account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  toAccountId: uuid('to_account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
});

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => transactionCategories.id, { onDelete: 'cascade' }),
  period: text('period', { enum: ['daily', 'weekly', 'monthly', 'yearly'] }).notNull(),
  limitMinor: bigint('limit_minor', { mode: 'number' }).notNull(),
});

export const recurringRules = pgTable('recurring_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .references(() => transactionCategories.id, { onDelete: 'set null' }),
  rrule: text('rrule').notNull(),
  amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
  nextRunAt: timestamp('next_run_at'),
});

export const investmentAssets = pgTable('investment_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  currencyCode: text('currency_code', { length: 3 }).notNull(),
});

export const investmentPositions = pgTable('investment_positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => investmentAssets.id, { onDelete: 'cascade' }),
  quantity: text('quantity').notNull(),
  avgPriceMinor: bigint('avg_price_minor', { mode: 'number' }).notNull(),
});

// ==================== NUTRITION ====================

export const foodItems = pgTable('food_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').notNull(),
  externalId: text('external_id'),
  name: text('name').notNull(),
  kcal: text('kcal'),
  proteinG: text('protein_g'),
  fatG: text('fat_g'),
  carbsG: text('carbs_g'),
  barcode: text('barcode'),
});

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  instructions: text('instructions'),
});

export const recipeItems = pgTable('recipe_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  foodItemId: uuid('food_item_id')
    .notNull()
    .references(() => foodItems.id, { onDelete: 'restrict' }),
  grams: text('grams').notNull(),
});

export const mealLogs = pgTable('meal_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  eatenAt: timestamp('eaten_at').notNull().defaultNow(),
  mealType: text('meal_type', { enum: ['breakfast', 'lunch', 'dinner', 'snack'] }).notNull(),
});

export const mealItems = pgTable('meal_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  mealLogId: uuid('meal_log_id')
    .notNull()
    .references(() => mealLogs.id, { onDelete: 'cascade' }),
  foodItemId: uuid('food_item_id')
    .notNull()
    .references(() => foodItems.id, { onDelete: 'restrict' }),
  grams: text('grams').notNull(),
});

export const waterLogs = pgTable('water_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  consumedAt: timestamp('consumed_at').notNull().defaultNow(),
  amountMl: text('amount_ml').notNull(),
});

// ==================== FITNESS ====================

export const exerciseDefinitions = pgTable('exercise_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  muscleGroup: text('muscle_group'),
  equipment: text('equipment'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workoutSessions = pgTable('workout_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  notes: text('notes'),
  title: text('title'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exerciseDefinitions.id, { onDelete: 'restrict' }),
  sortOrder: text('sort_order').notNull().default('0'),
});

export const workoutSets = pgTable('workout_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutExerciseId: uuid('workout_exercise_id')
    .notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),
  reps: text('reps'),
  weightGrams: text('weight_grams'),
  restSeconds: text('rest_seconds'),
  setOrder: text('set_order').notNull().default('0'),
  isWarmup: text('is_warmup').notNull().default('false'),
  rpe: text('rpe'),
  failure: text('failure').notNull().default('false'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Body Weight Tracking
export const bodyWeightLogs = pgTable('body_weight_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  weightGrams: text('weight_grams').notNull(),
  notes: text('notes'),
  loggedAt: timestamp('logged_at').notNull().defaultNow(),
});

// ==================== COLLECTIONS ====================

export const collectionItems = pgTable('collection_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['book', 'movie', 'recipe', 'supplement'] }).notNull(),
  title: text('title').notNull(),
  status: text('status', { enum: ['planned', 'in_progress', 'completed', 'dropped'] }).notNull(),
  rating: smallint('rating'),
  metadata: jsonb('metadata').default('{}'),
  notes: text('notes'),
  coverUrl: text('cover_url'),
  sourceUrl: text('source_url'),
  dateStarted: timestamp('date_started'),
  dateCompleted: timestamp('date_completed'),
  rewatchCount: text('rewatch_count').notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==================== FEED / SOCIAL ====================

export const feedPosts = pgTable(
  'feed_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .references(() => activityEvents.id, { onDelete: 'cascade' }),
    content: text('content'),
    visibility: text('visibility', { enum: ['private', 'friends', 'public'] })
      .notNull()
      .default('private'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_feed_posts_user_created_at').on(table.userId, table.createdAt),
  ],
);

export const feedComments = pgTable('feed_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => feedPosts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const feedLikes = pgTable(
  'feed_likes',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => feedPosts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [table.primaryKey({ columns: [table.postId, table.userId] })],
);

// Helper for bigint
function bigint(name: string, opts: { mode: 'number' }) {
  return (require('drizzle-orm/pg-core') as any).bigint(name, { mode: 'number' });
}

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export type InsertActivityEvent = typeof activityEvents.$inferInsert;
export type SelectActivityEvent = typeof activityEvents.$inferSelect;
