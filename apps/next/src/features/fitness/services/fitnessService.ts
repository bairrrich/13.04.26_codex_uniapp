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

export const fitnessService = {
  // WorkoutSessions
  async list(limit = 50): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
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

  // ExerciseDefinitions
  async listExercises(): Promise<ExerciseDefinition[]> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
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
