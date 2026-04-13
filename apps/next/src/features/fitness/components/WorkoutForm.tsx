'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { fitnessService, type ExerciseDefinition } from '../services/fitnessService';

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
    fitnessService.listExercises().then(setExercises).catch(() => {});
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
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h3>Начать тренировку</h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>
          Упражнение
        </label>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setAddNewExercise(false)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: !addNewExercise ? '#5B6CFF' : '#333',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Выбрать
          </button>
          <button
            type="button"
            onClick={() => setAddNewExercise(true)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: addNewExercise ? '#5B6CFF' : '#333',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Добавить новое
          </button>
        </div>

        {!addNewExercise ? (
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #333',
              background: '#111827',
              color: '#F4F7FF',
              fontSize: 15,
              boxSizing: 'border-box',
            }}
          >
            <option value="">-- Выберите упражнение --</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
                {ex.muscle_group ? ` (${ex.muscle_group})` : ''}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              placeholder="Название упражнения"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              required
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid #333',
                background: '#111827',
                color: '#F4F7FF',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
            <input
              placeholder="Группа мышц (необязательно)"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 8,
                border: '1px solid #333',
                background: '#111827',
                color: '#F4F7FF',
                fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>
          Заметки
        </label>
        <textarea
          placeholder="Заметки к тренировке..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111827',
            color: '#F4F7FF',
            fontSize: 15,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || (addNewExercise ? !newExerciseName.trim() : !selectedExerciseId)}
        style={{
          marginTop: 12,
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background:
            addNewExercise ? (newExerciseName.trim() ? '#5B6CFF' : '#333') : selectedExerciseId ? '#5B6CFF' : '#333',
          color: '#fff',
          cursor:
            loading || (addNewExercise ? !newExerciseName.trim() : !selectedExerciseId)
              ? 'not-allowed'
              : 'pointer',
          fontWeight: 600,
        }}
      >
        {loading ? 'Сохранение...' : 'Начать'}
      </button>
    </form>
  );
}
