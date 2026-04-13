'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { fitnessService, type ExerciseDefinition } from '../services/fitnessService';
import { Card, Button, Input, Select, TextArea, Text, Heading } from '@superapp/ui';

interface WorkoutFormProps {
  onSuccess?: () => void;
}

export function WorkoutForm({ onSuccess }: WorkoutFormProps) {
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addNewExercise, setAddNewExercise] = useState(false);

  useEffect(() => {
    fitnessService.listExercises().then(setExercises).catch(() => { });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (addNewExercise && !newExerciseName.trim()) return;
    if (!addNewExercise && !selectedExerciseId) return;

    setLoading(true);
    setError(null);

    try {
      let exerciseId = selectedExerciseId;

      if (addNewExercise) {
        const newExercise = await fitnessService.createExercise({
          name: newExerciseName.trim(),
          muscle_group: muscleGroup.trim() || undefined,
        });
        exerciseId = newExercise.id;
        setExercises((prev) => [...prev, newExercise]);
        setNewExerciseName('');
        setMuscleGroup('');
      }

      await fitnessService.create({
        notes: notes.trim() || undefined,
      });

      setSelectedExerciseId('');
      setNotes('');
      setAddNewExercise(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Heading level={3}>Начать тренировку</Heading>

      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>
          Упражнение
        </Text>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Button
            variant={!addNewExercise ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setAddNewExercise(false)}
          >
            Выбрать
          </Button>
          <Button
            variant={addNewExercise ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setAddNewExercise(true)}
          >
            Добавить новое
          </Button>
        </div>

        {!addNewExercise ? (
          <Select
            options={exercises.map((ex) => ({
              value: ex.id,
              label: ex.name + (ex.muscle_group ? ` (${ex.muscle_group})` : ''),
            }))}
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            placeholder="-- Выберите упражнение --"
            fullWidth
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Input
              placeholder="Название упражнения"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              fullWidth
            />
            <Input
              placeholder="Группа мышц (необязательно)"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              fullWidth
            />
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>
          Заметки
        </Text>
        <TextArea
          placeholder="Заметки к тренировке..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          fullWidth
        />
      </div>

      {error && (
        <Text error style={{ marginTop: 8 }}>
          {error}
        </Text>
      )}

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={addNewExercise ? !newExerciseName.trim() : !selectedExerciseId}
        fullWidth
        style={{ marginTop: 12 }}
      >
        Начать
      </Button>
    </Card>
  );
}
