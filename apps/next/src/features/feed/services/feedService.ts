import { supabase } from '../../../lib/supabase';

export interface FeedPost {
  id: string;
  user_id: string;
  event_id: string | null;
  content: string;
  visibility: 'private' | 'friends' | 'public';
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  type: string;
  entity_type: string;
  entity_id: string;
  visibility: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export const feedService = {
  // Feed posts
  async list(limit = 50): Promise<FeedPost[]> {
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async create(input: { content: string; visibility?: FeedPost['visibility'] }): Promise<FeedPost> {
    const { data, error } = await supabase
      .from('feed_posts')
      .insert({
        content: input.content,
        visibility: input.visibility ?? 'private',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('feed_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Activity events
  async listEvents(limit = 50): Promise<ActivityEvent[]> {
    const { data, error } = await supabase
      .from('activity_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async createEvent(input: {
    type: string;
    entityType: string;
    entityId: string;
    visibility?: string;
    payload?: Record<string, unknown>;
  }): Promise<ActivityEvent> {
    const { data, error } = await supabase
      .from('activity_events')
      .insert({
        type: input.type,
        entity_type: input.entityType,
        entity_id: input.entityId,
        visibility: input.visibility ?? 'private',
        payload: input.payload ?? {},
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
