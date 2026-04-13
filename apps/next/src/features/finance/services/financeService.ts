import { supabase } from '../../../lib/supabase';

// --- Accounts ---

export interface Account {
  id: string;
  name: string;
  currency_code: string;
  balance_minor: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountInput {
  name: string;
  currency_code: string;
  balance_minor: number;
}

export interface UpdateAccountInput {
  name?: string;
  currency_code?: string;
  balance_minor?: number;
}

// --- Transactions ---

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  kind: 'income' | 'expense';
  amount_minor: number;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  account_id: string;
  category_id?: string | null;
  kind: 'income' | 'expense';
  amount_minor: number;
  occurred_at: string;
}

export interface UpdateTransactionInput {
  account_id?: string;
  category_id?: string | null;
  kind?: 'income' | 'expense';
  amount_minor?: number;
  occurred_at?: string;
}

// --- Categories ---

export interface Category {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  created_at: string;
}

export interface CreateCategoryInput {
  name: string;
  kind: 'income' | 'expense';
}

// --- Services ---

export const accountService = {
  async list(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

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

  async create(input: CreateAccountInput): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: input.name,
        currency_code: input.currency_code,
        balance_minor: input.balance_minor,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const transactionService = {
  async list(limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        account_id: input.account_id,
        category_id: input.category_id ?? null,
        kind: input.kind,
        amount_minor: input.amount_minor,
        occurred_at: input.occurred_at,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

export const categoryService = {
  async list(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: input.name,
        kind: input.kind,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
