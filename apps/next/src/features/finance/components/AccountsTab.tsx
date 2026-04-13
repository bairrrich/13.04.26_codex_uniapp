'use client';

import { useState, useEffect, useCallback } from 'react';
import { accountService, type Account } from '../services/financeService';
import { Card, Text, Button, Input, Select, Badge, Skeleton, Divider, Modal } from '@superapp/ui';
import { tokens } from '@superapp/ui';

function formatCurrency(amountMinor: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amountMinor / 100);
}

const CURRENCIES = [
  { value: 'RUB', label: '₽ RUB' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
];

export function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setIsEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCurrency, setFormCurrency] = useState('RUB');
  const [formBalance, setFormBalance] = useState('0');
  const [saving, setSaving] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accountService.listAll();
      setAccounts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const resetForm = () => {
    setModalOpen(false);
    setIsEditingId(null);
    setFormName('');
    setFormCurrency('RUB');
    setFormBalance('0');
  };

  const handleEdit = (acc: Account) => {
    setIsEditingId(acc.id);
    setModalOpen(true);
    setFormName(acc.name);
    setFormCurrency(acc.currency_code);
    setFormBalance(String(acc.balance_minor));
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await accountService.update(editingId, { name: formName, currency_code: formCurrency, balance_minor: parseInt(formBalance, 10) || 0 });
      } else {
        await accountService.create({ name: formName, currency_code: formCurrency, balance_minor: parseInt(formBalance, 10) || 0 });
      }
      resetForm();
      loadAccounts();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить счёт?')) return;
    await accountService.delete(id);
    loadAccounts();
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance_minor, 0);

  return (
    <div>
      {/* Summary */}
      <Card padding="lg" style={{ marginBottom: 24, background: `linear-gradient(135deg, ${tokens.colors.surface}, ${tokens.colors.surfaceActive})` }}>
        <Text muted size="sm">Общий баланс</Text>
        <Text size="3xl" fontWeight="bold" style={{ marginTop: 4 }}>{formatCurrency(totalBalance)}</Text>
        <Text muted size="sm" style={{ marginTop: 4 }}>{accounts.length} счетов</Text>
      </Card>

      {/* Add button */}
      <Button variant="primary" size="lg" onPress={() => setModalOpen(true)} style={{ marginBottom: 24 }}>
        + Добавить счёт
      </Button>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={resetForm} title={editingId ? '✏️ Редактировать счёт' : '➕ Новый счёт'} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Название" value={formName} onChange={(e) => setFormName(e.target.value)} fullWidth autoFocus />
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Валюта</Text>
              <Select options={CURRENCIES} value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} fullWidth />
            </div>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Баланс (копейки/центы)</Text>
              <Input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} fullWidth />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
            <Button variant="ghost" onPress={resetForm}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Accounts list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Skeleton width={120} height={18} style={{ marginBottom: 6 }} />
                  <Skeleton width={80} height={14} />
                </div>
                <Skeleton width={100} height={24} />
              </div>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
            <Text muted size="lg">Нет счетов</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Создайте первый счёт для учёта финансов</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {accounts.map((acc) => (
            <Card key={acc.id} padding="lg">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <Text fontWeight="semibold" size="lg">{acc.name}</Text>
                  <Badge variant="default" size="sm" style={{ marginTop: 4 }}>{acc.currency_code}</Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Text size="xl" fontWeight="bold" style={{ color: acc.balance_minor >= 0 ? tokens.colors.success : tokens.colors.error }}>
                    {formatCurrency(acc.balance_minor, acc.currency_code)}
                  </Text>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="ghost" size="sm" onPress={() => handleEdit(acc)}>✏️</Button>
                    <Button variant="ghost" size="sm" onPress={() => handleDelete(acc.id)}>🗑️</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
