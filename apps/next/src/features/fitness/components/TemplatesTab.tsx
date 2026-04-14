'use client';

import { useState, useEffect, useCallback } from 'react';
import { fitnessService, type ExerciseDefinition } from '../services/fitnessService';
import { Card, Text, Badge, Button, Input, Select, Modal, useTheme } from '@superapp/ui';

export interface WorkoutTemplate {
  id: string;
  name: string;
  icon: string;
  exercises: { exercise_id: string; sort_order: number }[];
  created_at: string;
}

export function TemplatesTab() {
  const { tokens: c } = useTheme();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [allExercises, setAllExercises] = useState<ExerciseDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateIcon, setTemplateIcon] = useState('🏋️');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const TEMPLATE_ICONS = ['🏋️', '💪', '🦵', '🏃', '🧘', '🤸', '🏊', '🚴', '🏃‍♂️', '🏋️‍♂️'];

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('workout_templates');
      setTemplates(saved ? JSON.parse(saved) : []);
      const exercises = await fitnessService.getAllExercises();
      setAllExercises(exercises);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplates = (newTemplates: WorkoutTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('workout_templates', JSON.stringify(newTemplates));
  };

  const handleCreate = () => {
    if (!templateName.trim()) return;
    const newTemplate: WorkoutTemplate = {
      id: `template_${Date.now()}`,
      name: templateName.trim(),
      icon: templateIcon,
      exercises: selectedExerciseIds.map((id, i) => ({ exercise_id: id, sort_order: i })),
      created_at: new Date().toISOString(),
    };
    saveTemplates([...templates, newTemplate]);
    setTemplateName('');
    setSelectedExerciseIds([]);
    setTemplateIcon('🏋️');
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    saveTemplates(templates.filter((t) => t.id !== id));
  };

  const handleStartWorkout = async (template: WorkoutTemplate) => {
    try {
      const session = await fitnessService.create({
        title: template.name,
        notes: `Шаблон: ${template.name}`,
      });

      for (const ex of template.exercises) {
        await fitnessService.createWorkoutExercise({
          session_id: session.id,
          exercise_id: ex.exercise_id,
          sort_order: ex.sort_order,
        });
      }

      // Navigate to workouts tab with active session
      window.location.href = '/fitness';
    } catch { /* */ }
  };

  const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text fontWeight="semibold" size="lg">📋 Шаблоны тренировок</Text>
            <Text muted size="sm">Создавайте шаблоны для быстрого старта</Text>
          </div>
          <Button variant="primary" size="sm" onPress={() => setShowCreateModal(true)}>➕ Создать</Button>
        </div>
      </Card>

      {loading ? (
        <Text muted style={{ textAlign: 'center', padding: 24 }}>Загрузка...</Text>
      ) : templates.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
            <Text muted size="lg">Нет шаблонов</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Создайте шаблон для быстрого старта тренировки!</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {templates.map((template) => {
            const exerciseCount = template.exercises.length;
            return (
              <Card key={template.id} padding="lg" hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <Text fontWeight="semibold" size="lg">{template.icon} {template.name}</Text>
                    <Text muted size="sm">{exerciseCount} упражнений</Text>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="primary" size="sm" onPress={() => handleStartWorkout(template)}>▶️ Начать</Button>
                    <Button variant="ghost" size="sm" onPress={() => handleDelete(template.id)} aria-label="Удалить шаблон">🗑️</Button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {template.exercises.slice(0, 5).map((ex, i) => {
                    const exercise = exerciseMap.get(ex.exercise_id);
                    return exercise ? (
                      <Badge key={ex.exercise_id} variant="default" size="sm">{exercise.name}</Badge>
                    ) : null;
                  })}
                  {template.exercises.length > 5 && (
                    <Badge variant="default" size="sm">+{template.exercises.length - 5} ещё</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Template Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setTemplateName(''); setSelectedExerciseIds([]); }} title="📋 Новый шаблон" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Название шаблона *" value={templateName} onChange={(e) => setTemplateName(e.target.value)} fullWidth autoFocus />

          {/* Icon Picker */}
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Иконка</Text>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TEMPLATE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setTemplateIcon(icon)}
                  style={{
                    width: 40, height: 40, borderRadius: 8, fontSize: 20, cursor: 'pointer',
                    background: templateIcon === icon ? c.primaryLight : c.surfaceHover,
                    border: `1px solid ${templateIcon === icon ? c.primary : c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Selector */}
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Упражнения ({selectedExerciseIds.length})</Text>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {allExercises.map((ex) => {
                const selected = selectedExerciseIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelectedExerciseIds(selected ? selectedExerciseIds.filter((id) => id !== ex.id) : [...selectedExerciseIds, ex.id])}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                      background: selected ? c.primaryLight : 'transparent',
                      border: `1px solid ${selected ? c.primary : c.border}`,
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <span>{selected ? '✅' : '⬜'}</span>
                    <Text size="sm">{ex.name}</Text>
                    {ex.muscle_group && <Text muted size="xs">({ex.muscle_group})</Text>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleCreate} disabled={!templateName.trim() || selectedExerciseIds.length === 0}>Создать</Button>
            <Button variant="ghost" onPress={() => { setShowCreateModal(false); setTemplateName(''); setSelectedExerciseIds([]); }}>Отмена</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
