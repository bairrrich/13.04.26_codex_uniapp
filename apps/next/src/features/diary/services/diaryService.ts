import { supabase } from '../../../lib/supabase';

export interface DiaryEntry {
  id: string;
  user_id: string;
  content: string;
  mood_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDiaryEntryInput {
  content: string;
  mood_score?: number;
}

export interface UpdateDiaryEntryInput {
  content?: string;
  mood_score?: number;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
}

export const diaryService = {
  async list(limit = 50): Promise<DiaryEntry[]> {
    const { data, error } = await supabase
      .from('diary_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

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
};
