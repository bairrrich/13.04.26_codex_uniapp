'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { recurringService, categoryService, accountService, type RecurringRule, type Category, type Account } from '../services/financeService';
import { Card, Text, Button, Input, Select, Badge, Modal, Skeleton } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const FREQUENCY_OPTIONS = [
  { value: 'RRULE:FREQ=DAILY', label: '📅 Ежедневно' },
  { value: 'RRULE:FREQ=WEEKLY', label: '📆 Еженедельно' },
  { value: 'RRULE:FREQ=MONTHLY', label: '🗓️ Ежемесячно' },
  { value: 'RRULE:FREQ=YEARLY', label: '📊 Ежегодно' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amountMinor: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amountMinor / 100);
}

function getFrequencyLabel(rrule: string): string {
  const opt = FREQUENCY_OPTIONS.find((o) => o.value === rrule);
  return opt?.label ?? rrule;
}

export function RecurringTab({ onAddReady }: { onAddReady?: (fn: () => void) => void }) {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formAccountId, setFormAccountId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formFrequency, setFormFrequency] = useState('RRULE:FREQ=MONTHLY');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesList, cats, accs] = await Promise.all([
        recurringService.list(),
        categoryService.list(),
        accountService.listAll(),
      ]);
      setRules(rulesList);
      setCategories(cats);
      setAccounts(accs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (onAddReady) onAddReady(() => setModalOpen(true)); }, [onAddReady]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormAccountId(accounts[0]?.id ?? '');
    setFormCategoryId('');
    setFormAmount('');
    setFormFrequency('RRULE:FREQ=MONTHLY');
  };

  const handleEdit = (rule: RecurringRule) => {
    setEditingId(rule.id);
    setModalOpen(true);
    setFormAccountId(rule.account_id);
    setFormCategoryId(rule.category_id ?? '');
    setFormAmount(String(rule.amount_minor));
    setFormFrequency(rule.rrule);
  };

  const handleSave = async () => {
    if (!formAccountId || !formAmount || parseInt(formAmount, 10) <= 0) return;
    setSaving(true);
    try {
      if (editingId) {
        await recurringService.update(editingId, {
          account_id: formAccountId,
          category_id: formCategoryId || null,
          amount_minor: parseInt(formAmount, 10),
          rrule: formFrequency,
        });
      } else {
        await recurringService.create({
          account_id: formAccountId,
          category_id: formCategoryId || null,
          amount_minor: parseInt(formAmount, 10),
          rrule: formFrequency,
        });
      }
      resetForm();
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await recurringService.toggle(id, active);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить правило?')) return;
    await recurringService.delete(id);
    loadData();
  };

  const activeRules = rules.filter((r) => r.active);
  const inactiveRules = rules.filter((r) => !r.active);

  return (
    <div>
      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={resetForm} title={editingId ? '✏️ Редактировать правило' : '➕ Новое повторение'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Счёт</Text>
            <Select options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency_code})` }))} value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)} fullWidth />
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Категория</Text>
            <Select options={[{ value: '', label: 'Без категории' }, ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}`.trim() }))]} value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} fullWidth />
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Сумма (в копейках/центах)</Text>
            <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="50000" fullWidth />
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Частота</Text>
            <Select options={FREQUENCY_OPTIONS} value={formFrequency} onChange={(e) => setFormFrequency(e.target.value)} fullWidth />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
            <Button variant="ghost" onPress={resetForm}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Rules list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <Card key={i} padding="lg"><Skeleton width="80%" height={20} /></Card>)}
        </div>
      ) : rules.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔄</div>
            <Text muted size="lg">Нет повторяющихся правил</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Настройте автоматическое создание транзакций</Text>
          </div>
        </Card>
      ) : (
        <>
          {activeRules.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Text fontWeight="semibold" size="lg" style={{ marginBottom: 12 }}>✅ Активные ({activeRules.length})</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeRules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} accounts={accounts} categories={categories} onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {inactiveRules.length > 0 && (
            <div>
              <Text fontWeight="semibold" size="lg" style={{ marginBottom: 12, color: tokens.colors.muted }}>⏸️ Отключённые ({inactiveRules.length})</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inactiveRules.map((rule) => (
                  <RuleCard key={rule.id} rule={rule} accounts={accounts} categories={categories} onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RuleCard({ rule, accounts, categories, onEdit, onToggle, onDelete }: {
  rule: RecurringRule;
  accounts: Account[];
  categories: Category[];
  onEdit: (rule: RecurringRule) => void;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const account = accounts.find((a) => a.id === rule.account_id);
  const category = categories.find((c) => c.id === rule.category_id);

  return (
    <Card padding="lg" style={{ opacity: rule.active ? 1 : 0.6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: rule.active ? tokens.colors.primaryLight : tokens.colors.border,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}>
          🔄
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text fontWeight="semibold">{account?.name ?? '—'}</Text>
            {category && <Badge variant="default" size="sm">{category.icon} {category.name}</Badge>}
          </div>
          <Text muted size="sm">
            {getFrequencyLabel(rule.rrule)} • {formatCurrency(rule.amount_minor)}
          </Text>
          <Text muted size="sm">Следующий: {formatDate(rule.next_run_at)}</Text>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button variant="ghost" size="sm" onPress={() => onToggle(rule.id, !rule.active)}>
            {rule.active ? '⏸️' : '▶️'}
          </Button>
          <Button variant="ghost" size="sm" onPress={() => onEdit(rule)}>✏️</Button>
          <Button variant="ghost" size="sm" onPress={() => onDelete(rule.id)}>🗑️</Button>
        </div>
      </div>
    </Card>
  );
}
