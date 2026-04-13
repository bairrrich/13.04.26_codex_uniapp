import { supabase } from '../../../lib/supabase';

export type CollectionType = 'book' | 'movie' | 'recipe' | 'supplement';
export type CollectionStatus = 'planned' | 'in_progress' | 'completed' | 'dropped';

export interface CollectionItem {
  id: string;
  user_id: string;
  type: CollectionType;
  title: string;
  status: CollectionStatus;
  rating: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  type?: CollectionType;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

export interface TypeCount {
  type: CollectionType;
  count: number;
}

export const collectionsService = {
  async list(options?: ListOptions): Promise<PaginatedResult<CollectionItem>> {
    const { limit = 50, offset = 0, type } = options ?? {};

    let query = supabase
      .from('collection_items')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const total = count ?? 0;

    return {
      data: data || [],
      total,
      hasMore: offset + limit < total,
    };
  },

  async listByType(type: CollectionType, limit = 50): Promise<CollectionItem[]> {
    const result = await this.list({ type, limit });
    return result.data;
  },

  async countByType(): Promise<TypeCount[]> {
    const types: CollectionType[] = ['book', 'movie', 'recipe', 'supplement'];

    const counts = await Promise.all(
      types.map(async (type) => {
        const { count, error } = await supabase
          .from('collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('type', type);

        if (error) throw error;
        return { type, count: count ?? 0 };
      }),
    );

    return counts;
  },

  async create(input: {
    type: CollectionType;
    title: string;
    status?: CollectionStatus;
    rating?: number;
    metadata?: Record<string, unknown>;
  }): Promise<CollectionItem> {
    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        type: input.type,
        title: input.title,
        status: input.status ?? 'planned',
        rating: input.rating ?? null,
        metadata: input.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: Partial<CollectionItem>): Promise<CollectionItem> {
    const { data, error } = await supabase
      .from('collection_items')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('collection_items').delete().eq('id', id);
    if (error) throw error;
  },
};
