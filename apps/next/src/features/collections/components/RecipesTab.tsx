'use client';

import { Card, Text, Badge, Button, Input, Select, TextArea, useTheme, Modal } from '@superapp/ui';
import { collectionsService, type CollectionItem, type CollectionStatus, type RecipeMetadata } from '../services/collectionsService';
import { useState, useEffect, useCallback } from 'react';

const STATUS_OPTIONS = [
  { value: 'planned', label: '📋 Хочу приготовить' },
  { value: 'in_progress', label: '👨‍🍳 Готовлю' },
  { value: 'completed', label: '✅ Приготовил' },
  { value: 'dropped', label: '❌ Не понравилось' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '🟢 Легко' },
  { value: 'medium', label: '🟡 Средне' },
  { value: 'hard', label: '🔴 Сложно' },
];

const CUISINE_OPTIONS = ['Русская', 'Итальянская', 'Японская', 'Мексиканская', 'Французская', 'Индийская', 'Китайская', 'Средиземноморская', 'Корейская', 'Другая'];
const DIETARY_OPTIONS = ['Вегетарианское', 'Веганское', 'Без глютена', 'Без лактозы', 'Кето', 'Палео', 'Низкокалорийное', 'Высокобелковое'];

export function RecipesTab() {
  const { tokens: c } = useTheme();
  const [recipes, setRecipes] = useState<CollectionItem<'recipe'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formPrepTime, setFormPrepTime] = useState('');
  const [formCookTime, setFormCookTime] = useState('');
  const [formServings, setFormServings] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('');
  const [formCuisine, setFormCuisine] = useState('');
  const [formDietaryTags, setFormDietaryTags] = useState<string[]>([]);
  const [formIngredients, setFormIngredients] = useState('');
  const [formSteps, setFormSteps] = useState('');
  const [formSourceUrl, setFormSourceUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<CollectionStatus>('planned');

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await collectionsService.list<'recipe'>({
        type: 'recipe', limit: 200, search: search || undefined,
        status: (statusFilter as CollectionStatus) || undefined,
      });
      setRecipes(data.data);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  const handleAdd = async () => {
    if (!formTitle.trim()) return;
    const metadata: RecipeMetadata = {
      prepTimeMinutes: formPrepTime ? parseInt(formPrepTime, 10) : undefined,
      cookTimeMinutes: formCookTime ? parseInt(formCookTime, 10) : undefined,
      servings: formServings ? parseInt(formServings, 10) : undefined,
      difficulty: (formDifficulty as RecipeMetadata['difficulty']) || undefined,
      cuisineType: formCuisine || undefined,
      dietaryTags: formDietaryTags.length > 0 ? formDietaryTags : undefined,
      ingredients: formIngredients.split('\n').filter((l) => l.trim()).map((l) => {
        const parts = l.split('—').map((p) => p.trim());
        return { name: parts[0] || l, amount: parts[1] || '' };
      }),
      steps: formSteps.split('\n').filter((l) => l.trim()),
      sourceUrl: formSourceUrl || undefined,
    };
    await collectionsService.create({
      type: 'recipe', title: formTitle.trim(), status: formStatus, metadata,
      notes: formNotes || undefined, source_url: formSourceUrl || undefined,
    });
    resetForm(); loadRecipes();
  };

  const resetForm = () => {
    setFormTitle(''); setFormPrepTime(''); setFormCookTime(''); setFormServings('');
    setFormDifficulty(''); setFormCuisine(''); setFormDietaryTags([]); setFormIngredients('');
    setFormSteps(''); setFormSourceUrl(''); setFormNotes(''); setFormStatus('planned');
  };

  const handleDelete = async (id: string) => { if (!confirm('Удалить рецепт?')) return; await collectionsService.delete(id); loadRecipes(); };
  const handleStatusChange = async (id: string, status: CollectionStatus) => { await collectionsService.update(id, { status }); loadRecipes(); };
  const handleRatingChange = async (id: string, rating: number) => { await collectionsService.update(id, { rating: rating || null }); loadRecipes(); };

  const difficultyBadge = (d?: string) => {
    if (!d) return null;
    const map: Record<string, { variant: 'success' | 'warning' | 'error'; label: string }> = {
      easy: { variant: 'success', label: '🟢 Легко' },
      medium: { variant: 'warning', label: '🟡 Средне' },
      hard: { variant: 'error', label: '🔴 Сложно' },
    };
    const cfg = map[d];
    return cfg ? <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge> : null;
  };

  const grouped: Record<string, CollectionItem<'recipe'>[]> = {};
  for (const r of recipes) { if (!grouped[r.status]) grouped[r.status] = []; grouped[r.status].push(r); }
  const statusLabels: Record<string, string> = { in_progress: '👨‍🍳 Готовлю', planned: '📋 Хочу приготовить', completed: '✅ Приготовил', dropped: '❌ Не понравилось' };
  const statusOrder = ['in_progress', 'planned', 'completed', 'dropped'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="lg">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}><Input placeholder="🔍 Поиск рецептов..." value={search} onChange={(e) => setSearch(e.target.value)} fullWidth /></div>
          <Select options={[{ value: '', label: 'Все статусы' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: 180 }} aria-label="Фильтр" />
          <Button variant="primary" size="sm" onPress={() => { resetForm(); setShowAddModal(true); }}>➕ Добавить</Button>
        </div>
      </Card>

      {loading ? <Text muted style={{ textAlign: 'center', padding: 24 }}>Загрузка...</Text> : recipes.length === 0 ? (
        <Card padding="2xl" variant="outlined"><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 8 }}>🍳</div><Text muted size="lg">Нет рецептов</Text><Text muted size="sm" style={{ marginTop: 4 }}>Добавьте первый рецепт!</Text></div></Card>
      ) : (
        statusOrder.filter((s) => grouped[s]?.length > 0).map((status) => (
          <div key={status}>
            <Text fontWeight="semibold" size="md" style={{ marginBottom: 8, color: c.primary }}>{statusLabels[status]} ({grouped[status].length})</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grouped[status].map((recipe) => {
                const meta = recipe.metadata as RecipeMetadata;
                const totalTime = (meta.prepTimeMinutes || 0) + (meta.cookTimeMinutes || 0);
                return (
                  <Card key={recipe.id} padding="md" hoverable>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <Text fontWeight="semibold" size="lg">{recipe.title}</Text>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {difficultyBadge(meta.difficulty)}
                          {meta.cuisineType && <Badge variant="info" size="sm">{meta.cuisineType}</Badge>}
                          {totalTime > 0 && <Badge variant="default" size="sm">⏱ {totalTime} мин</Badge>}
                          {meta.servings && <Badge variant="default" size="sm">🍽 {meta.servings} порц.</Badge>}
                          {meta.dietaryTags?.map((t) => <Badge key={t} variant="success" size="sm">{t}</Badge>)}
                        </div>
                        {meta.ingredients && meta.ingredients.length > 0 && (
                          <Text muted size="xs" style={{ marginTop: 4 }}>📝 {meta.ingredients.length} ингредиентов</Text>
                        )}
                        {recipe.notes && <Text muted size="xs" style={{ marginTop: 4, fontStyle: 'italic' }}>📝 {recipe.notes}</Text>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <StarRating value={recipe.rating} onChange={(r) => handleRatingChange(recipe.id, r)} />
                        <Select options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} value={recipe.status} onChange={(e) => handleStatusChange(recipe.id, e.target.value as CollectionStatus)} style={{ minWidth: 150 }} />
                        <Button variant="ghost" size="sm" onPress={() => handleDelete(recipe.id)} aria-label="Удалить рецепт">🗑️</Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="🍳 Добавить рецепт" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Название *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} fullWidth autoFocus />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input type="number" placeholder="Подготовка (мин)" value={formPrepTime} onChange={(e) => setFormPrepTime(e.target.value)} fullWidth />
            <Input type="number" placeholder="Готовка (мин)" value={formCookTime} onChange={(e) => setFormCookTime(e.target.value)} fullWidth />
            <Input type="number" placeholder="Порции" value={formServings} onChange={(e) => setFormServings(e.target.value)} fullWidth />
          </div>
          <Select options={[{ value: '', label: 'Сложность' }, ...DIFFICULTY_OPTIONS.map((d) => ({ value: d.value, label: d.label }))]} value={formDifficulty} onChange={(e) => setFormDifficulty(e.target.value)} fullWidth />
          <Select options={[{ value: '', label: 'Кухня' }, ...CUISINE_OPTIONS.map((c) => ({ value: c, label: c }))]} value={formCuisine} onChange={(e) => setFormCuisine(e.target.value)} fullWidth />
          <MultiSelect options={DIETARY_OPTIONS} value={formDietaryTags} onChange={setFormDietaryTags} label="Диетические теги" />
          <TextArea placeholder="Ингредиенты (каждый с новой строки, формат: название — количество)" value={formIngredients} onChange={(e) => setFormIngredients(e.target.value)} rows={4} fullWidth />
          <TextArea placeholder="Шаги приготовления (каждый с новой строки)" value={formSteps} onChange={(e) => setFormSteps(e.target.value)} rows={4} fullWidth />
          <Input placeholder="Источник (URL)" value={formSourceUrl} onChange={(e) => setFormSourceUrl(e.target.value)} fullWidth />
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

function MultiSelect({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  const { tokens: c } = useTheme();
  return (
    <div>
      <Text muted size="sm" style={{ marginBottom: 4 }}>{label}</Text>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map((opt) => {
          const selected = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(selected ? value.filter((v) => v !== opt) : [...value, opt])}
              style={{
                padding: '4px 10px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                background: selected ? c.primaryLight : c.surfaceHover,
                border: `1px solid ${selected ? c.primary : c.border}`,
                color: selected ? c.primary : c.textSecondary,
                transition: 'all 150ms',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
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
