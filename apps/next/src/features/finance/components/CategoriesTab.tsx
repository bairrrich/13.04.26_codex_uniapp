'use client';

import { useState, useEffect, useCallback } from 'react';
import { categoryService, type Category } from '../services/financeService';
import { Card, Text, Button, Input, Select, Badge, Modal, Skeleton, Divider } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const KIND_OPTIONS = [
  { value: 'income', label: '📈 Доход' },
  { value: 'expense', label: '📉 Расход' },
];

const COLORS = [
  '#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1',
];

const ICONS = ['💰', '💻', '🎁', '📈', '🛒', '🚗', '🎬', '💊', '👕', '💡', '📱', '📚', '🍽️', '✈️', '🏠', '🎮', '🐾', '💇', '🔧', '📦'];

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formKind, setFormKind] = useState<'income' | 'expense'>('expense');
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [formIcon, setFormIcon] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await categoryService.list();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const resetForm = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormName('');
    setFormKind('expense');
    setFormColor(COLORS[0]);
    setFormIcon('');
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setModalOpen(true);
    setFormName(cat.name);
    setFormKind(cat.kind);
    setFormColor(cat.color || COLORS[0]);
    setFormIcon(cat.icon || '');
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      if (editingId) {
        await categoryService.update(editingId, { name: formName, kind: formKind, color: formColor, icon: formIcon || null });
      } else {
        await categoryService.create({ name: formName, kind: formKind, color: formColor, icon: formIcon || undefined });
      }
      resetForm();
      loadCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      await categoryService.delete(id);
      loadCategories();
    } catch (err) {
      alert('Нельзя удалить категорию, которая используется в транзакциях');
    }
  };

  const incomeCategories = categories.filter((c) => c.kind === 'income');
  const expenseCategories = categories.filter((c) => c.kind === 'expense');

  return (
    <div>
      {/* Add button */}
      <Button variant="primary" size="lg" onPress={() => setModalOpen(true)} style={{ marginBottom: 24 }}>
        + Добавить категорию
      </Button>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={resetForm} title={editingId ? '✏️ Редактировать категорию' : '➕ Новая категория'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Тип</Text>
            <div style={{ display: 'flex', gap: 8 }}>
              {KIND_OPTIONS.map((opt) => (
                <Button key={opt.value} variant={formKind === opt.value ? 'primary' : 'secondary'} size="sm" fullWidth onPress={() => setFormKind(opt.value as 'income' | 'expense')}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Название</Text>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Например: Продукты" fullWidth autoFocus />
          </div>

          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Иконка</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormIcon(icon)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: formIcon === icon ? `2px solid ${tokens.colors.primary}` : `1px solid ${tokens.colors.border}`,
                    background: formIcon === icon ? tokens.colors.primaryLight : 'transparent',
                    cursor: 'pointer',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Цвет</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormColor(color)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: formColor === color ? `3px solid ${tokens.colors.text}` : `2px solid ${tokens.colors.border}`,
                    background: color,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleSave} loading={false}>Сохранить</Button>
            <Button variant="ghost" onPress={resetForm}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Categories list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <Card key={i} padding="lg"><Skeleton width="80%" height={20} /></Card>)}
        </div>
      ) : (
        <>
          {/* Income categories */}
          <div style={{ marginBottom: 24 }}>
            <Text fontWeight="semibold" size="lg" style={{ marginBottom: 12 }}>📈 Категории доходов</Text>
            {incomeCategories.length === 0 ? (
              <Card padding="lg" variant="outlined"><Text muted size="sm">Нет категорий доходов</Text></Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {incomeCategories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          {/* Expense categories */}
          <div>
            <Text fontWeight="semibold" size="lg" style={{ marginBottom: 12 }}>📉 Категории расходов</Text>
            {expenseCategories.length === 0 ? (
              <Card padding="lg" variant="outlined"><Text muted size="sm">Нет категорий расходов</Text></Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {expenseCategories.map((cat) => (
                  <CategoryCard key={cat.id} category={cat} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryCard({ category, onEdit, onDelete }: { category: Category; onEdit: (cat: Category) => void; onDelete: (id: string) => void }) {
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: category.color || tokens.colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}>
          {category.icon || '📁'}
        </div>
        <div style={{ flex: 1 }}>
          <Text fontWeight="semibold">{category.name}</Text>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button variant="ghost" size="sm" onPress={() => onEdit(category)}>✏️</Button>
          <Button variant="ghost" size="sm" onPress={() => onDelete(category.id)}>🗑️</Button>
        </div>
      </div>
    </Card>
  );
}
