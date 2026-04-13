import { supabase } from '../../../lib/supabase';

export interface DiaryEntry {
  id: string;
  user_id: string;
  content: string;
  mood_score: number | null;
  created_at: string;
  updated_at: string;
  tags?: { tags: { name: string } }[];
}

export interface CreateDiaryEntryInput {
  content: string;
  mood_score?: number;
  tagIds?: string[];
}

export interface UpdateDiaryEntryInput {
  content?: string;
  mood_score?: number;
  tagIds?: string[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

export const diaryService = {
  async list(limit = 50, offset = 0): Promise<{ data: DiaryEntry[]; count: number | null }> {
    const { data, error, count } = await supabase
      .from('diary_entries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], count };
  },

  async search(query: string): Promise<DiaryEntry[]> {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async get(id: string): Promise<DiaryEntry | null> {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: CreateDiaryEntryInput): Promise<DiaryEntry> {
    const { data, error } = await supabase
      .from('diary_entries')
      .insert({
        content: input.content,
        mood_score: input.mood_score ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateDiaryEntryInput): Promise<DiaryEntry> {
    const { data, error } = await supabase
      .from('diary_entries')
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
      .from('diary_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMoodHistory(days = 30): Promise<{ date: string; mood: number }[]> {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('mood_score, created_at')
      .not('mood_score', 'is', null)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || [])
      .filter((e) => e.mood_score !== null)
      .map((e) => ({
        date: new Date(e.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        mood: e.mood_score as number,
      }));
  },

  // Tags
  async listTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createTag(name: string): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTag(id: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
