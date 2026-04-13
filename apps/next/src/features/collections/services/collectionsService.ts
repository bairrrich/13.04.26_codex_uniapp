import { supabase } from '../../../lib/supabase';

export interface CollectionItem {
  id: string;
  user_id: string;
  type: 'book' | 'movie' | 'recipe' | 'supplement';
  title: string;
  status: 'planned' | 'in_progress' | 'completed' | 'dropped';
  rating: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const collectionsService = {
  async list(limit = 50): Promise<CollectionItem[]> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async create(input: {
    type: CollectionItem['type'];
    title: string;
    status?: CollectionItem['status'];
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
