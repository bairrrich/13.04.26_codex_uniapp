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

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface FeedLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalEvents: number;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  total: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const feedService = {
  // Feed posts
  async list(params?: PaginationParams): Promise<PaginatedResult<FeedPost>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('feed_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: data || [],
      hasMore: count != null && from + limit < count,
      total: count ?? 0,
    };
  },

  async create(input: {
    content: string;
    visibility?: FeedPost['visibility'];
  }): Promise<FeedPost> {
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

  async createWithActivity(input: {
    content: string;
    visibility?: FeedPost['visibility'];
    eventType?: string;
    entityType?: string;
  }): Promise<{ post: FeedPost; event: ActivityEvent }> {
    const { data: post, error: postError } = await supabase
      .from('feed_posts')
      .insert({
        content: input.content,
        visibility: input.visibility ?? 'private',
      })
      .select()
      .single();

    if (postError) throw postError;

    const { data: event, error: eventError } = await supabase
      .from('activity_events')
      .insert({
        type: input.eventType ?? 'feed.created',
        entity_type: input.entityType ?? 'feed_post',
        entity_id: post.id,
        visibility: post.visibility,
        payload: { content_preview: input.content.slice(0, 100) },
      })
      .select()
      .single();

    if (eventError) throw eventError;

    return { post, event };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('feed_posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Likes
  async likePost(postId: string): Promise<FeedLike> {
    const { data, error } = await supabase
      .from('feed_likes')
      .insert({ post_id: postId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unlikePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('feed_likes')
      .delete()
      .eq('post_id', postId);

    if (error) throw error;
  },

  async getPostLikes(postId: string): Promise<{ count: number; liked: boolean }> {
    const { count, error: countError } = await supabase
      .from('feed_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) throw countError;

    const { data: likedData, error: likedError } = await supabase
      .from('feed_likes')
      .select('id')
      .eq('post_id', postId)
      .limit(1);

    if (likedError) throw likedError;

    return {
      count: count ?? 0,
      liked: (likedData?.length ?? 0) > 0,
    };
  },

  // Comments
  async listComments(postId: string, params?: PaginationParams): Promise<PaginatedResult<FeedComment>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('feed_comments')
      .select('*', { count: 'exact' })
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return {
      data: data || [],
      hasMore: count != null && from + limit < count,
      total: count ?? 0,
    };
  },

  async createComment(input: {
    postId: string;
    content: string;
  }): Promise<FeedComment> {
    const { data, error } = await supabase
      .from('feed_comments')
      .insert({
        post_id: input.postId,
        content: input.content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateComment(id: string, content: string): Promise<FeedComment> {
    const { data, error } = await supabase
      .from('feed_comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('feed_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Activity events
  async listEvents(params?: PaginationParams): Promise<PaginatedResult<ActivityEvent>> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('activity_events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      data: data || [],
      hasMore: count != null && from + limit < count,
      total: count ?? 0,
    };
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

  // Stats
  async getStats(): Promise<FeedStats> {
    const [postsResult, commentsResult, likesResult, eventsResult] = await Promise.all([
      supabase.from('feed_posts').select('*', { count: 'exact', head: true }),
      supabase.from('feed_comments').select('*', { count: 'exact', head: true }),
      supabase.from('feed_likes').select('*', { count: 'exact', head: true }),
      supabase.from('activity_events').select('*', { count: 'exact', head: true }),
    ]);

    if (postsResult.error) throw postsResult.error;
    if (commentsResult.error) throw commentsResult.error;
    if (likesResult.error) throw likesResult.error;
    if (eventsResult.error) throw eventsResult.error;

    return {
      totalPosts: postsResult.count ?? 0,
      totalComments: commentsResult.count ?? 0,
      totalLikes: likesResult.count ?? 0,
      totalEvents: eventsResult.count ?? 0,
    };
  },
};
