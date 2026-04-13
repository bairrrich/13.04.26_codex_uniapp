'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { investmentService, type InvestmentPosition, type InvestmentAsset } from '../services/investmentsService';
import { Card, Text, Button, Input, Select, Modal, Skeleton, Badge } from '@superapp/ui';
import { tokens } from '@superapp/ui';

function formatRubles(amountMinor: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amountMinor / 100);
}

const ASSET_TYPES = [
  { value: 'stock', label: '📈 Акции' },
  { value: 'bond', label: '💵 Облигации' },
  { value: 'etf', label: '📊 ETF' },
  { value: 'crypto', label: '🪙 Крипта' },
  { value: 'fund', label: '🏦 Фонды' },
];

export function InvestmentsTab({ onAddReady }: { onAddReady?: (fn: () => void) => void }) {
  const [positions, setPositions] = useState<(InvestmentPosition & { asset?: InvestmentAsset })[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formSymbol, setFormSymbol] = useState('');
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formAvgPrice, setFormAvgPrice] = useState('');
  const [formType, setFormType] = useState('stock');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await investmentService.listPositions();
      setPositions(data);
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
    setFormSymbol('');
    setFormName('');
    setFormQuantity('');
    setFormAvgPrice('');
    setFormType('stock');
  };

  const handleSave = async () => {
    if (!formSymbol.trim() || !formQuantity || !formAvgPrice) return;
    setSaving(true);
    try {
      // Note: In a real app, you'd create the asset first if it doesn't exist
      // For now, we use a placeholder asset_id
      await investmentService.addPosition({
        asset_id: '00000000-0000-0000-0000-000000000001', // placeholder
        quantity: formQuantity,
        avg_price_minor: Math.round(parseFloat(formAvgPrice) * 100),
      });
      resetForm();
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить позицию?')) return;
    await investmentService.deletePosition(id);
    loadData();
  };

  const totalInvested = positions.reduce((sum, p) => sum + p.avg_price_minor * parseFloat(p.quantity), 0);

  return (
    <div>
      <Modal isOpen={modalOpen} onClose={resetForm} title="📈 Новая инвестиция" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Тикер</Text>
              <Input value={formSymbol} onChange={(e) => setFormSymbol(e.target.value.toUpperCase())} placeholder="SBER" fullWidth />
            </div>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Тип</Text>
              <Select options={ASSET_TYPES} value={formType} onChange={(e) => setFormType(e.target.value)} fullWidth />
            </div>
          </div>
          <div>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Название</Text>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Сбербанк" fullWidth />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Количество</Text>
              <Input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="10" step="0.01" fullWidth />
            </div>
            <div style={{ flex: 1 }}>
              <Text muted size="sm" style={{ marginBottom: 4 }}>Ср. цена покупки (₽)</Text>
              <Input type="number" value={formAvgPrice} onChange={(e) => setFormAvgPrice(e.target.value)} placeholder="250.50" step="0.01" fullWidth />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
            <Button variant="ghost" onPress={resetForm}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Summary */}
      {!loading && positions.length > 0 && (
        <Card padding="lg" style={{ marginBottom: 24, background: `linear-gradient(135deg, ${tokens.colors.surface}, ${tokens.colors.surfaceActive})` }}>
          <Text muted size="sm">Всего вложено</Text>
          <Text size="3xl" fontWeight="bold" style={{ marginTop: 4 }}>{formatRubles(totalInvested)}</Text>
          <Text muted size="sm" style={{ marginTop: 4 }}>{positions.length} позиций</Text>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <Card key={i} padding="lg"><Skeleton width="60%" height={18} style={{ marginBottom: 8 }} /><Skeleton width="40%" height={24} /></Card>)}
        </div>
      ) : positions.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
            <Text muted size="lg">Нет инвестиций</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Добавьте первую инвестиционную позицию</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {positions.map((pos) => {
            const totalCost = pos.avg_price_minor * parseFloat(pos.quantity);
            return (
              <Card key={pos.id} padding="lg">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text fontWeight="semibold" size="lg">{pos.asset?.symbol ?? '—'}</Text>
                      <Badge variant="primary" size="sm">{ASSET_TYPES.find(t => t.value === 'stock')?.label ?? ''}</Badge>
                    </div>
                    <Text muted size="sm">{pos.asset?.name ?? ''} • {pos.quantity} шт.</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <Text size="lg" fontWeight="bold">{formatRubles(totalCost)}</Text>
                      <Text muted size="xs">Ср. {formatRubles(pos.avg_price_minor)}/шт.</Text>
                    </div>
                    <Button variant="ghost" size="sm" onPress={() => handleDelete(pos.id)}>🗑️</Button>
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
