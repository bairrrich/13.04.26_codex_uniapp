import { supabase } from '../../../lib/supabase';

// ============================================================
// TYPES
// ============================================================

export interface Account {
  id: string;
  user_id: string;
  name: string;
  currency_code: string;
  balance_minor: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  kind: 'income' | 'expense' | 'transfer';
  amount_minor: number;
  description: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  parent_id: string | null;
  kind: 'income' | 'expense';
  color: string;
  icon: string | null;
  created_at: string;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount_minor: number;
  description: string | null;
  occurred_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  limit_minor: number;
  created_at: string;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  rrule: string;
  amount_minor: number;
  next_run_at: string | null;
  active: boolean;
}

// Filter/Search
export interface TransactionFilters {
  kind?: 'income' | 'expense' | 'transfer';
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
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

// Analytics
export interface FinanceStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
  total: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

// ============================================================
// SERVICES
// ============================================================

// --- Accounts ---

export const accountService = {
  async list(pagination?: PaginationParams): Promise<PaginatedResult<Account>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const offset = (page - 1) * limit;

    const [{ data, error }, countResult] = await Promise.all([
      supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true }),
    ]);

    if (error) throw error;
    return {
      data: data || [],
      total: countResult.count ?? 0,
      page,
      limit,
      hasMore: (countResult.count ?? 0) > offset + limit,
    };
  },

  async listAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: { name: string; currency_code?: string; balance_minor?: number }): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: input.name,
        currency_code: input.currency_code ?? 'RUB',
        balance_minor: input.balance_minor ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) throw error;
  },

  async getTotalBalance(): Promise<number> {
    const { data, error } = await supabase
      .from('accounts')
      .select('balance_minor');
    if (error) throw error;
    return (data || []).reduce((sum, a) => sum + a.balance_minor, 0);
  },
};

// --- Transactions ---

export const transactionService = {
  async list(filters?: TransactionFilters, pagination?: PaginationParams): Promise<PaginatedResult<Transaction>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('occurred_at', { ascending: false });

    if (filters?.kind) query = query.eq('kind', filters.kind);
    if (filters?.accountId) query = query.eq('account_id', filters.accountId);
    if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
    if (filters?.dateFrom) query = query.gte('occurred_at', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('occurred_at', filters.dateTo);
    if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data || [],
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > offset + limit,
    };
  },

  async get(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: {
    account_id: string;
    category_id?: string | null;
    kind: 'income' | 'expense';
    amount_minor: number;
    description?: string;
    occurred_at?: string;
  }): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        account_id: input.account_id,
        category_id: input.category_id ?? null,
        kind: input.kind,
        amount_minor: input.amount_minor,
        description: input.description ?? null,
        occurred_at: input.occurred_at ?? new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
  },

  async getStats(dateFrom?: string, dateTo?: string): Promise<FinanceStats> {
    let query = supabase.from('transactions').select('kind, amount_minor');
    if (dateFrom) query = query.gte('occurred_at', dateFrom);
    if (dateTo) query = query.lte('occurred_at', dateTo);

    const { data, error } = await query;
    if (error) throw error;

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const tx of data || []) {
      if (tx.kind === 'income') {
        totalIncome += tx.amount_minor;
        incomeCount++;
      } else {
        totalExpense += tx.amount_minor;
        expenseCount++;
      }
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
    };
  },

  async getCategoryBreakdown(kind: 'income' | 'expense', limit = 10): Promise<CategoryBreakdown[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        category_id,
        amount_minor,
        transaction_categories!inner (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('kind', kind)
      .not('category_id', 'is', null);

    if (error) throw error;

    const breakdown: Record<string, CategoryBreakdown> = {};

    for (const tx of data || []) {
      const cat = tx.transaction_categories as any;
      const key = tx.category_id;
      if (!breakdown[key]) {
        breakdown[key] = {
          category_id: key,
          category_name: cat?.name ?? 'Без категории',
          category_color: cat?.color ?? '#888',
          category_icon: cat?.icon ?? null,
          total: 0,
          count: 0,
        };
      }
      breakdown[key].total += tx.amount_minor;
      breakdown[key].count++;
    }

    return Object.values(breakdown)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  },

  async getMonthlyTrend(months = 6): Promise<MonthlyTrend[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('kind, amount_minor, occurred_at')
      .gte('occurred_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('occurred_at');

    if (error) throw error;

    const monthly: Record<string, { income: number; expense: number }> = {};

    for (const tx of data || []) {
      const month = new Date(tx.occurred_at).toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
      if (!monthly[month]) monthly[month] = { income: 0, expense: 0 };
      if (tx.kind === 'income') monthly[month].income += tx.amount_minor;
      else monthly[month].expense += tx.amount_minor;
    }

    return Object.entries(monthly)
      .map(([month, vals]) => ({ month, ...vals }))
      .slice(-months);
  },
};

// --- Categories ---

export const categoryService = {
  async list(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .order('kind')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: { name: string; kind: 'income' | 'expense'; color?: string; icon?: string }): Promise<Category> {
    const { data, error } = await supabase
      .from('transaction_categories')
      .insert({
        name: input.name,
        kind: input.kind,
        color: input.color ?? '#5B6CFF',
        icon: input.icon ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase
      .from('transaction_categories')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('transaction_categories').delete().eq('id', id);
    if (error) throw error;
  },
};

// --- Transfers ---

export const transferService = {
  async list(limit = 20): Promise<Transfer[]> {
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async create(input: {
    from_account_id: string;
    to_account_id: string;
    amount_minor: number;
    description?: string;
    occurred_at?: string;
  }): Promise<Transfer> {
    const { data, error } = await supabase
      .from('transfers')
      .insert({
        from_account_id: input.from_account_id,
        to_account_id: input.to_account_id,
        amount_minor: input.amount_minor,
        description: input.description ?? null,
        occurred_at: input.occurred_at ?? new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    // Update account balances
    await accountService.update(input.from_account_id, {
      balance_minor: (await accountService.get(input.from_account_id))!.balance_minor - input.amount_minor,
    });
    await accountService.update(input.to_account_id, {
      balance_minor: (await accountService.get(input.to_account_id))!.balance_minor + input.amount_minor,
    });

    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('transfers').delete().eq('id', id);
    if (error) throw error;
  },
};

// --- Budgets ---

export const budgetService = {
  async list(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return data || [];
  },

  async create(input: { category_id: string; period: Budget['period']; limit_minor: number }): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  async getSpent(categoryId: string, period: Budget['period']): Promise<number> {
    const now = new Date();
    let dateFrom: Date;

    switch (period) {
      case 'daily':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        dateFrom = new Date(now);
        dateFrom.setDate(now.getDate() - now.getDay());
        break;
      case 'monthly':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('amount_minor')
      .eq('category_id', categoryId)
      .eq('kind', 'expense')
      .gte('occurred_at', dateFrom.toISOString());

    if (error) throw error;
    return (data || []).reduce((sum, tx) => sum + tx.amount_minor, 0);
  },
};

// --- Recurring Rules ---

export const recurringService = {
  async list(): Promise<RecurringRule[]> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .select('*')
      .order('next_run_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(input: {
    account_id: string;
    category_id?: string | null;
    rrule: string;
    amount_minor: number;
  }): Promise<RecurringRule> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .insert({
        ...input,
        next_run_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<RecurringRule>): Promise<RecurringRule> {
    const { data, error } = await supabase
      .from('recurring_rules')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('recurring_rules').delete().eq('id', id);
    if (error) throw error;
  },

  async toggle(id: string, active: boolean): Promise<RecurringRule> {
    return this.update(id, { active });
  },
};
