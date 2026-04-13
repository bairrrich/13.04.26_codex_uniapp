import { supabase } from '../../../lib/supabase';

// ─── MealLogs ──────────────────────────────────────────────────────────────

export interface MealLog {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  eaten_at: string;
  created_at: string;
  items?: MealItem[];
}

export interface CreateMealLogInput {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  eaten_at?: string;
}

export interface MealItemInput {
  name: string;
  grams: number;
  food_item_id?: string;
}

export interface CreateMealWithItemsInput {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  eaten_at?: string;
  items: MealItemInput[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const mealLogService = {
  async list(params?: PaginationParams): Promise<PaginatedResult<MealLog>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('meal_logs')
      .select('*, items:meal_items(*)', { count: 'exact' })
      .order('eaten_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: data || [],
      total: count ?? 0,
      page,
      limit,
      hasMore: count != null && from + limit < count,
    };
  },

  async get(id: string): Promise<MealLog | null> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*, items:meal_items(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: CreateMealLogInput): Promise<MealLog> {
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        meal_type: input.meal_type,
        eaten_at: input.eaten_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createWithItems(input: CreateMealWithItemsInput): Promise<MealLog> {
    const { data: mealLog, error: mealError } = await supabase
      .from('meal_logs')
      .insert({
        meal_type: input.meal_type,
        eaten_at: input.eaten_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (mealError) throw mealError;

    if (input.items.length > 0) {
      const itemsToInsert = input.items.map((item) => ({
        meal_log_id: mealLog.id,
        food_item_id: item.food_item_id ?? null,
        name: item.name,
        grams: item.grams,
      }));

      const { error: itemsError } = await supabase
        .from('meal_items')
        .insert(itemsToInsert);

      if (itemsError) {
        // Rollback: delete the meal log if items insertion fails
        await supabase.from('meal_logs').delete().eq('id', mealLog.id);
        throw itemsError;
      }
    }

    // Fetch the meal log with items
    const { data, error: fetchError } = await supabase
      .from('meal_logs')
      .select('*, items:meal_items(*)')
      .eq('id', mealLog.id)
      .single();

    if (fetchError) throw fetchError;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ─── MealItems ─────────────────────────────────────────────────────────────

export interface MealItem {
  id: string;
  meal_log_id: string;
  food_item_id: string | null;
  name: string;
  grams: number;
  created_at: string;
}

export interface CreateMealItemInput {
  meal_log_id: string;
  food_item_id?: string;
  grams: number;
  name?: string;
}

export const mealItemService = {
  async create(input: CreateMealItemInput): Promise<MealItem> {
    const { data, error } = await supabase
      .from('meal_items')
      .insert({
        meal_log_id: input.meal_log_id,
        food_item_id: input.food_item_id ?? null,
        name: input.name ?? '',
        grams: input.grams,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ─── WaterLogs ─────────────────────────────────────────────────────────────

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  consumed_at: string;
  created_at: string;
}

export interface CreateWaterLogInput {
  amount_ml: number;
  consumed_at?: string;
}

export interface WaterTodayStats {
  total_ml: number;
  goal_ml: number;
  percentage: number;
  entries: number;
}

const DAILY_WATER_GOAL = 2000; // ml

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { start, end };
}

export const waterLogService = {
  async list(params?: PaginationParams): Promise<PaginatedResult<WaterLog>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('water_logs')
      .select('*', { count: 'exact' })
      .order('consumed_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: data || [],
      total: count ?? 0,
      page,
      limit,
      hasMore: count != null && from + limit < count,
    };
  },

  async getTodayTotal(): Promise<WaterTodayStats> {
    const { start, end } = getTodayRange();

    const { data, error } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .gte('consumed_at', start)
      .lt('consumed_at', end);

    if (error) throw error;

    const total_ml = data?.reduce((sum, log) => sum + log.amount_ml, 0) ?? 0;
    const entries = data?.length ?? 0;
    const percentage = Math.min((total_ml / DAILY_WATER_GOAL) * 100, 100);

    return {
      total_ml,
      goal_ml: DAILY_WATER_GOAL,
      percentage,
      entries,
    };
  },

  async create(input: CreateWaterLogInput): Promise<WaterLog> {
    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        amount_ml: input.amount_ml,
        consumed_at: input.consumed_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
