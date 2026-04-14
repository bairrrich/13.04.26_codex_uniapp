'use client';

import { Card, Text, Badge, Skeleton, Button, Modal, Input, Select, TextArea } from '@superapp/ui';
import { tokens } from '@superapp/ui';
import {
  getDailyNutrition,
  mealLogService,
  mealItemService,
  waterLogService,
  foodService,
  goalService,
  type MealLog,
  type MealItem,
  type FoodItem,
  type NutritionGoal,
} from '../services/nutritionService';
import { useState, useEffect, useCallback } from 'react';

const MEAL_TYPES = [
  { value: 'breakfast', label: '🌅 Завтрак', color: '#f59e0b' },
  { value: 'lunch', label: '☀️ Обед', color: '#22c55e' },
  { value: 'dinner', label: '🌙 Ужин', color: '#3b82f6' },
  { value: 'snack', label: '🍎 Перекус', color: '#8b5cf6' },
] as const;

const QUICK_WATER = [150, 250, 350, 500];

// ============================================================
// MACRO RING
// ============================================================

function MacroRing({ label, current, target, unit, color, icon }: {
  label: string; current: number; target: number; unit: string; color: string; icon: string;
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const isOver = current > target;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke={tokens.colors.border} strokeWidth="6" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={isOver ? tokens.colors.error : color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Text size="xs" fontWeight="semibold">{Math.round(current)}</Text>
          <Text muted size="xs">/ {target}{unit}</Text>
        </div>
      </div>
      <Text muted size="sm">{icon} {label}</Text>
    </div>
  );
}

// ============================================================
// MEAL ADD MODAL
// ============================================================

const QUICK_PORTIONS = [50, 100, 150, 200, 250, 300];

function MealAddModal({ isOpen, onClose, mealType, mealLogId, onAdded }: {
  isOpen: boolean; onClose: () => void; mealType: string; mealLogId: string | null;
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<'search' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionGrams, setPortionGrams] = useState(100);
  const [customName, setCustomName] = useState('');
  const [customGrams, setCustomGrams] = useState('100');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedFood(null);
      setPortionGrams(100);
      setCustomName('');
      setCustomGrams('100');
      setCustomCalories('');
      setSearchPerformed(false);
    }
  }, [isOpen]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await foodService.search(searchQuery.trim());
      setSearchResults(results);
      setSearchPerformed(true);
      setSelectedFood(null);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const computedNutrition = selectedFood ? {
    calories: Math.round((selectedFood.kcal || 0) * portionGrams / 100),
    protein: Math.round((selectedFood.protein_g || 0) * portionGrams / 100 * 10) / 10,
    fat: Math.round((selectedFood.fat_g || 0) * portionGrams / 100 * 10) / 10,
    carbs: Math.round((selectedFood.carbs_g || 0) * portionGrams / 100 * 10) / 10,
  } : null;

  const addSelectedFood = async () => {
    if (!selectedFood || !mealLogId) return;
    setSaving(true);
    try {
      await mealItemService.create({
        meal_log_id: mealLogId,
        food_item_id: selectedFood.id,
        name: selectedFood.name,
        grams: portionGrams,
        calories: computedNutrition!.calories,
        protein_g: computedNutrition!.protein,
        fat_g: computedNutrition!.fat,
        carbs_g: computedNutrition!.carbs,
        fiber_g: 0,
      });
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const addCustom = async () => {
    if (!mealLogId || !customName.trim() || !customGrams) return;
    setSaving(true);
    try {
      await mealItemService.create({
        meal_log_id: mealLogId,
        food_item_id: null,
        name: customName.trim(),
        grams: parseFloat(customGrams),
        calories: parseFloat(customCalories) || 0,
        protein_g: parseFloat(customProtein) || 0,
        fat_g: parseFloat(customFat) || 0,
        carbs_g: parseFloat(customCarbs) || 0,
        fiber_g: 0,
      });
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Добавить продукт" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant={mode === 'search' ? 'primary' : 'secondary'} size="sm" fullWidth onPress={() => setMode('search')}>🔍 Из базы</Button>
          <Button variant={mode === 'custom' ? 'primary' : 'secondary'} size="sm" fullWidth onPress={() => setMode('custom')}>✏️ Свой</Button>
        </div>

        {mode === 'search' ? (
          <>
            {/* Search bar */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Название продукта..." fullWidth autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }} />
              <Button variant="primary" onPress={handleSearch} loading={searching}>Найти</Button>
            </div>

            {/* Selected food preview + portion */}
            {selectedFood && (
              <Card padding="lg" style={{ background: tokens.colors.surfaceActive, border: `1px solid ${tokens.colors.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Text fontWeight="semibold" size="lg">{selectedFood.name}</Text>
                    <Text muted size="sm">{selectedFood.kcal || '—'} ккал на 100г</Text>
                  </div>
                  <Button variant="ghost" size="sm" onPress={() => setSelectedFood(null)}>✕</Button>
                </div>

                {/* Nutrition per portion */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: tokens.colors.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: tokens.colors.warning }}>{computedNutrition?.calories}</Text>
                    <Text muted size="xs">ккал</Text>
                  </div>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: tokens.colors.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: tokens.colors.success }}>{computedNutrition?.protein}г</Text>
                    <Text muted size="xs">белки</Text>
                  </div>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: tokens.colors.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: tokens.colors.error }}>{computedNutrition?.fat}г</Text>
                    <Text muted size="xs">жиры</Text>
                  </div>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: tokens.colors.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: tokens.colors.info }}>{computedNutrition?.carbs}г</Text>
                    <Text muted size="xs">углеводы</Text>
                  </div>
                </div>

                {/* Portion selector */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {QUICK_PORTIONS.map((g) => (
                    <Button key={g} variant={portionGrams === g ? 'primary' : 'secondary'} size="sm" onPress={() => setPortionGrams(g)}>{g}г</Button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Text muted size="sm">Свой вес:</Text>
                  <Input type="number" value={String(portionGrams)} onChange={(e) => setPortionGrams(parseInt(e.target.value) || 0)} style={{ width: 80 }} />
                  <Text muted size="sm">грамм</Text>
                </div>

                <Button variant="primary" size="lg" fullWidth onPress={addSelectedFood} loading={saving} style={{ marginTop: 12 }}>
                  ✓ Добавить {portionGrams}г
                </Button>
              </Card>
            )}

            {/* Search results */}
            {searchResults.length > 0 && !selectedFood && (
              <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {searchResults.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => { setSelectedFood(food); setPortionGrams(100); }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid transparent',
                      background: tokens.colors.surfaceHover,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.primary;
                      (e.currentTarget as HTMLElement).style.background = tokens.colors.surfaceActive;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                      (e.currentTarget as HTMLElement).style.background = tokens.colors.surfaceHover;
                    }}
                  >
                    <div>
                      <Text size="sm" fontWeight="medium">{food.name}</Text>
                      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                        <Badge variant="default" size="xs">🔥 {food.kcal || '—'} ккал</Badge>
                        <Badge variant="default" size="xs">Б {food.protein_g || '—'}г</Badge>
                        <Badge variant="default" size="xs">Ж {food.fat_g || '—'}г</Badge>
                        <Badge variant="default" size="xs">У {food.carbs_g || '—'}г</Badge>
                      </div>
                    </div>
                    <Text muted size="xs">→</Text>
                  </button>
                ))}
              </div>
            )}

            {searchPerformed && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Text muted size="lg">🔍 Ничего не найдено</Text>
                <Text muted size="sm">Попробуйте другой запрос или добавьте свой продукт</Text>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Название продукта" fullWidth autoFocus />
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Вес (г)</Text>
                <Input type="number" value={customGrams} onChange={(e) => setCustomGrams(e.target.value)} fullWidth />
              </div>
              <div style={{ flex: 1 }}>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Калории</Text>
                <Input type="number" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} placeholder="ккал" fullWidth />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Белки (г)</Text>
                <Input type="number" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} fullWidth />
              </div>
              <div style={{ flex: 1 }}>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Жиры (г)</Text>
                <Input type="number" value={customFat} onChange={(e) => setCustomFat(e.target.value)} fullWidth />
              </div>
              <div style={{ flex: 1 }}>
                <Text muted size="sm" style={{ marginBottom: 4 }}>Углеводы (г)</Text>
                <Input type="number" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} fullWidth />
              </div>
            </div>
            <Button variant="primary" size="lg" onPress={addCustom} loading={saving} disabled={!customName.trim() || !customGrams}>
              Добавить продукт
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// WATER TRACKER
// ============================================================

function WaterTracker({ total, goal, onAdd, onRefresh }: {
  total: number; goal: number; onAdd: (ml: number) => void; onRefresh: () => void;
}) {
  const pct = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text fontWeight="semibold" size="lg">💧 Вода</Text>
        <Badge variant={pct >= 100 ? 'success' : 'primary'}>{total} / {goal} мл</Badge>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: tokens.colors.border, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? tokens.colors.success : tokens.colors.info, borderRadius: 5, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUICK_WATER.map((ml) => (
          <Button key={ml} variant="secondary" size="sm" onPress={() => { onAdd(ml); onRefresh(); }}>+{ml} мл</Button>
        ))}
      </div>
    </Card>
  );
}

// ============================================================
// GOALS MODAL
// ============================================================

function GoalsModal({ isOpen, onClose, goal, onSaved }: {
  isOpen: boolean; onClose: () => void; goal: NutritionGoal | null;
  onSaved: () => void;
}) {
  const [calories, setCalories] = useState(String(goal?.calories || 2000));
  const [protein, setProtein] = useState(String(goal?.protein_g || 150));
  const [fat, setFat] = useState(String(goal?.fat_g || 65));
  const [carbs, setCarbs] = useState(String(goal?.carbs_g || 250));
  const [fiber, setFiber] = useState(String(goal?.fiber_g || 30));
  const [water, setWater] = useState(String(goal?.water_ml || 2000));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await goalService.upsert({
        calories: parseInt(calories) || 2000,
        protein_g: parseFloat(protein) || 150,
        fat_g: parseFloat(fat) || 65,
        carbs_g: parseFloat(carbs) || 250,
        fiber_g: parseFloat(fiber) || 30,
        water_ml: parseInt(water) || 2000,
      });
      onSaved();
      onClose();
    } catch { /* */ } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Цели питания" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Text muted size="sm" style={{ marginBottom: 4 }}>Калории (ккал)</Text>
          <Input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} fullWidth />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Белки (г)</Text>
            <Input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} fullWidth />
          </div>
          <div style={{ flex: 1 }}>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Жиры (г)</Text>
            <Input type="number" value={fat} onChange={(e) => setFat(e.target.value)} fullWidth />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Углеводы (г)</Text>
            <Input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} fullWidth />
          </div>
          <div style={{ flex: 1 }}>
            <Text muted size="sm" style={{ marginBottom: 4 }}>Клетчатка (г)</Text>
            <Input type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} fullWidth />
          </div>
        </div>
        <div>
          <Text muted size="sm" style={{ marginBottom: 4 }}>Вода (мл)</Text>
          <Input type="number" value={water} onChange={(e) => setWater(e.target.value)} fullWidth />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
          <Button variant="ghost" onPress={onClose}>Отмена</Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// MAIN NUTRITION PAGE
// ============================================================

export function NutritionPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [nutrition, setNutrition] = useState<Awaited<ReturnType<typeof getDailyNutrition>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingMealType, setAddingMealType] = useState<string | null>(null);
  const [currentMealLogId, setCurrentMealLogId] = useState<string | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingMealLogId, setDeletingMealLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDailyNutrition(date);
      setNutrition(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { refresh(); }, [refresh]);

  const addMeal = async (mealType: string) => {
    try {
      const log = await mealLogService.create({ meal_type: mealType as any });
      setCurrentMealLogId(log.id);
      setAddingMealType(mealType);
    } catch { /* */ }
  };

  const addWater = async (ml: number) => {
    try {
      await waterLogService.create({ amount_ml: ml });
      refresh();
    } catch { /* */ }
  };

  const deleteFoodItem = async (itemId: string, mealLogId: string) => {
    try {
      await mealItemService.delete(itemId);
      refresh();
    } catch { /* */ }
  };

  const deleteMeal = async (mealLogId: string) => {
    try {
      await mealLogService.delete(mealLogId);
      refresh();
    } catch { /* */ }
  };

  if (loading || !nutrition) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => <Card key={i} padding="lg"><Skeleton width="100%" height={96} /></Card>)}
        </div>
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={80} />
      </div>
    );
  }

  const goal = nutrition.goal;
  const consumed = nutrition.consumed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Date picker */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="secondary" size="sm" onPress={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10)); }}>← Вчера</Button>
        <Text fontWeight="semibold" size="lg" style={{ flex: 1, textAlign: 'center', minWidth: 200 }}>
          {new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Button variant="secondary" size="sm" onPress={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0, 10)); }}>Завтра →</Button>
        <Button variant="ghost" size="sm" onPress={() => setGoalsOpen(true)}>⚙️ Цели</Button>
      </div>

      {/* Error banner */}
      {error && (
        <Card padding="lg" style={{ borderColor: tokens.colors.error }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text error>⚠️ {error}</Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onPress={() => refresh()}>🔄 Обновить</Button>
              <Button variant="ghost" size="sm" onPress={() => setError(null)}>✕</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Macro rings */}
      {goal && (
        <Card padding="lg">
          <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>🎯 Дневные цели</Text>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
            <MacroRing label="Калории" current={consumed.calories} target={goal.calories} unit="" color={tokens.colors.warning} icon="🔥" />
            <MacroRing label="Белки" current={consumed.protein_g} target={goal.protein_g} unit="г" color={tokens.colors.success} icon="🥩" />
            <MacroRing label="Жиры" current={consumed.fat_g} target={goal.fat_g} unit="г" color={tokens.colors.error} icon="🧈" />
            <MacroRing label="Углеводы" current={consumed.carbs_g} target={goal.carbs_g} unit="г" color={tokens.colors.info} icon="🍞" />
          </div>
        </Card>
      )}

      {/* Water */}
      <WaterTracker
        total={consumed.water_ml}
        goal={goal?.water_ml || 2000}
        onAdd={addWater}
        onRefresh={refresh}
      />

      {/* Meals */}
      {MEAL_TYPES.map((mt) => {
        const meal = nutrition.meals.find((m) => m.meal_type === mt.value);
        const mealCalories = meal?.items.reduce((s, i) => s + (i.calories || 0), 0) || 0;

        return (
          <Card key={mt.value} padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: mt.color }} />
                <Text fontWeight="semibold" size="lg">{mt.label}</Text>
                <Text muted size="sm">{mealCalories} ккал</Text>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Button variant="ghost" size="sm" onPress={() => { if (!meal) addMeal(mt.value); else { setCurrentMealLogId(meal.id); setAddingMealType(mt.value); } }}>
                  + Добавить
                </Button>
                {meal && (
                  <Button variant="ghost" size="sm" onPress={() => { if (confirm('Удалить приём пищи?')) deleteMeal(meal.id); }}>
                    🗑️
                  </Button>
                )}
              </div>
            </div>

            {meal && meal.items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                {meal.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: tokens.colors.surfaceHover, opacity: deletingItemId === item.id ? 0.5 : 1 }}>
                    <div>
                      <Text size="sm">{item.name}</Text>
                      <Text muted size="xs">{item.grams}г</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Text muted size="xs">{item.calories} ккал</Text>
                      <Text muted size="xs">Б:{item.protein_g} Ж:{item.fat_g} У:{item.carbs_g}</Text>
                      <button
                        onClick={() => deleteFoodItem(item.id, meal.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, opacity: 0.6, transition: 'opacity 0.15s' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; }}
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!meal && (
              <Text muted size="sm" style={{ marginTop: 4 }}>Нет записей</Text>
            )}
          </Card>
        );
      })}

      {/* Add modal */}
      <MealAddModal
        isOpen={addingMealType !== null}
        onClose={() => { setAddingMealType(null); setCurrentMealLogId(null); }}
        mealType={addingMealType || ''}
        mealLogId={currentMealLogId}
        onAdded={refresh}
      />

      {/* Goals modal */}
      <GoalsModal
        isOpen={goalsOpen}
        onClose={() => setGoalsOpen(false)}
        goal={nutrition.goal}
        onSaved={refresh}
      />
    </div>
  );
}
