'use client';

import { Card, Text, Badge, Button, Input, Select, TextArea, useTheme, Modal } from '@superapp/ui';
import { collectionsService, type CollectionItem, type CollectionStatus, type SupplementMetadata } from '../services/collectionsService';
import { useState, useEffect, useCallback } from 'react';

const STATUS_OPTIONS = [
  { value: 'planned', label: '📋 Планирую' },
  { value: 'in_progress', label: '💊 Принимаю' },
  { value: 'completed', label: '✅ Принимал' },
  { value: 'dropped', label: '❌ Бросил' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '📅 Ежедневно' },
  { value: 'weekly', label: '📆 Еженедельно' },
  { value: 'as_needed', label: '⚡ По необходимости' },
  { value: 'custom', label: '🔧 Своя схема' },
];

const FORM_OPTIONS = [
  { value: 'pill', label: '💊 Таблетки' },
  { value: 'capsule', label: '💊 Капсулы' },
  { value: 'powder', label: '🥄 Порошок' },
  { value: 'liquid', label: '💧 Жидкость' },
  { value: 'gummy', label: '🍬 Жевательные' },
  { value: 'patch', label: '🩹 Пластырь' },
];

const PURPOSE_OPTIONS = ['Мышцы', 'Суставы', 'Иммунитет', 'Сон', 'Энергия', 'Мозг', 'Кожа', 'Пищеварение', 'Сердце', 'Общее здоровье'];

export function SupplementsTab() {
  const { tokens: c } = useTheme();
  const [supplements, setSupplements] = useState<CollectionItem<'supplement'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formFrequency, setFormFrequency] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formFormType, setFormFormType] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<CollectionStatus>('planned');

  const loadSupplements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await collectionsService.list<'supplement'>({
        type: 'supplement', limit: 200, search: search || undefined,
        status: (statusFilter as CollectionStatus) || undefined,
      });
      setSupplements(data.data);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { loadSupplements(); }, [loadSupplements]);

  const handleAdd = async () => {
    if (!formTitle.trim()) return;
    const metadata: SupplementMetadata = {
      brand: formBrand || undefined,
      dosage: formDosage || undefined,
      frequency: (formFrequency as SupplementMetadata['frequency']) || undefined,
      purpose: formPurpose || undefined,
      formType: (formFormType as SupplementMetadata['formType']) || undefined,
      expiryDate: formExpiryDate || undefined,
      priceMinor: formPrice ? Math.round(parseFloat(formPrice) * 100) : undefined,
      startDate: formStartDate || undefined,
    };
    await collectionsService.create({
      type: 'supplement', title: formTitle.trim(), status: formStatus, metadata,
      notes: formNotes || undefined, date_started: formStartDate || undefined,
    });
    resetForm(); loadSupplements();
  };

  const resetForm = () => {
    setFormTitle(''); setFormBrand(''); setFormDosage(''); setFormFrequency('');
    setFormPurpose(''); setFormFormType(''); setFormExpiryDate(''); setFormPrice('');
    setFormStartDate(''); setFormNotes(''); setFormStatus('planned');
  };

  const handleDelete = async (id: string) => { if (!confirm('Удалить добавку?')) return; await collectionsService.delete(id); loadSupplements(); };
  const handleStatusChange = async (id: string, status: CollectionStatus) => {
    const updates: any = { status };
    if (status === 'in_progress' && !supplements.find((s) => s.id === id)?.date_started) {
      updates.date_started = new Date().toISOString();
    }
    await collectionsService.update(id, updates);
    loadSupplements();
  };
  const handleRatingChange = async (id: string, rating: number) => {
    await collectionsService.update(id, { rating: rating || null, metadata: { effectivenessRating: rating } });
    loadSupplements();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysUntil = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntil < 30 && daysUntil > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const grouped: Record<string, CollectionItem<'supplement'>[]> = {};
  for (const s of supplements) { if (!grouped[s.status]) grouped[s.status] = []; grouped[s.status].push(s); }
  const statusLabels: Record<string, string> = { in_progress: '💊 Принимаю', planned: '📋 Планирую', completed: '✅ Принимал', dropped: '❌ Бросил' };
  const statusOrder = ['in_progress', 'planned', 'completed', 'dropped'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="lg">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}><Input placeholder="🔍 Поиск добавок..." value={search} onChange={(e) => setSearch(e.target.value)} fullWidth /></div>
          <Select options={[{ value: '', label: 'Все статусы' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: 180 }} aria-label="Фильтр" />
          <Button variant="primary" size="sm" onPress={() => { resetForm(); setShowAddModal(true); }}>➕ Добавить</Button>
        </div>
      </Card>

      {/* Expiry Warnings */}
      {supplements.filter((s) => isExpiringSoon((s.metadata as SupplementMetadata)?.expiryDate)).length > 0 && (
        <Card padding="lg" style={{ borderColor: c.warning }}>
          <Text fontWeight="semibold" style={{ color: c.warning }}>⚠️ Скоро истекает срок годности:</Text>
          {supplements.filter((s) => isExpiringSoon((s.metadata as SupplementMetadata)?.expiryDate)).map((s) => (
            <Text key={s.id} muted size="sm">• {s.title} — {(s.metadata as SupplementMetadata).expiryDate}</Text>
          ))}
        </Card>
      )}
      {supplements.filter((s) => isExpired((s.metadata as SupplementMetadata)?.expiryDate)).length > 0 && (
        <Card padding="lg" style={{ borderColor: c.error }}>
          <Text fontWeight="semibold" error>🚫 Просрочено:</Text>
          {supplements.filter((s) => isExpired((s.metadata as SupplementMetadata)?.expiryDate)).map((s) => (
            <Text key={s.id} muted size="sm">• {s.title} — {(s.metadata as SupplementMetadata).expiryDate}</Text>
          ))}
        </Card>
      )}

      {loading ? <Text muted style={{ textAlign: 'center', padding: 24 }}>Загрузка...</Text> : supplements.length === 0 ? (
        <Card padding="2xl" variant="outlined"><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 8 }}>💊</div><Text muted size="lg">Нет добавок</Text><Text muted size="sm" style={{ marginTop: 4 }}>Добавьте первую добавку!</Text></div></Card>
      ) : (
        statusOrder.filter((s) => grouped[s]?.length > 0).map((status) => (
          <div key={status}>
            <Text fontWeight="semibold" size="md" style={{ marginBottom: 8, color: c.primary }}>{statusLabels[status]} ({grouped[status].length})</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grouped[status].map((supplement) => {
                const meta = supplement.metadata as SupplementMetadata;
                return (
                  <Card key={supplement.id} padding="md" hoverable style={{ borderColor: isExpired(meta.expiryDate) ? c.error : isExpiringSoon(meta.expiryDate) ? c.warning : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Text fontWeight="semibold" size="lg">{supplement.title}</Text>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {meta.brand && <Badge variant="default" size="sm">{meta.brand}</Badge>}
                          {meta.dosage && <Badge variant="info" size="sm">💊 {meta.dosage}</Badge>}
                          {meta.frequency && <Badge variant="default" size="sm">{FREQUENCY_OPTIONS.find((f) => f.value === meta.frequency)?.label}</Badge>}
                          {meta.formType && <Badge variant="default" size="sm">{FORM_OPTIONS.find((f) => f.value === meta.formType)?.label}</Badge>}
                          {meta.purpose && <Badge variant="success" size="sm">🎯 {meta.purpose}</Badge>}
                        </div>
                        {meta.startDate && <Text muted size="xs" style={{ marginTop: 4 }}>📅 С {new Date(meta.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>}
                        {meta.expiryDate && (
                          <Text muted size="xs" style={{ marginTop: 2, color: isExpired(meta.expiryDate) ? c.error : isExpiringSoon(meta.expiryDate) ? c.warning : undefined }}>
                            {isExpired(meta.expiryDate) ? '🚫' : '⏳'} Годен до: {new Date(meta.expiryDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        )}
                        {meta.priceMinor && <Text muted size="xs">💰 {(meta.priceMinor / 100).toFixed(0)} ₽</Text>}
                        {supplement.notes && <Text muted size="xs" style={{ marginTop: 4, fontStyle: 'italic' }}>📝 {supplement.notes}</Text>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <StarRating value={supplement.rating} onChange={(r) => handleRatingChange(supplement.id, r)} />
                        <Select options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} value={supplement.status} onChange={(e) => handleStatusChange(supplement.id, e.target.value as CollectionStatus)} style={{ minWidth: 150 }} />
                        <Button variant="ghost" size="sm" onPress={() => handleDelete(supplement.id)} aria-label="Удалить добавку">🗑️</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="💊 Добавить добавку" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Название *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} fullWidth autoFocus />
          <Input placeholder="Бренд" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} fullWidth />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder="Дозировка (мг/мл)" value={formDosage} onChange={(e) => setFormDosage(e.target.value)} fullWidth />
            <Input type="number" placeholder="Цена (₽)" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} fullWidth />
          </div>
          <Select options={[{ value: '', label: 'Частота' }, ...FREQUENCY_OPTIONS.map((f) => ({ value: f.value, label: f.label }))]} value={formFrequency} onChange={(e) => setFormFrequency(e.target.value)} fullWidth />
          <Select options={[{ value: '', label: 'Форма выпуска' }, ...FORM_OPTIONS.map((f) => ({ value: f.value, label: f.label }))]} value={formFormType} onChange={(e) => setFormFormType(e.target.value)} fullWidth />
          <Select options={[{ value: '', label: 'Назначение' }, ...PURPOSE_OPTIONS.map((p) => ({ value: p, label: p }))]} value={formPurpose} onChange={(e) => setFormPurpose(e.target.value)} fullWidth />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input type="date" placeholder="Дата начала" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} fullWidth />
            <Input type="date" placeholder="Срок годности" value={formExpiryDate} onChange={(e) => setFormExpiryDate(e.target.value)} fullWidth />
          </div>
          <Select options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} value={formStatus} onChange={(e) => setFormStatus(e.target.value as CollectionStatus)} fullWidth />
          <TextArea placeholder="Заметки" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} fullWidth />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleAdd} disabled={!formTitle.trim()}>Добавить</Button>
            <Button variant="ghost" onPress={() => { setShowAddModal(false); resetForm(); }}>Отмена</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number | null; onChange: (r: number) => void }) {
  const { tokens: c } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((r) => (
        <button key={r} type="button" onClick={() => onChange(r === value ? 0 : r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: (value ?? 0) >= r ? c.warning : c.mutedLight, padding: 0, lineHeight: 1 }} aria-label={`${r} звёзд`}>★</button>
      ))}
    </div>
  );
}
