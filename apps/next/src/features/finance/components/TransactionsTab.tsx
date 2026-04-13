'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  transactionService,
  transferService,
  accountService,
  categoryService,
  type Transaction,
  type Transfer,
  type Account,
  type Category,
  type TransactionFilters,
} from '../services/financeService';
import { Card, Text, Button, Input, Select, TextArea, Badge, Skeleton, Divider, Modal } from '@superapp/ui';
import { tokens } from '@superapp/ui';

function formatCurrency(amountMinor: number, currency = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amountMinor / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function exportToCSV(transactions: Transaction[], transfers: Transfer[], accounts: Account[], categories: Category[]) {
  const rows = [['Дата', 'Тип', 'Счёт', 'Категория', 'Сумма', 'Описание']];

  transactions.forEach((tx) => {
    const acc = accounts.find((a) => a.id === tx.account_id);
    const cat = categories.find((c) => c.id === tx.category_id);
    rows.push([
      tx.occurred_at,
      tx.kind === 'income' ? 'Доход' : 'Расход',
      acc?.name ?? '',
      cat?.name ?? '',
      String(tx.amount_minor / 100),
      tx.description ?? '',
    ]);
  });

  transfers.forEach((tf) => {
    const fromAcc = accounts.find((a) => a.id === tf.from_account_id);
    const toAcc = accounts.find((a) => a.id === tf.to_account_id);
    rows.push([
      tf.occurred_at,
      'Перевод',
      `${fromAcc?.name} → ${toAcc?.name}`,
      '',
      String(tf.amount_minor / 100),
      tf.description ?? '',
    ]);
  });

  const csvContent = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const KIND_OPTIONS = [
  { value: 'income', label: '📈 Доход' },
  { value: 'expense', label: '📉 Расход' },
  { value: 'transfer', label: '🔄 Перевод' },
];

export function TransactionsTab({ onAddReady }: { onAddReady?: (fn: () => void) => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalIncome: number; totalExpense: number; balance: number } | null>(null);

  // Filters
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formKind, setFormKind] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [formAccountId, setFormAccountId] = useState('');
  const [formToAccountId, setFormToAccountId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editTransferId, setEditTransferId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [txResult, tfResult, accs, cats, statsData] = await Promise.all([
        transactionService.list(filters),
        transferService.list(50),
        accountService.listAll(),
        categoryService.list(),
        transactionService.getStats(),
      ]);
      setTransactions(txResult.data);
      setTransfers(tfResult);
      setAccounts(accs);
      setCategories(cats);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { if (onAddReady) onAddReady(() => setModalOpen(true)); }, [onAddReady]);

  useEffect(() => { loadData(); }, [loadData]);

  const resetForm = () => {
    setModalOpen(false);
    setEditingTxId(null);
    setEditTransferId(null);
    setFormKind('expense');
    setFormAccountId(accounts[0]?.id ?? '');
    setFormToAccountId(accounts[1]?.id ?? '');
    setFormCategoryId('');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().slice(0, 16));
  };

  const handleSave = async () => {
    if (!formAccountId || !formAmount || parseInt(formAmount, 10) <= 0) return;
    setSaving(true);
    try {
      if (formKind === 'transfer') {
        if (formAccountId === formToAccountId) {
          alert('Выберите разные счета');
          setSaving(false);
          return;
        }
        if (editingTxId) {
          await transferService.delete(editingTxId);
        }
        await transferService.create({
          from_account_id: formAccountId,
          to_account_id: formToAccountId,
          amount_minor: parseInt(formAmount, 10),
          description: formDescription || undefined,
          occurred_at: formDate ? new Date(formDate).toISOString() : undefined,
        });
      } else {
        if (editingTxId) {
          await transactionService.update(editingTxId, {
            account_id: formAccountId,
            category_id: formCategoryId || null,
            kind: formKind,
            amount_minor: parseInt(formAmount, 10),
            description: formDescription || undefined,
            occurred_at: formDate ? new Date(formDate).toISOString() : undefined,
          });
        } else {
          await transactionService.create({
            account_id: formAccountId,
            category_id: formCategoryId || null,
            kind: formKind,
            amount_minor: parseInt(formAmount, 10),
            description: formDescription || undefined,
            occurred_at: formDate ? new Date(formDate).toISOString() : undefined,
          });
        }
      }
      resetForm();
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить транзакцию?')) return;
    await transactionService.delete(id);
    loadData();
  };

  const handleTransferDelete = async (id: string) => {
    if (!confirm('Удалить перевод?')) return;
    await transferService.delete(id);
    loadData();
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditTransferId(null);
    setFormKind(tx.kind);
    setFormAccountId(tx.account_id);
    setFormCategoryId(tx.category_id ?? '');
    setFormAmount(String(tx.amount_minor));
    setFormDescription(tx.description ?? '');
    setFormDate(tx.occurred_at.slice(0, 16));
    setModalOpen(true);
  };

  const handleEditTransfer = (tf: Transfer) => {
    setEditTransferId(tf.id);
    setEditingTxId(tf.id);
    setFormKind('transfer');
    setFormAccountId(tf.from_account_id);
    setFormToAccountId(tf.to_account_id);
    setFormAmount(String(tf.amount_minor));
    setFormDescription(tf.description ?? '');
    setFormDate(tf.occurred_at.slice(0, 16));
    setModalOpen(true);
  };

  const filteredCategories = categories.filter((c) => c.kind === formKind);

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Доходы" value={formatCurrency(stats.totalIncome)} color={tokens.colors.success} />
          <StatCard label="Расходы" value={formatCurrency(stats.totalExpense)} color={tokens.colors.error} />
          <StatCard label="Баланс" value={formatCurrency(stats.balance)} color={stats.balance >= 0 ? tokens.colors.success : tokens.colors.error} />
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={resetForm} title={editingTxId ? '✏️ Редактировать операцию' : '➕ Новая операция'} size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {KIND_OPTIONS.map((opt) => (
              <Button key={opt.value} variant={formKind === opt.value ? 'primary' : 'secondary'} size="sm" fullWidth onPress={() => { setFormKind(opt.value as 'income' | 'expense' | 'transfer'); setFormCategoryId(''); }}>
                {opt.label}
              </Button>
            ))}
          </div>

          {formKind === 'transfer' ? (
            <>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Text muted size="sm" style={{ marginBottom: 4 }}>Откуда</Text>
                  <Select options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency_code})` }))} value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)} fullWidth />
                </div>
                <div style={{ flex: 1 }}>
                  <Text muted size="sm" style={{ marginBottom: 4 }}>Куда</Text>
                  <Select options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency_code})` }))} value={formToAccountId} onChange={(e) => setFormToAccountId(e.target.value)} fullWidth />
                </div>
              </div>
              <div>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Сумма</Text>
                <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="1000" fullWidth />
              </div>
            </>
          ) : (
            <>
              <div>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Счёт</Text>
                <Select options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.currency_code})` }))} value={formAccountId} onChange={(e) => setFormAccountId(e.target.value)} fullWidth />
              </div>
              <div>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Категория</Text>
                <Select options={[{ value: '', label: 'Без категории' }, ...filteredCategories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}`.trim() }))]} value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} fullWidth />
              </div>
              <div>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Сумма (в копейках/центах)</Text>
                <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="1000" fullWidth />
              </div>
            </>
          )}

          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Описание</Text>
            <TextArea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Необязательно" fullWidth rows={2} />
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Дата</Text>
            <Input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} fullWidth />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
            <Button variant="ghost" onPress={resetForm}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Filters & Export */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <Button variant="secondary" size="lg" onPress={() => setShowFilters(!showFilters)}>
          🔍 Фильтры
        </Button>
        <Button variant="secondary" size="lg" onPress={() => exportToCSV(transactions, transfers, accounts, categories)}>
          📥 Экспорт
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card padding="lg" style={{ marginBottom: 24 }}>
          <Text fontWeight="semibold" size="md" style={{ marginBottom: 12 }}>🔍 Фильтры</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Тип</Text>
                <Select options={[{ value: '', label: 'Все' }, ...KIND_OPTIONS]} value={filters.kind ?? ''} onChange={(e) => setFilters({ ...filters, kind: (e.target.value as any) || undefined })} fullWidth />
              </div>
              <div style={{ flex: 1 }}>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Счёт</Text>
                <Select options={[{ value: '', label: 'Все' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} value={filters.accountId ?? ''} onChange={(e) => setFilters({ ...filters, accountId: e.target.value || undefined })} fullWidth />
              </div>
            </div>
            <Button variant="ghost" size="sm" onPress={() => setFilters({})}>Сбросить фильтры</Button>
          </div>
        </Card>
      )}

      {/* Unified transactions list (transactions + transfers) */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg"><Skeleton width="100%" height={16} /></Card>
          ))}
        </div>
      ) : transactions.length === 0 && transfers.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
            <Text muted size="lg">Нет операций</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Добавьте первую запись о доходе, расходе или переводе</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            ...transactions.map((tx) => ({ ...tx, _type: 'tx' as const })),
            ...transfers.map((tf) => ({ ...tf, _type: 'tf' as const })),
          ]
            .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
            .slice(0, 50)
            .map((item) => {
              if (item._type === 'tf') {
                const tf = item as Transfer;
                const fromAcc = accounts.find((a) => a.id === tf.from_account_id);
                const toAcc = accounts.find((a) => a.id === tf.to_account_id);
                return (
                  <Card key={tf.id} padding="lg">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <Badge variant="default" dot>🔄 Перевод</Badge>
                        </div>
                        <Text size="sm">
                          <span style={{ color: tokens.colors.error }}>{fromAcc?.name ?? '—'}</span>
                          <span style={{ margin: '0 8px', color: tokens.colors.muted }}>→</span>
                          <span style={{ color: tokens.colors.success }}>{toAcc?.name ?? '—'}</span>
                        </Text>
                        {tf.description && <Text muted size="sm">{tf.description}</Text>}
                        <Text muted size="sm">{formatDate(tf.occurred_at)}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Text size="xl" fontWeight="bold">{formatCurrency(tf.amount_minor, fromAcc?.currency_code)}</Text>
                        <Button variant="ghost" size="sm" onPress={() => handleEditTransfer(tf)}>✏️</Button>
                        <Button variant="ghost" size="sm" onPress={() => handleTransferDelete(tf.id)}>🗑️</Button>
                      </div>
                    </div>
                  </Card>
                );
              }

              const tx = item as Transaction;
              const account = accounts.find((a) => a.id === tx.account_id);
              const category = categories.find((c) => c.id === tx.category_id);
              const isIncome = tx.kind === 'income';

              return (
                <Card key={tx.id} padding="lg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Badge variant={isIncome ? 'success' : 'error'} dot>
                          {isIncome ? 'Доход' : 'Расход'}
                        </Badge>
                        {category && (
                          <Badge variant="default">{category.icon ?? ''} {category.name}</Badge>
                        )}
                      </div>
                      {tx.description && <Text size="sm">{tx.description}</Text>}
                      <Text muted size="sm">{formatDate(tx.occurred_at)} • {account?.name ?? '—'}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Text size="xl" fontWeight="bold" style={{ color: isIncome ? tokens.colors.success : tokens.colors.error }}>
                        {isIncome ? '+' : '−'}{formatCurrency(tx.amount_minor, account?.currency_code)}
                      </Text>
                      <Button variant="ghost" size="sm" onPress={() => handleEditTransaction(tx)}>✏️</Button>
                      <Button variant="ghost" size="sm" onPress={() => handleDelete(tx.id)}>🗑️</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card padding="lg">
      <Text muted size="sm">{label}</Text>
      <Text size="xl" fontWeight="bold" style={{ color, marginTop: 4 }}>{value}</Text>
    </Card>
  );
}
