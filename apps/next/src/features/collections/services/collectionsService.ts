import { supabase } from '../../../lib/supabase';

// ============================================================
// Types
// ============================================================

export type CollectionType = 'book' | 'movie' | 'recipe' | 'supplement';
export type CollectionStatus = 'planned' | 'in_progress' | 'completed' | 'dropped';

// Book-specific fields (stored in metadata jsonb)
export interface BookMetadata {
  author?: string;
  isbn?: string;
  totalPages?: number;
  currentPage?: number;
  format?: 'hardcover' | 'paperback' | 'ebook' | 'audiobook';
  seriesName?: string;
  seriesNumber?: number;
  publisher?: string;
  publishedYear?: number;
  genre?: string[];
  language?: string;
}

// Movie-specific fields
export interface MovieMetadata {
  director?: string;
  releaseYear?: number;
  runtimeMinutes?: number;
  genres?: string[];
  watchDate?: string;
  streamingPlatform?: string;
  cast?: string[];
  tmdbId?: string;
  originalTitle?: string;
  country?: string;
}

// Recipe-specific fields
export interface RecipeMetadata {
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisineType?: string;
  dietaryTags?: string[];
  ingredients?: { name: string; amount: string }[];
  steps?: string[];
  sourceUrl?: string;
}

// Supplement-specific fields
export interface SupplementMetadata {
  dosage?: string;
  frequency?: 'daily' | 'weekly' | 'as_needed' | 'custom';
  brand?: string;
  purpose?: string;
  formType?: 'pill' | 'capsule' | 'powder' | 'liquid' | 'gummy' | 'patch';
  expiryDate?: string;
  priceMinor?: number;
  startDate?: string;
  endDate?: string;
  effectivenessRating?: number;
  warnings?: string[];
}

export type CollectionMetadataMap = {
  book: BookMetadata;
  movie: MovieMetadata;
  recipe: RecipeMetadata;
  supplement: SupplementMetadata;
};

export interface CollectionItem<T extends CollectionType = CollectionType> {
  id: string;
  user_id: string;
  type: T;
  title: string;
  status: CollectionStatus;
  rating: number | null;
  metadata: CollectionMetadataMap[T];
  notes: string | null;
  cover_url: string | null;
  source_url: string | null;
  date_started: string | null;
  date_completed: string | null;
  rewatch_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionInput<T extends CollectionType = CollectionType> {
  type: T;
  title: string;
  status?: CollectionStatus;
  rating?: number;
  metadata?: CollectionMetadataMap[T];
  notes?: string;
  cover_url?: string;
  source_url?: string;
  date_started?: string;
  date_completed?: string;
}

export interface UpdateCollectionInput {
  status?: CollectionStatus;
  rating?: number | null;
  metadata?: Partial<CollectionMetadataMap[CollectionType]>;
  notes?: string | null;
  cover_url?: string | null;
  source_url?: string | null;
  date_started?: string | null;
  date_completed?: string | null;
  rewatch_count?: number;
  title?: string;
}

export interface ListOptions {
  limit?: number;
  offset?: number;
  type?: CollectionType;
  status?: CollectionStatus;
  search?: string;
  sortBy?: 'created_at' | 'updated_at' | 'rating' | 'title' | 'date_started' | 'date_completed';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TypeCount {
  type: CollectionType;
  count: number;
}

export interface CollectionStats {
  total: number;
  byType: Record<CollectionType, number>;
  byStatus: Record<CollectionStatus, number>;
  avgRating: number | null;
  completedThisMonth: number;
}

export interface ReadingChallenge {
  year: number;
  goal: number;
  completed: number;
}

// ============================================================
// Service
// ============================================================

export const collectionsService = {
  async list<T extends CollectionType = CollectionType>(
    options: ListOptions = {},
  ): Promise<PaginatedResult<CollectionItem<T>>> {
    const { limit = 50, offset = 0, type, status, search, sortBy = 'created_at', sortOrder = 'desc' } = options;

    let query = supabase
      .from('collection_items')
      .select('*', { count: 'exact' });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, count, error } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    const total = count ?? 0;

    // Parse metadata for typed access
    const parsedData = (data || []).map((item) => ({
      ...item,
      rewatch_count: parseInt(item.rewatch_count, 10) || 0,
    }));

    return {
      data: parsedData as CollectionItem<T>[],
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + limit < total,
    };
  },

  async getById<T extends CollectionType = CollectionType>(id: string): Promise<CollectionItem<T> | null> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      rewatch_count: parseInt(data.rewatch_count, 10) || 0,
    } as CollectionItem<T>;
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

  async getStats(): Promise<CollectionStats> {
    const types: CollectionType[] = ['book', 'movie', 'recipe', 'supplement'];
    const statuses: CollectionStatus[] = ['planned', 'in_progress', 'completed', 'dropped'];

    const [totalResult, byTypeResults, byStatusResults, ratingResult, completedMonth] = await Promise.all([
      supabase.from('collection_items').select('*', { count: 'exact', head: true }),
      Promise.all(types.map(async (type) => {
        const { count } = await supabase.from('collection_items').select('*', { count: 'exact', head: true }).eq('type', type);
        return { type, count: count ?? 0 };
      })),
      Promise.all(statuses.map(async (status) => {
        const { count } = await supabase.from('collection_items').select('*', { count: 'exact', head: true }).eq('status', status);
        return { status, count: count ?? 0 };
      })),
      supabase.from('collection_items').select('rating').not('rating', 'is', null),
      (async () => {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from('collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('date_completed', monthStart.toISOString());
        return count ?? 0;
      })(),
    ]);

    const avgRating = ratingResult.data && ratingResult.data.length > 0
      ? ratingResult.data.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratingResult.data.length
      : null;

    const byType: Record<CollectionType, number> = {} as any;
    byTypeResults.forEach((r) => { byType[r.type] = r.count; });

    const byStatus: Record<CollectionStatus, number> = {} as any;
    byStatusResults.forEach((r) => { byStatus[r.status] = r.count; });

    return {
      total: totalResult.count ?? 0,
      byType,
      byStatus,
      avgRating,
      completedThisMonth: completedMonth,
    };
  },

  async create<T extends CollectionType = CollectionType>(
    input: CreateCollectionInput<T>,
  ): Promise<CollectionItem<T>> {
    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        type: input.type,
        title: input.title,
        status: input.status ?? 'planned',
        rating: input.rating ?? null,
        metadata: input.metadata ?? {},
        notes: input.notes ?? null,
        cover_url: input.cover_url ?? null,
        source_url: input.source_url ?? null,
        date_started: input.date_started ?? null,
        date_completed: input.date_completed ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      rewatch_count: parseInt(data.rewatch_count, 10) || 0,
    } as CollectionItem<T>;
  },

  async update(id: string, input: UpdateCollectionInput): Promise<CollectionItem> {
    const updateData: Record<string, any> = { ...input };
    if (input.rewatch_count !== undefined) {
      updateData.rewatch_count = String(input.rewatch_count);
    }
    delete updateData.rewatch_count;

    const { data, error } = await supabase
      .from('collection_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      rewatch_count: parseInt(data.rewatch_count, 10) || 0,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('collection_items').delete().eq('id', id);
    if (error) throw error;
  },

  // Book-specific queries
  async getCurrentlyReading(): Promise<CollectionItem<'book'>[]> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('*')
      .eq('type', 'book')
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((d) => ({ ...d, rewatch_count: parseInt(d.rewatch_count, 10) || 0 })) as CollectionItem<'book'>[];
  },

  async getReadingChallenge(year: number): Promise<ReadingChallenge> {
    const yearStart = new Date(year, 0, 1).toISOString();
    const yearEnd = new Date(year + 1, 0, 1).toISOString();

    const { count, error } = await supabase
      .from('collection_items')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'book')
      .eq('status', 'completed')
      .gte('date_completed', yearStart)
      .lt('date_completed', yearEnd);

    if (error) throw error;

    return { year, goal: 12, completed: count ?? 0 };
  },

  // Movie-specific queries
  async getWatchedByPlatform(): Promise<{ platform: string; count: number }[]> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('metadata')
      .eq('type', 'movie')
      .not('metadata', 'is', null);

    if (error) throw error;

    const platformMap: Record<string, number> = {};
    for (const item of data || []) {
      const meta = item.metadata as MovieMetadata;
      if (meta.streamingPlatform) {
        platformMap[meta.streamingPlatform] = (platformMap[meta.streamingPlatform] || 0) + 1;
      }
    }

    return Object.entries(platformMap)
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Supplement-specific queries
  async getActiveSupplements(): Promise<CollectionItem<'supplement'>[]> {
    const { data, error } = await supabase
      .from('collection_items')
      .select('*')
      .eq('type', 'supplement')
      .eq('status', 'in_progress');

    if (error) throw error;
    return (data || []).map((d) => ({ ...d, rewatch_count: parseInt(d.rewatch_count, 10) || 0 })) as CollectionItem<'supplement'>[];
  },

  async getExpiringSupplements(daysAhead = 30): Promise<CollectionItem<'supplement'>[]> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('collection_items')
      .select('*')
      .eq('type', 'supplement')
      .lte('metadata->>expiryDate', expiryDate.toISOString().slice(0, 10));

    if (error) throw error;
    return (data || []).map((d) => ({ ...d, rewatch_count: parseInt(d.rewatch_count, 10) || 0 })) as CollectionItem<'supplement'>[];
  },
};
