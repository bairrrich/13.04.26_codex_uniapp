import { supabase } from '../../../lib/supabase';

export interface WorkoutSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkoutSessionInput {
  started_at?: string;
  notes?: string;
}

export interface UpdateWorkoutSessionInput {
  ended_at?: string;
  notes?: string;
}

export interface ExerciseDefinition {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  created_at: string;
}

export interface CreateExerciseDefinitionInput {
  name: string;
  muscle_group?: string;
}

export interface WorkoutSet {
  id: string;
  user_id: string;
  workout_exercise_id: string;
  reps: number;
  weight_grams: number;
  rest_seconds: number | null;
  set_order: number;
  created_at: string;
}

export interface CreateWorkoutSetInput {
  workout_exercise_id: string;
  reps: number;
  weight_grams: number;
  rest_seconds?: number;
  set_order: number;
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

export interface WorkoutStatistics {
  totalSessions: number;
  totalDurationMinutes: number;
}

export const fitnessService = {
  // WorkoutSessions
  async list(
    params: PaginationParams = {},
  ): Promise<PaginatedResult<WorkoutSession>> {
    const { page = 1, limit = 50 } = params;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('workout_sessions')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      data: data || [],
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > offset + (data?.length ?? 0),
    };
  },

  async get(id: string): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async create(input: CreateWorkoutSessionInput): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        started_at: input.started_at ?? new Date().toISOString(),
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateWorkoutSessionInput): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
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
      .from('workout_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getStatistics(): Promise<WorkoutStatistics> {
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('started_at, ended_at');

    if (error) throw error;

    const totalSessions = sessions?.length ?? 0;
    let totalDurationMinutes = 0;

    for (const session of sessions ?? []) {
      if (session.ended_at) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at).getTime();
        totalDurationMinutes += Math.round((end - start) / 60000);
      }
    }

    return { totalSessions, totalDurationMinutes };
  },

  async getRecentWorkouts(limit = 10): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // ExerciseDefinitions
  async listExercises(params: PaginationParams = {}): Promise<PaginatedResult<ExerciseDefinition>> {
    const { page = 1, limit = 100 } = params;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('exercise_definitions')
      .select('*', { count: 'exact' })
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      data: data || [],
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > offset + (data?.length ?? 0),
    };
  },

  async createExercise(input: CreateExerciseDefinitionInput): Promise<ExerciseDefinition> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .insert({
        name: input.name,
        muscle_group: input.muscle_group ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // WorkoutSets
  async createSet(input: CreateWorkoutSetInput): Promise<WorkoutSet> {
    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        workout_exercise_id: input.workout_exercise_id,
        reps: input.reps,
        weight_grams: input.weight_grams,
        rest_seconds: input.rest_seconds ?? null,
        set_order: input.set_order,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
