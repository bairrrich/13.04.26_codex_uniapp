'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { goalService, type Goal } from '../services/investmentsService';
import { Card, Text, Button, Input, Modal, Skeleton, Badge } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const ICONS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '👶', '🏥', '💎', '🎸'];
const COLORS = ['#5B6CFF', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];

function formatRubles(amountMinor: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amountMinor / 100);
}

export function GoalsTab({ onAddReady }: { onAddReady?: (fn: () => void) => void }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('0');
  const [formIcon, setFormIcon] = useState('🎯');
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [addAmountId, setAddAmountId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await goalService.list();
      setGoals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const onAddRef = useRef(onAddReady);
  useEffect(() => { onAddRef.current = onAddReady; }, [onAddReady]);
  const openModal = useCallback(() => setModalOpen(true), []);
  useEffect(() => { if (onAddRef.current) onAddRef.current(openModal); }, [openModal]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormName('');
    setFormTarget('');
    setFormCurrent('0');
    setFormIcon('🎯');
    setFormColor(COLORS[0]);
  };

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setModalOpen(true);
    setFormName(goal.name);
    setFormTarget(String(goal.target_amount / 100));
    setFormCurrent(String(goal.current_amount / 100));
    setFormIcon(goal.icon || '🎯');
    setFormColor(goal.color || COLORS[0]);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formTarget || parseFloat(formTarget) <= 0) return;
    setSaving(true);
    try {
      const input = {
        name: formName.trim(),
        target_amount: Math.round(parseFloat(formTarget) * 100),
        current_amount: Math.round(parseFloat(formCurrent || '0') * 100),
        icon: formIcon,
        color: formColor,
      };
      if (editingId) {
        await goalService.update(editingId, input);
      } else {
        await goalService.create(input);
      }
      resetForm();
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить цель?')) return;
    await goalService.delete(id);
    loadData();
  };

  const handleAddAmount = async (id: string) => {
    if (!addAmount || parseFloat(addAmount) <= 0) return;
    try {
      await goalService.addAmount(id, Math.round(parseFloat(addAmount) * 100));
      setAddAmountId(null);
      setAddAmount('');
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  return (
    <div>
      <Modal isOpen={modalOpen} onClose={resetForm} title={editingId ? '✏️ Редактировать цель' : '🎯 Новая цель'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Название" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth autoFocus />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Целевая сумма (₽)</Text>
              <Input type="number" value={formTarget} onChange={(e) => setFormTarget(e.target.value)} fullWidth />
            </div>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Уже накоплено (₽)</Text>
              <Input type="number" value={formCurrent} onChange={(e) => setFormCurrent(e.target.value)} fullWidth />
            </div>
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Иконка</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {ICONS.map((icon) => (
                <button key={icon} type="button" onClick={() => setFormIcon(icon)} style={{
                  width: 36, height: 36, borderRadius: 8, border: formIcon === icon ? `2px solid ${tokens.colors.primary}` : `1px solid ${tokens.colors.border}`,
                  background: formIcon === icon ? tokens.colors.primaryLight : 'transparent', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{icon}</button>
              ))}
            </div>
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Цвет</Text>
            <div style={{ display: 'flex', gap: 6 }}>
              {COLORS.map((color) => (
                <button key={color} type="button" onClick={() => setFormColor(color)} style={{
                  width: 32, height: 32, borderRadius: '50%', border: formColor === color ? `3px solid ${tokens.colors.text}` : `2px solid ${tokens.colors.border}`, background: color, cursor: 'pointer'
                }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
            <Button variant="ghost" onPress={resetForm}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <Card key={i} padding="lg"><Skeleton width="80%" height={16} style={{ marginBottom: 8 }} /><Skeleton width="100%" height={8} /></Card>)}
        </div>
      ) : goals.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <Text muted size="lg">Нет целей</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Создайте финансовую цель для накоплений</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {goals.map((goal) => {
            const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
            const isComplete = percentage >= 100;

            return (
              <Card key={goal.id} padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${goal.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {goal.icon}
                    </div>
                    <div>
                      <Text fontWeight="semibold">{goal.name}</Text>
                      <Text muted size="sm">{formatRubles(goal.current_amount)} / {formatRubles(goal.target_amount)}</Text>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="ghost" size="sm" onPress={() => setAddAmountId(goal.id)}>➕</Button>
                    <Button variant="ghost" size="sm" onPress={() => handleEdit(goal)} aria-label="Редактировать цель">✏️</Button>
                    <Button variant="ghost" size="sm" onPress={() => handleDelete(goal.id)} aria-label="Удалить цель">🗑️</Button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text size="sm" style={{ color: isComplete ? tokens.colors.success : tokens.colors.muted }}>
                      {isComplete ? '✅ Цель достигнута!' : `${percentage.toFixed(0)}%`}
                    </Text>
                    <Text muted size="sm">Осталось: {formatRubles(Math.max(0, goal.target_amount - goal.current_amount))}</Text>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: tokens.colors.border, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(percentage, 100)}%`, height: '100%', background: isComplete ? tokens.colors.success : goal.color, borderRadius: 4, transition: `width ${tokens.transitions.slow}` }} />
                  </div>
                </div>

                {/* Add amount inline */}
                {addAmountId === goal.id && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="Сумма ₽" style={{ flex: 1 }} />
                    <Button variant="primary" size="sm" onPress={() => handleAddAmount(goal.id)}>✓</Button>
                    <Button variant="ghost" size="sm" onPress={() => { setAddAmountId(null); setAddAmount(''); }}>✕</Button>
                  </div>
                )}

                {goal.deadline && (
                  <Text muted size="xs" style={{ marginTop: 8 }}>📅 Дедлайн: {new Date(goal.deadline).toLocaleDateString('ru-RU')}</Text>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
