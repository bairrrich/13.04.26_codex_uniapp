import { supabase } from '../../../lib/supabase';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

// ============================================================
// TYPES
// ============================================================

export interface NutritionGoal {
  id: string;
  user_id: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  water_ml: number;
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  eaten_at: string;
  notes: string | null;
  created_at: string;
  items?: MealItem[];
}

export interface MealItem {
  id: string;
  meal_log_id: string;
  food_item_id: string | null;
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
}

export interface FoodItem {
  id: string;
  source: string;
  external_id: string | null;
  name: string;
  kcal: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  barcode: string | null;
}

export interface WaterLog {
  id: string;
  user_id: string;
  consumed_at: string;
  amount_ml: number;
}

export interface DailyNutrition {
  date: string;
  goal: NutritionGoal | null;
  consumed: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    water_ml: number;
  };
  meals: (MealLog & { items: MealItem[] })[];
}

export interface MealTemplate {
  id: string;
  user_id: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: { name: string; grams: number; calories: number; protein_g: number; fat_g: number; carbs_g: number }[];
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  instructions: string | null;
  created_at: string;
  items?: RecipeItem[];
  nutrition?: { calories: number; protein_g: number; fat_g: number; carbs_g: number };
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  food_item_id: string | null;
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

// ============================================================
// PAGINATION
// ============================================================

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

// ============================================================
// NUTRITION GOALS
// ============================================================

export const goalService = {
  async get(): Promise<NutritionGoal | null> {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsert(input: Omit<NutritionGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<NutritionGoal> {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .upsert(input, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================================
// FOOD DATABASE
// ============================================================

export const foodService = {
  async search(query: string, limit = 20): Promise<FoodItem[]> {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async list(limit = 50, offset = 0): Promise<PaginatedResult<FoodItem>> {
    const [{ data, error }, countResult] = await Promise.all([
      supabase.from('food_items').select('*').order('name').range(offset, offset + limit - 1),
      supabase.from('food_items').select('*', { count: 'exact', head: true }),
    ]);
    if (error) throw error;
    return {
      data: data || [],
      total: countResult.count ?? 0,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: (countResult.count ?? 0) > offset + limit,
    };
  },

  async getById(id: string): Promise<FoodItem | null> {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    const { data, error } = await supabase
      .from('food_items')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================================
// MEAL LOGS
// ============================================================

export const mealLogService = {
  async listByDate(date: string): Promise<(MealLog & { items: MealItem[] })[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('meal_logs')
      .select(`
        *,
        meal_items (
          id, meal_log_id, food_item_id, name, grams,
          calories, protein_g, fat_g, carbs_g, fiber_g
        )
      `)
      .gte('eaten_at', startOfDay.toISOString())
      .lte('eaten_at', endOfDay.toISOString())
      .order('eaten_at', { ascending: true });
    if (error) {
      // Fallback if new columns don't exist yet
      const { data: basicData, error: basicError } = await supabase
        .from('meal_logs')
        .select(`
          *,
          meal_items (
            id, meal_log_id, food_item_id, name, grams
          )
        `)
        .gte('eaten_at', startOfDay.toISOString())
        .lte('eaten_at', endOfDay.toISOString())
        .order('eaten_at', { ascending: true });
      if (basicError) throw basicError;
      return (basicData || []).map((m: any) => ({
        ...m,
        items: (m.meal_items || []).map((item: any) => ({
          ...item,
          calories: 0,
          protein_g: 0,
          fat_g: 0,
          carbs_g: 0,
          fiber_g: 0,
        })),
      }));
    }
    return (data || []).map((m: any) => ({
      ...m,
      items: m.meal_items || [],
    }));
  },

  async create(input: {
    meal_type: MealLog['meal_type'];
    eaten_at?: string;
    notes?: string;
  }): Promise<MealLog> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        meal_type: input.meal_type,
        eaten_at: input.eaten_at || new Date().toISOString(),
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('meal_logs').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// MEAL ITEMS
// ============================================================

export const mealItemService = {
  async create(input: {
    meal_log_id: string;
    food_item_id: string | null;
    name: string;
    grams: number;
    calories?: number;
    protein_g?: number;
    fat_g?: number;
    carbs_g?: number;
    fiber_g?: number;
  }): Promise<MealItem> {
    const { data, error } = await supabase
      .from('meal_items')
      .insert({
        meal_log_id: input.meal_log_id,
        food_item_id: input.food_item_id,
        name: input.name,
        grams: input.grams,
        ...(input.calories !== undefined && { calories: Math.round(input.calories) }),
        ...(input.protein_g !== undefined && { protein_g: Math.round(input.protein_g * 10) / 10 }),
        ...(input.fat_g !== undefined && { fat_g: Math.round(input.fat_g * 10) / 10 }),
        ...(input.carbs_g !== undefined && { carbs_g: Math.round(input.carbs_g * 10) / 10 }),
        ...(input.fiber_g !== undefined && { fiber_g: Math.round(input.fiber_g * 10) / 10 }),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('meal_items').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// WATER LOGS
// ============================================================

export const waterLogService = {
  async listByDate(date: string): Promise<WaterLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .gte('consumed_at', startOfDay.toISOString())
      .lte('consumed_at', endOfDay.toISOString())
      .order('consumed_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async getTotalByDate(date: string): Promise<number> {
    const logs = await this.listByDate(date);
    return logs.reduce((sum, l) => sum + l.amount_ml, 0);
  },

  async create(input: { amount_ml: number; consumed_at?: string }): Promise<WaterLog> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('water_logs')
      .insert({
        user_id: userId,
        amount_ml: input.amount_ml,
        consumed_at: input.consumed_at || new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('water_logs').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// MEAL TEMPLATES
// ============================================================

export const mealTemplateService = {
  async list(): Promise<MealTemplate[]> {
    const { data, error } = await supabase
      .from('meal_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(input: {
    name: string;
    meal_type: MealTemplate['meal_type'];
    items: { name: string; grams: number; calories: number; protein_g: number; fat_g: number; carbs_g: number }[];
  }): Promise<MealTemplate> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('meal_templates')
      .insert({
        user_id: userId,
        name: input.name,
        meal_type: input.meal_type,
        items: input.items,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('meal_templates').delete().eq('id', id);
    if (error) throw error;
  },

  async applyToMeal(templateId: string, mealLogId: string): Promise<void> {
    const { data: template, error: templateError } = await supabase
      .from('meal_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    if (templateError) throw templateError;

    const items = (template.items || []) as any[];
    for (const item of items) {
      await mealItemService.create({
        meal_log_id: mealLogId,
        food_item_id: null,
        name: item.name,
        grams: item.grams,
        calories: item.calories,
        protein_g: item.protein_g,
        fat_g: item.fat_g,
        carbs_g: item.carbs_g,
      });
    }
  },
};

// ============================================================
// RECIPES
// ============================================================

export const recipeService = {
  async list(limit = 20): Promise<Recipe[]> {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<(Recipe & { items: RecipeItem[]; nutrition: { calories: number; protein_g: number; fat_g: number; carbs_g: number } }) | null> {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_items (
          id, recipe_id, food_item_id, name, grams,
          calories, protein_g, fat_g, carbs_g
        )
      `)
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    const items = data.recipe_items || [];
    const nutrition = items.reduce(
      (acc: { calories: number; protein_g: number; fat_g: number; carbs_g: number }, item: any) => ({
        calories: acc.calories + (item.calories || 0),
        protein_g: acc.protein_g + (item.protein_g || 0),
        fat_g: acc.fat_g + (item.fat_g || 0),
        carbs_g: acc.carbs_g + (item.carbs_g || 0),
      }),
      { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 }
    );
    return {
      ...data,
      items,
      nutrition,
      recipe_items: undefined,
    } as any;
  },

  async create(input: {
    title: string;
    description?: string;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    servings?: number;
    instructions?: string;
    items: { name: string; grams: number; calories: number; protein_g: number; fat_g: number; carbs_g: number }[];
  }): Promise<Recipe> {
    const userId = await getCurrentUserId();
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description ?? null,
        prep_time_minutes: input.prep_time_minutes ?? null,
        cook_time_minutes: input.cook_time_minutes ?? null,
        servings: input.servings ?? 1,
        instructions: input.instructions ?? null,
      })
      .select()
      .single();
    if (recipeError) throw recipeError;

    for (const item of input.items) {
      await supabase.from('recipe_items').insert({
        recipe_id: recipe.id,
        name: item.name,
        grams: item.grams,
        calories: Math.round(item.calories),
        protein_g: Math.round(item.protein_g * 10) / 10,
        fat_g: Math.round(item.fat_g * 10) / 10,
        carbs_g: Math.round(item.carbs_g * 10) / 10,
      });
    }

    return recipe;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================================
// DAILY SUMMARY
// ============================================================

export async function getDailyNutrition(date: string): Promise<DailyNutrition> {
  const goal = await goalService.get();
  const meals = await mealLogService.listByDate(date);
  const waterTotal = await waterLogService.getTotalByDate(date);

  const consumed = meals.reduce(
    (acc: DailyNutrition['consumed'], meal) => {
      meal.items.forEach((item) => {
        acc.calories += item.calories || 0;
        acc.protein_g += item.protein_g || 0;
        acc.fat_g += item.fat_g || 0;
        acc.carbs_g += item.carbs_g || 0;
        acc.fiber_g += item.fiber_g || 0;
      });
      return acc;
    },
    { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0, fiber_g: 0, water_ml: waterTotal }
  );

  return {
    date,
    goal: goal || null,
    consumed,
    meals,
  };
}

export interface WeeklySummary {
  days: {
    date: string;
    dayName: string;
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    water_ml: number;
    mealCount: number;
  }[];
}

export async function getWeeklySummary(endDate?: string): Promise<WeeklySummary> {
  const end = endDate ? new Date(endDate) : new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  // Fetch all meal logs and water logs for the 7-day range in single requests
  const startStr = start.toISOString();
  const endStr = new Date(end.getTime() + 86400000).toISOString(); // end of day

  const [mealsResult, waterResult, goal] = await Promise.all([
    supabase
      .from('meal_logs')
      .select(`*, meal_items(*)`)
      .gte('eaten_at', startStr)
      .lte('eaten_at', endStr),
    supabase
      .from('water_logs')
      .select('consumed_at, amount_ml')
      .gte('consumed_at', startStr)
      .lte('consumed_at', endStr),
    goalService.get(),
  ]);

  const meals = (mealsResult.data || []) as any[];
  const waterLogs = (waterResult.data || []) as any[];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMeals = meals.filter((m) => {
      const t = new Date(m.eaten_at).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    });

    let calories = 0, protein_g = 0, fat_g = 0, carbs_g = 0, fiber_g = 0;
    dayMeals.forEach((m) => {
      (m.meal_items || []).forEach((item: any) => {
        calories += item.calories || 0;
        protein_g += item.protein_g || 0;
        fat_g += item.fat_g || 0;
        carbs_g += item.carbs_g || 0;
        fiber_g += item.fiber_g || 0;
      });
    });

    const dayWater = waterLogs
      .filter((w) => {
        const t = new Date(w.consumed_at).getTime();
        return t >= dayStart.getTime() && t <= dayEnd.getTime();
      })
      .reduce((sum, w) => sum + w.amount_ml, 0);

    days.push({
      date: dateStr,
      dayName,
      calories,
      protein_g,
      fat_g,
      carbs_g,
      water_ml: dayWater,
      mealCount: dayMeals.length,
    });
  }

  return { days };
}
