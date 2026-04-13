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

export const mealLogService = {
  async list(limit = 50): Promise<MealLog[]> {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*, items:meal_items(*)')
      .order('eaten_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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

export const waterLogService = {
  async list(limit = 20): Promise<WaterLog[]> {
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .order('consumed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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
