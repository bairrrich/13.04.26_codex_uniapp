'use client';

import { useState, useEffect, useCallback } from 'react';
import { fitnessService, type ExerciseDefinition } from '../services/fitnessService';
import { Card, Text, Badge, Button, Input, Modal, Select, TextArea, useTheme } from '@superapp/ui';

export function ExercisesTab() {
  const { tokens: c } = useTheme();
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newCustomMuscleGroup, setNewCustomMuscleGroup] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadExercises = useCallback(async () => {
    setLoading(true);
    try {
      const [data, groups] = await Promise.all([
        fitnessService.getAllExercises(),
        fitnessService.getUniqueMuscleGroups(),
      ]);
      setExercises(data);
      setMuscleGroups(groups);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExercises(); }, [loadExercises]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await fitnessService.createExercise({
      name: newName.trim(),
      muscle_group: newMuscleGroup || undefined,
      equipment: newEquipment || undefined,
      description: newDescription || undefined,
    });
    setNewName('');
    setNewMuscleGroup('');
    setNewEquipment('');
    setNewCustomMuscleGroup('');
    setNewDescription('');
    setShowAddModal(false);
    loadExercises();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить упражнение?')) return;
    await fitnessService.deleteExercise(id);
    loadExercises();
  };

  const filtered = exercises.filter((ex) => {
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (muscleGroupFilter && ex.muscle_group !== muscleGroupFilter) return false;
    return true;
  });

  const grouped: Record<string, ExerciseDefinition[]> = {};
  for (const ex of filtered) {
    const key = ex.muscle_group || 'Без группы';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ex);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <Card padding="lg">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="🔍 Поиск упражнений..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>
          <Select
            options={[{ value: '', label: 'Все группы' }, ...muscleGroups.map((g) => ({ value: g, label: g }))]}
            value={muscleGroupFilter}
            onChange={(e) => setMuscleGroupFilter(e.target.value)}
            style={{ minWidth: 180 }}
            aria-label="Фильтр по группе мышц"
          />
          <Button variant="primary" size="sm" onPress={() => setShowAddModal(true)} aria-label="Добавить упражнение">➕ Добавить</Button>
        </div>
      </Card>

      {/* Exercises by muscle group */}
      {loading ? (
        <Text muted style={{ textAlign: 'center', padding: 24 }}>Загрузка...</Text>
      ) : Object.keys(grouped).length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
            <Text muted size="lg">Нет упражнений</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Добавьте первое упражнение!</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <Text fontWeight="semibold" size="md" style={{ marginBottom: 8, color: c.primary }}>
                {group}
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                {items.map((ex) => (
                  <Card key={ex.id} padding="md" hoverable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Text fontWeight="semibold">{ex.name}</Text>
                        {ex.equipment && (
                          <Badge variant="default" size="sm" style={{ marginTop: 4 }}>{ex.equipment}</Badge>
                        )}
                        {ex.description && (
                          <Text muted size="xs" style={{ marginTop: 4, display: 'block' }}>{ex.description}</Text>
                        )}
                      </div>
                      <Button variant="ghost" size="xs" onPress={() => handleDelete(ex.id)}>🗑️</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setNewName(''); setNewMuscleGroup(''); setNewEquipment(''); setNewCustomMuscleGroup(''); setNewDescription(''); }}
        title="➕ Новое упражнение"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            placeholder="Название *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            fullWidth
            autoFocus
          />
          <Select
            options={[{ value: '', label: 'Выберите группу' }, ...muscleGroups.map((g) => ({ value: g, label: g })), { value: '__custom__', label: '✏️ Другая' }]}
            value={newMuscleGroup}
            onChange={(e) => {
              if (e.target.value === '__custom__') {
                setNewMuscleGroup('');
              } else {
                setNewMuscleGroup(e.target.value);
              }
            }}
            fullWidth
          />
          {!newMuscleGroup && (
            <Input
              placeholder="Введите группу мышц"
              value={newCustomMuscleGroup}
              onChange={(e) => { setNewCustomMuscleGroup(e.target.value); setNewMuscleGroup(e.target.value); }}
              fullWidth
            />
          )}
          <Input
            placeholder="Оборудование (гантели, штанга...)"
            value={newEquipment}
            onChange={(e) => setNewEquipment(e.target.value)}
            fullWidth
          />
          <TextArea
            placeholder="Описание"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={3}
            fullWidth
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleAdd} disabled={!newName.trim()}>Добавить</Button>
            <Button variant="ghost" onPress={() => { setShowAddModal(false); setNewName(''); }}>Отмена</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
