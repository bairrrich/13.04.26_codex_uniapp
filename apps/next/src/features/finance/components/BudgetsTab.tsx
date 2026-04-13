'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { budgetService, categoryService, accountService, type Budget, type Category, type Account } from '../services/financeService';
import { Card, Text, Button, Input, Select, Badge, Skeleton, Modal } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const PERIOD_OPTIONS = [
  { value: 'monthly', label: '📅 Ежемесячно' },
  { value: 'weekly', label: '📆 Еженедельно' },
  { value: 'daily', label: '📋 Ежедневно' },
  { value: 'yearly', label: '🗓️ Ежегодно' },
];

function formatCurrency(amountMinor: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amountMinor / 100);
}

export function BudgetsTab({ onAddReady }: { onAddReady?: (fn: () => void) => void }) {
  const [budgets, setBudgets] = useState<(Budget & { category?: Category; spent: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPeriod, setFormPeriod] = useState<Budget['period']>('monthly');
  const [formLimit, setFormLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetList, cats, accs] = await Promise.all([
        budgetService.list(),
        categoryService.list(),
        accountService.listAll(),
      ]);
      setCategories(cats);
      setAccounts(accs);

      // Load spent for each budget
      const withSpent = await Promise.all(
        budgetList.map(async (b) => {
          const spent = await budgetService.getSpent(b.category_id, b.period);
          const category = cats.find((c) => c.id === b.category_id);
          return { ...b, category, spent };
        })
      );
      setBudgets(withSpent);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (onAddReady) onAddReady(() => setModalOpen(true)); }, [onAddReady]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setModalOpen(false);
    setFormCategoryId('');
    setFormPeriod('monthly');
    setFormLimit('');
  };

  const handleSave = async () => {
    if (!formCategoryId || !formLimit || parseInt(formLimit, 10) <= 0) return;
    setSaving(true);
    try {
      await budgetService.create({
        category_id: formCategoryId,
        period: formPeriod,
        limit_minor: parseInt(formLimit, 10),
      });
      resetForm();
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить бюджет?')) return;
    await budgetService.delete(id);
    loadData();
  };

  const expenseCategories = categories.filter((c) => c.kind === 'expense');

  return (
    <div>
      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={resetForm} title="➕ Новый бюджет" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Категория расходов</Text>
            <Select
              options={expenseCategories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}`.trim() }))}
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              fullWidth
              placeholder="Выберите категорию"
            />
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Период</Text>
            <Select options={PERIOD_OPTIONS} value={formPeriod} onChange={(e) => setFormPeriod(e.target.value as Budget['period'])} fullWidth />
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Лимит (в копейках/центах)</Text>
            <Input type="number" value={formLimit} onChange={(e) => setFormLimit(e.target.value)} placeholder="500000" fullWidth />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
            <Button variant="ghost" onPress={resetForm}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Budgets list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg">
              <Skeleton width="80%" height={16} style={{ marginBottom: 12 }} />
              <Skeleton width="100%" height={8} />
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <Text muted size="lg">Нет бюджетов</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Создайте бюджет для контроля расходов</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {budgets.map((b) => {
            const percentage = b.limit_minor > 0 ? (b.spent / b.limit_minor) * 100 : 0;
            const isOver = percentage > 100;
            const isWarning = percentage > 80;
            const periodLabels: Record<string, string> = { monthly: 'мес', weekly: 'нед', daily: 'день', yearly: 'год' };

            return (
              <Card key={b.id} padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text fontWeight="semibold" size="lg">{b.category?.icon ?? ''} {b.category?.name ?? '—'}</Text>
                      <Badge variant={isOver ? 'error' : isWarning ? 'warning' : 'default'} size="sm">
                        {periodLabels[b.period] ?? 'мес'}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onPress={() => handleDelete(b.id)}>🗑️</Button>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text size="sm" muted>Потрачено: {formatCurrency(b.spent)}</Text>
                    <Text size="sm" muted>Лимит: {formatCurrency(b.limit_minor)}</Text>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: tokens.colors.border, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        height: '100%',
                        background: isOver ? tokens.colors.error : isWarning ? tokens.colors.warning : tokens.colors.success,
                        borderRadius: 4,
                        transition: `width ${tokens.transitions.slow}`,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text size="sm" style={{ color: isOver ? tokens.colors.error : tokens.colors.muted }}>
                    {isOver ? '⚠️ Превышен на ' + formatCurrency(b.spent - b.limit_minor) : `Осталось: ${formatCurrency(b.limit_minor - b.spent)}`}
                  </Text>
                  <Text size="sm" fontWeight="semibold" style={{ color: percentage > 100 ? tokens.colors.error : tokens.colors.text }}>
                    {percentage.toFixed(0)}%
                  </Text>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
