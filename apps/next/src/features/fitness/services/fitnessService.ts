import { supabase } from '../../../lib/supabase';

// ============================================================
// Types
// ============================================================

export interface WorkoutSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkoutSessionInput {
  started_at?: string;
  notes?: string;
  title?: string;
}

export interface UpdateWorkoutSessionInput {
  ended_at?: string;
  notes?: string;
  title?: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  description: string | null;
  created_at: string;
}

export interface CreateExerciseDefinitionInput {
  name: string;
  muscle_group?: string;
  equipment?: string;
  description?: string;
}

export interface UpdateExerciseDefinitionInput {
  name?: string;
  muscle_group?: string | null;
  equipment?: string | null;
  description?: string | null;
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  sort_order: number;
  exercise: ExerciseDefinition;
}

export interface CreateWorkoutExerciseInput {
  session_id: string;
  exercise_id: string;
  sort_order?: number;
}

export interface UpdateWorkoutExerciseInput {
  sort_order?: number;
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  reps: number | null;
  weight_grams: number | null;
  rest_seconds: number | null;
  set_order: number;
  is_warmup: boolean;
  created_at: string;
}

export interface CreateWorkoutSetInput {
  workout_exercise_id: string;
  reps?: number | null;
  weight_grams?: number | null;
  rest_seconds?: number | null;
  set_order?: number;
  is_warmup?: boolean;
}

export interface UpdateWorkoutSetInput {
  reps?: number | null;
  weight_grams?: number | null;
  rest_seconds?: number | null;
  set_order?: number;
  is_warmup?: boolean;
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

export interface ExerciseHistoryEntry {
  date: string;
  reps: number | null;
  weight_grams: number | null;
  session_id: string;
  exercise_name: string;
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  muscle_group: string | null;
  max_weight_grams: number | null;
  max_reps: number | null;
  total_volume_grams: number | null;
  estimated_1rm_grams: number | null;
  last_updated: string;
}

export interface MuscleGroupStats {
  muscle_group: string;
  total_sets: number;
  total_volume_grams: number | null;
  avg_weight_grams: number | null;
}

export interface ActiveSession {
  session: WorkoutSession;
  exercises: WorkoutExerciseWithSets[];
}

export interface WorkoutExerciseWithSets {
  exercise: WorkoutExercise;
  sets: WorkoutSet[];
}

export interface WeeklyVolumeData {
  week_start: string;
  total_sets: number;
  total_volume_kg: number;
  sessions_count: number;
}

export interface BodyWeightEntry {
  id: string;
  weight_grams: number;
  notes: string | null;
  logged_at: string;
}

export interface CreateBodyWeightInput {
  weight_grams: number;
  notes?: string;
  logged_at?: string;
}

// ============================================================
// Service
// ============================================================

export const fitnessService = {
  // ---- Workout Sessions ----

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

  async getActiveSession(): Promise<WorkoutSession | null> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(input: CreateWorkoutSessionInput): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        started_at: input.started_at ?? new Date().toISOString(),
        notes: input.notes ?? null,
        title: input.title ?? null,
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

  async getSessionWithExercises(sessionId: string): Promise<ActiveSession | null> {
    const session = await this.get(sessionId);
    if (!session) return null;

    const exercises = await this.listWorkoutExercises(sessionId);
    return { session, exercises };
  },

  // ---- Exercise Definitions ----

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

  async getAllExercises(): Promise<ExerciseDefinition[]> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getExercise(id: string): Promise<ExerciseDefinition | null> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createExercise(input: CreateExerciseDefinitionInput): Promise<ExerciseDefinition> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .insert({
        name: input.name,
        muscle_group: input.muscle_group ?? null,
        equipment: input.equipment ?? null,
        description: input.description ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExercise(id: string, input: UpdateExerciseDefinitionInput): Promise<ExerciseDefinition> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('exercise_definitions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<ExerciseDefinition[]> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .select('*')
      .eq('muscle_group', muscleGroup)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getUniqueMuscleGroups(): Promise<string[]> {
    const { data, error } = await supabase
      .from('exercise_definitions')
      .select('muscle_group')
      .not('muscle_group', 'is', null);

    if (error) throw error;
    const groups = new Set((data || []).map((d) => d.muscle_group as string));
    return Array.from(groups).sort();
  },

  // ---- Workout Exercises (session <-> exercise join) ----

  async listWorkoutExercises(sessionId: string): Promise<WorkoutExerciseWithSets[]> {
    const { data: exercises, error: exError } = await supabase
      .from('workout_exercises')
      .select('*, exercise_definitions(*)')
      .eq('session_id', sessionId)
      .order('sort_order');

    if (exError) throw exError;

    const result: WorkoutExerciseWithSets[] = [];
    for (const ex of exercises || []) {
      const { data: sets, error: setErr } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_exercise_id', ex.id)
        .order('set_order');

      if (setErr) throw setErr;

      result.push({
        exercise: {
          id: ex.id,
          session_id: ex.session_id,
          exercise_id: ex.exercise_id,
          sort_order: ex.sort_order,
          exercise: ex.exercise_definitions,
        },
        sets: sets || [],
      });
    }

    return result;
  },

  async createWorkoutExercise(input: CreateWorkoutExerciseInput): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from('workout_exercises')
      .insert({
        session_id: input.session_id,
        exercise_id: input.exercise_id,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkoutExercise(id: string, input: UpdateWorkoutExerciseInput): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from('workout_exercises')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWorkoutExercise(id: string): Promise<void> {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ---- Workout Sets ----

  async listSets(workoutExerciseId: string): Promise<WorkoutSet[]> {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('workout_exercise_id', workoutExerciseId)
      .order('set_order');

    if (error) throw error;
    return data || [];
  },

  async createSet(input: CreateWorkoutSetInput): Promise<WorkoutSet> {
    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        workout_exercise_id: input.workout_exercise_id,
        reps: input.reps ?? null,
        weight_grams: input.weight_grams ?? null,
        rest_seconds: input.rest_seconds ?? null,
        set_order: input.set_order ?? 0,
        is_warmup: input.is_warmup ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSet(id: string, input: UpdateWorkoutSetInput): Promise<WorkoutSet> {
    const { data, error } = await supabase
      .from('workout_sets')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSet(id: string): Promise<void> {
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ---- Progress & Analytics ----

  async getExerciseHistory(exerciseId: string, limit = 50): Promise<ExerciseHistoryEntry[]> {
    const { data: sets, error } = await supabase
      .from('workout_sets')
      .select(`
        reps,
        weight_grams,
        created_at,
        workout_exercises (
          session_id,
          workout_sessions ( started_at )
        )
      `)
      .eq('workout_exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const entries: ExerciseHistoryEntry[] = [];
    for (const row of sets || []) {
      const we = (row as any).workout_exercises;
      if (we?.workout_sessions) {
        entries.push({
          date: we.workout_sessions.started_at,
          reps: row.reps,
          weight_grams: row.weight_grams,
          session_id: we.session_id,
          exercise_name: '',
        });
      }
    }

    return entries;
  },

  async getPersonalRecords(): Promise<PersonalRecord[]> {
    // Get all exercises with their best sets
    const { data: exercises, error: exErr } = await supabase
      .from('exercise_definitions')
      .select('id, name, muscle_group');

    if (exErr) throw exErr;

    const records: PersonalRecord[] = [];
    for (const ex of exercises || []) {
      // Get max weight
      const { data: maxWeight } = await supabase
        .from('workout_sets')
        .select('weight_grams, reps, created_at')
        .eq('workout_exercise_id', ex.id)
        .not('weight_grams', 'is', null)
        .order('weight_grams', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get max reps
      const { data: maxReps } = await supabase
        .from('workout_sets')
        .select('reps, weight_grams, created_at')
        .eq('workout_exercise_id', ex.id)
        .not('reps', 'is', null)
        .order('reps', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Total volume
      const { data: volumeRows } = await supabase
        .from('workout_sets')
        .select('weight_grams, reps')
        .eq('workout_exercise_id', ex.id)
        .not('weight_grams', 'is', null)
        .not('reps', 'is', null);

      const totalVolume = volumeRows?.reduce((sum, r) => sum + (r.weight_grams ?? 0) * (r.reps ?? 0), 0) ?? null;

      // Last updated
      const { data: last } = await supabase
        .from('workout_sets')
        .select('created_at')
        .eq('workout_exercise_id', ex.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 1RM estimation using Epley formula: weight * (1 + reps/30)
      let estimated1rm: number | null = null;
      if (maxWeight?.weight_grams && maxReps?.reps && maxReps.reps > 1) {
        estimated1rm = Math.round(maxWeight.weight_grams * (1 + maxReps.reps / 30));
      } else if (maxWeight?.weight_grams && maxReps?.reps === 1) {
        estimated1rm = maxWeight.weight_grams;
      }

      records.push({
        exercise_id: ex.id,
        exercise_name: ex.name,
        muscle_group: ex.muscle_group,
        max_weight_grams: maxWeight?.weight_grams ?? null,
        max_reps: maxReps?.reps ?? null,
        total_volume_grams: totalVolume,
        estimated_1rm_grams: estimated1rm,
        last_updated: last?.created_at ?? (ex as any).created_at,
      });
    }

    return records.filter((r) => r.max_weight_grams !== null || r.max_reps !== null);
  },

  async getMuscleGroupBreakdown(): Promise<MuscleGroupStats[]> {
    const { data: exercises, error: exErr } = await supabase
      .from('exercise_definitions')
      .select('id, muscle_group')
      .not('muscle_group', 'is', null);

    if (exErr) throw exErr;

    const groups: Record<string, { total_sets: number; total_volume: number; total_weight: number; count_with_weight: number }> = {};

    for (const ex of exercises || []) {
      const mg = ex.muscle_group!;
      if (!groups[mg]) groups[mg] = { total_sets: 0, total_volume: 0, total_weight: 0, count_with_weight: 0 };

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('weight_grams, reps')
        .eq('workout_exercise_id', ex.id);

      const setCount = sets?.length ?? 0;
      groups[mg].total_sets += setCount;

      for (const s of sets || []) {
        if (s.weight_grams && s.reps) {
          const vol = s.weight_grams * s.reps;
          groups[mg].total_volume += vol;
          groups[mg].total_weight += s.weight_grams;
          groups[mg].count_with_weight++;
        }
      }
    }

    return Object.entries(groups)
      .map(([muscle_group, stats]) => ({
        muscle_group,
        total_sets: stats.total_sets,
        total_volume_grams: stats.total_volume || null,
        avg_weight_grams: stats.count_with_weight > 0 ? Math.round(stats.total_weight / stats.count_with_weight) : null,
      }))
      .sort((a, b) => b.total_sets - a.total_sets);
  },

  async getWeeklyVolume(weeks = 8): Promise<WeeklyVolumeData[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data: sets, error } = await supabase
      .from('workout_sets')
      .select(`
        reps,
        weight_grams,
        created_at,
        workout_exercises (
          session_id,
          workout_sessions ( started_at )
        )
      `)
      .gte('workout_exercises.workout_sessions.started_at', startDate.toISOString());

    if (error) throw error;

    const weekMap: Record<string, { total_sets: number; total_volume_kg: number; sessions: Set<string> }> = {};

    for (const row of sets || []) {
      const we = (row as any).workout_exercises;
      const sessionDate = we?.workout_sessions?.started_at;
      if (!sessionDate) continue;

      const d = new Date(sessionDate);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);

      if (!weekMap[weekKey]) weekMap[weekKey] = { total_sets: 0, total_volume_kg: 0, sessions: new Set() };

      weekMap[weekKey].total_sets++;
      if (row.weight_grams && row.reps) {
        weekMap[weekKey].total_volume_kg += (row.weight_grams * row.reps) / 1000;
      }
      const sessionId = we?.session_id;
      if (sessionId) weekMap[weekKey].sessions.add(sessionId);
    }

    return Object.entries(weekMap)
      .map(([week_start, data]) => ({
        week_start,
        total_sets: data.total_sets,
        total_volume_kg: Math.round(data.total_volume_kg * 10) / 10,
        sessions_count: data.sessions.size,
      }))
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
      .slice(-weeks);
  },

  // ---- Body Weight Tracking ----

  async listBodyWeightLogs(limit = 90): Promise<BodyWeightEntry[]> {
    const { data, error } = await supabase
      .from('body_weight_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((d) => ({
      ...d,
      weight_grams: parseInt(d.weight_grams, 10),
    }));
  },

  async createBodyWeight(input: CreateBodyWeightInput): Promise<BodyWeightEntry> {
    const { data, error } = await supabase
      .from('body_weight_logs')
      .insert({
        weight_grams: String(input.weight_grams),
        notes: input.notes ?? null,
        logged_at: input.logged_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, weight_grams: parseInt(data.weight_grams, 10) };
  },

  async deleteBodyWeight(id: string): Promise<void> {
    const { error } = await supabase
      .from('body_weight_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
