'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fitnessService, type WorkoutSession, type WorkoutExerciseWithSets, type ExerciseDefinition, type WorkoutSet } from '../services/fitnessService';
import { Card, Text, Badge, Button, Input, Select, useTheme, Modal } from '@superapp/ui';

// ============================================================
// Active Session Component
// ============================================================

export function ActiveSession({
  session,
  onEnd,
}: {
  session: WorkoutSession;
  onEnd: () => void;
}) {
  const { tokens: c } = useTheme();
  const [exercises, setExercises] = useState<WorkoutExerciseWithSets[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseDefinition[]>([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [addingSetForExerciseId, setAddingSetForExerciseId] = useState<string | null>(null);
  const [showRestSettings, setShowRestSettings] = useState(false);
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(90);

  // Rest Timer
  const [restRemaining, setRestRemaining] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 300);
    } catch { /* Audio not supported */ }
  }, []);

  const startRestTimer = useCallback((seconds: number) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestRemaining(seconds);
    setIsResting(true);
    restIntervalRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          setIsResting(false);
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [playBeep]);

  const skipRest = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setIsResting(false);
    setRestRemaining(0);
  }, []);

  useEffect(() => {
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, []);

  // Session Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.started_at]);

  // Load exercises
  const loadExercises = useCallback(async () => {
    const [sessionExercises, allEx] = await Promise.all([
      fitnessService.listWorkoutExercises(session.id),
      fitnessService.getAllExercises(),
    ]);
    setExercises(sessionExercises);
    setAllExercises(allEx);
  }, [session.id]);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addExercise = async () => {
    if (!selectedExerciseId) return;
    await fitnessService.createWorkoutExercise({
      session_id: session.id,
      exercise_id: selectedExerciseId,
      sort_order: exercises.length,
    });
    setSelectedExerciseId('');
    setShowAddExercise(false);
    loadExercises();
  };

  const removeExercise = async (workoutExerciseId: string) => {
    await fitnessService.deleteWorkoutExercise(workoutExerciseId);
    loadExercises();
  };

  const addSet = async (workoutExerciseId: string, reps: number | null, weight_grams: number | null, isWarmup = false) => {
    const exerciseData = exercises.find((e) => e.exercise.id === workoutExerciseId);
    const existingSets = exerciseData?.sets || [];
    await fitnessService.createSet({
      workout_exercise_id: workoutExerciseId,
      reps,
      weight_grams,
      set_order: existingSets.length,
      is_warmup: isWarmup,
    });
    await loadExercises();

    // Auto-start rest timer
    startRestTimer(defaultRestSeconds);
  };

  const updateSet = async (setId: string, input: { reps?: number | null; weight_grams?: number | null }) => {
    await fitnessService.updateSet(setId, input);
    loadExercises();
  };

  const deleteSet = async (setId: string) => {
    await fitnessService.deleteSet(setId);
    loadExercises();
  };

  const endSession = async () => {
    await fitnessService.update(session.id, { ended_at: new Date().toISOString() });
    onEnd();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Session Header */}
      <Card padding="lg" style={{ background: `linear-gradient(135deg, ${c.primaryLight}, ${c.surfaceActive})`, borderColor: c.primary }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Text fontWeight="bold" size="xl" style={{ color: c.primary }}>🏋️ Тренировка</Text>
            {session.title && <Text muted size="sm">{session.title}</Text>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <Badge variant="primary" size="sm">⏱ {formatTime(elapsed)}</Badge>
              <Badge variant="warning" size="sm">{exercises.length} упражнений</Badge>
              <div
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onClick={() => setShowRestSettings(true)}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') setShowRestSettings(true); }}
              >
                <Badge variant="default" size="sm">
                  ⏸ {defaultRestSeconds}с отдых
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="danger" size="lg" onPress={endSession}>
            ⏹ Завершить
          </Button>
        </div>
      </Card>

      {/* Rest Timer Overlay */}
      {isResting && (
        <RestTimerDisplay
          remaining={restRemaining}
          total={defaultRestSeconds}
          onSkip={skipRest}
          onExtend={(secs) => startRestTimer(restRemaining + secs)}
        />
      )}

      {/* Add Exercise */}
      {!showAddExercise ? (
        <Button variant="secondary" size="md" onPress={() => setShowAddExercise(true)} fullWidth>
          ➕ Добавить упражнение
        </Button>
      ) : (
        <Card padding="lg" variant="outlined">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Упражнение</Text>
              <Select
                options={allExercises.map((e) => ({ value: e.id, label: `${e.muscle_group ? `[${e.muscle_group}] ` : ''}${e.name}` }))}
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                fullWidth
              />
            </div>
            <Button variant="primary" onPress={addExercise} disabled={!selectedExerciseId}>Добавить</Button>
            <Button variant="ghost" onPress={() => { setShowAddExercise(false); setSelectedExerciseId(''); }}>✕</Button>
          </div>
        </Card>
      )}

      {/* Exercises */}
      {exercises.length === 0 && !showAddExercise && (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💪</div>
            <Text muted size="lg">Добавьте первое упражнение</Text>
          </div>
        </Card>
      )}

      {exercises.map((we) => (
        <ExerciseBlock
          key={we.exercise.id}
          workoutExercise={we}
          onDelete={() => removeExercise(we.exercise.id)}
          onAddSet={(reps, weight, isWarmup) => addSet(we.exercise.id, reps, weight, isWarmup)}
          onUpdateSet={updateSet}
          onDeleteSet={deleteSet}
          addingSet={addingSetForExerciseId === we.exercise.id}
          onToggleAddingSet={() => setAddingSetForExerciseId(
            addingSetForExerciseId === we.exercise.id ? null : we.exercise.id
          )}
        />
      ))}

      {/* Rest Settings Modal */}
      <Modal
        isOpen={showRestSettings}
        onClose={() => setShowRestSettings(false)}
        title="⏸ Настройки отдыха"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Text muted size="sm">Время отдыха между подходами по умолчанию:</Text>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[30, 45, 60, 90, 120, 180].map((sec) => (
              <Button
                key={sec}
                variant={defaultRestSeconds === sec ? 'primary' : 'secondary'}
                size="sm"
                onPress={() => setDefaultRestSeconds(sec)}
              >
                {sec}с
              </Button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={() => setShowRestSettings(false)}>Готово</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// Rest Timer Display
// ============================================================

function RestTimerDisplay({
  remaining,
  total,
  onSkip,
  onExtend,
}: {
  remaining: number;
  total: number;
  onSkip: () => void;
  onExtend: (secs: number) => void;
}) {
  const { tokens: c } = useTheme();
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const isUrgent = remaining <= 5;

  return (
    <Card
      padding="md"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: isUrgent ? c.errorBg : c.surface,
        borderColor: isUrgent ? c.error : c.primary,
        boxShadow: `0 4px 20px ${c.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Text fontWeight="bold" size="lg" style={{ color: isUrgent ? c.error : c.primary, minWidth: 40 }}>
          ⏸ {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
        </Text>

        {/* Progress Bar */}
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: c.border, overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: isUrgent ? c.error : c.primary,
              borderRadius: 4,
              transition: 'width 1s linear',
            }}
          />
        </div>

        {/* Controls */}
        <Button variant="ghost" size="xs" onPress={() => onExtend(30)} aria-label="Добавить 30 секунд">+30с</Button>
        <Button variant="ghost" size="xs" onPress={onSkip} aria-label="Пропустить отдых">⏭</Button>
      </div>
    </Card>
  );
}

// ============================================================
// Exercise Block (exercise + its sets)
// ============================================================

function ExerciseBlock({
  workoutExercise,
  onDelete,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  addingSet,
  onToggleAddingSet,
}: {
  workoutExercise: WorkoutExerciseWithSets;
  onDelete: () => void;
  onAddSet: (reps: number | null, weight_grams: number | null, isWarmup?: boolean) => void;
  onUpdateSet: (id: string, input: { reps?: number | null; weight_grams?: number | null }) => void;
  onDeleteSet: (id: string) => void;
  addingSet: boolean;
  onToggleAddingSet: () => void;
}) {
  const { tokens: c } = useTheme();
  const ex = workoutExercise.exercise.exercise;
  const sets = workoutExercise.sets;
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;

  const [repsInput, setRepsInput] = useState(lastSet?.reps?.toString() ?? '');
  const [weightInput, setWeightInput] = useState(lastSet?.weight_grams ? (lastSet.weight_grams / 1000).toString() : '');
  const [isWarmup, setIsWarmup] = useState(false);

  // Update inputs when lastSet changes (new set added)
  useEffect(() => {
    if (lastSet) {
      setRepsInput(lastSet.reps?.toString() ?? '');
      setWeightInput(lastSet.weight_grams ? (lastSet.weight_grams / 1000).toString() : '');
    }
  }, [sets.length]);

  const adjustWeight = (delta: number) => {
    const current = parseFloat(weightInput) || 0;
    setWeightInput(Math.max(0, current + delta).toFixed(1));
  };

  const handleAddSet = () => {
    const reps = repsInput ? parseInt(repsInput, 10) : null;
    const weight = weightInput ? Math.round(parseFloat(weightInput) * 1000) : null;
    onAddSet(reps, weight, isWarmup);
    setIsWarmup(false);
  };

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <Text fontWeight="semibold" size="lg">{ex.name}</Text>
          {ex.muscle_group && <Badge variant="info" size="sm" style={{ marginTop: 4 }}>{ex.muscle_group}</Badge>}
        </div>
        <Button variant="ghost" size="sm" onPress={onDelete} aria-label="Удалить упражнение">🗑️</Button>
      </div>

      {/* Sets */}
      {sets.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px 40px', gap: 8, marginBottom: 4 }}>
            <Text muted size="xs">#</Text>
            <Text muted size="xs">Повторы</Text>
            <Text muted size="xs">Вес (кг)</Text>
            <Text muted size="xs">Размин.</Text>
            <Text muted size="xs"> </Text>
          </div>
          {sets.map((set: WorkoutSet, i: number) => (
            <div key={set.id} style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 1fr 60px 40px',
              gap: 8,
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: 6,
              background: set.is_warmup ? c.successBg : i % 2 === 0 ? c.surfaceHover : 'transparent',
              marginBottom: 2,
            }}>
              <Text size="sm" muted>{i + 1}</Text>
              <Text size="sm">{set.reps ?? '—'}</Text>
              <Text size="sm">{set.weight_grams !== null ? `${(set.weight_grams / 1000).toFixed(1)}` : '—'}</Text>
              <Text size="xs">{set.is_warmup ? '✅' : '—'}</Text>
              <Button variant="ghost" size="xs" onPress={() => onDeleteSet(set.id)} aria-label="Удалить подход">✕</Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Set */}
      {!addingSet ? (
        <Button variant="secondary" size="sm" onPress={() => { onToggleAddingSet(); setIsWarmup(false); }} fullWidth>
          ➕ Добавить подход
          {lastSet && (
            <Text muted size="xs" style={{ marginLeft: 8 }}>
              (пред. {lastSet.reps ?? '—'}×{lastSet.weight_grams !== null ? (lastSet.weight_grams / 1000).toFixed(1) : '—'}кг)
            </Text>
          )}
        </Button>
      ) : (
        <div style={{ marginTop: 8 }}>
          {/* Quick Weight Adjust */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
            <Text muted size="xs" style={{ marginRight: 4 }}>Вес:</Text>
            {[-5, -2.5, -1.25, 1.25, 2.5, 5].map((delta) => (
              <Button
                key={delta}
                variant="ghost"
                size="xs"
                onPress={() => adjustWeight(delta)}
                style={{ padding: '2px 6px', minWidth: 'auto' }}
              >
                {delta > 0 ? '+' : ''}{delta}
              </Button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Text muted size="xs" style={{ marginBottom: 2 }}>Повторы</Text>
              <Input type="number" value={repsInput} onChange={(e) => setRepsInput(e.target.value)} placeholder="10" fullWidth />
            </div>
            <div style={{ flex: 1 }}>
              <Text muted size="xs" style={{ marginBottom: 2 }}>Вес (кг)</Text>
              <Input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} placeholder="50" fullWidth />
            </div>
            <Button variant="primary" size="sm" onPress={handleAddSet}>OK</Button>
            <Button variant="ghost" size="sm" onPress={onToggleAddingSet}>✕</Button>
          </div>

          {/* Warmup Toggle */}
          <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button
              variant={isWarmup ? 'success' : 'secondary'}
              size="xs"
              onPress={() => setIsWarmup(!isWarmup)}
            >
              {isWarmup ? '✅ Разминочный' : '⬜ Рабочий'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
