import { supabase } from '../../../lib/supabase';

// --- Goals ---

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
  icon?: string;
  color?: string;
}

export const goalService = {
  async list(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        name: input.name,
        target_amount: input.target_amount,
        current_amount: input.current_amount ?? 0,
        deadline: input.deadline ?? null,
        icon: input.icon ?? '🎯',
        color: input.color ?? '#5B6CFF',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addAmount(id: string, amount: number): Promise<Goal> {
    const goal = await this.get(id);
    if (!goal) throw new Error('Цель не найдена');
    return this.update(id, { current_amount: goal.current_amount + amount });
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
  },
};

// --- Investments ---

export interface InvestmentAsset {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  currency_code: string;
  created_at: string;
}

export interface InvestmentPosition {
  id: string;
  user_id: string;
  asset_id: string;
  quantity: string;
  avg_price_minor: number;
  created_at: string;
}

export const investmentService = {
  async listPositions(): Promise<(InvestmentPosition & { asset?: InvestmentAsset })[]> {
    const { data, error } = await supabase
      .from('investment_positions')
      .select(`
        *,
        investment_assets (
          id, symbol, name, currency_code
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addPosition(input: { asset_id: string; quantity: string; avg_price_minor: number }): Promise<InvestmentPosition> {
    const { data, error } = await supabase
      .from('investment_positions')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase.from('investment_positions').delete().eq('id', id);
    if (error) throw error;
  },
};
