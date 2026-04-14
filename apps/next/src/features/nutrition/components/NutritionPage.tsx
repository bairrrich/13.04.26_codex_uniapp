'use client';

import { Card, Text, Badge, Skeleton, Button, Modal, Input, Select, TextArea, useTheme } from '@superapp/ui';
import { tokens } from '@superapp/ui';
import {
  getDailyNutrition,
  getWeeklySummary,
  mealLogService,
  mealItemService,
  waterLogService,
  foodService,
  goalService,
  recipeService,
  type MealLog,
  type MealItem,
  type FoodItem,
  type NutritionGoal,
} from '../services/nutritionService';
import { useState, useEffect, useCallback } from 'react';

const MEAL_TYPES = [
  { value: 'breakfast', label: '🌅 Завтрак' },
  { value: 'lunch', label: '☀️ Обед' },
  { value: 'dinner', label: '🌙 Ужин' },
  { value: 'snack', label: '🍎 Перекус' },
] as const;

const QUICK_WATER = [150, 250, 350, 500];

// ============================================================
// WEEKLY CHART
// ============================================================

function WeeklyChart({ data, goal }: { data: { date: string; dayName: string; calories: number }[]; goal: number }) {
  const { tokens: c } = useTheme();
  const maxCal = Math.max(...data.map((d) => d.calories), goal, 1);
  return (
    <Card padding="lg">
      <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📊 Неделя</Text>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 140 }}>
        {data.map((day, i) => {
          const pct = (day.calories / maxCal) * 100;
          const isOver = day.calories > goal && goal > 0;
          const isToday = i === data.length - 1;
          return (
            <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {day.calories > 0 && (
                <Text muted size="xs">{day.calories}</Text>
              )}
              <div style={{
                width: '100%',
                height: Math.max(pct * 1.2, 2),
                borderRadius: 4,
                background: isOver ? c.error : isToday ? c.primary : c.warning,
                transition: 'height 0.3s',
                minHeight: day.calories > 0 ? 8 : 4,
                opacity: day.calories === 0 ? 0.2 : 1,
              }}
                title={`${day.calories} ккал`}
              />
              <Text muted size="xs" style={{ fontWeight: isToday ? tokens.fontWeights.bold : tokens.fontWeights.normal, color: isToday ? c.primary : c.muted }}>{day.dayName}</Text>
            </div>
          );
        })}
      </div>
      {/* Goal line */}
      <div style={{ position: 'relative', height: 2, marginTop: -2 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: c.success, borderRadius: 1, opacity: 0.4 }} />
      </div>
      <Text muted size="xs" style={{ marginTop: 4 }}>Цель: {goal} ккал</Text>
    </Card>
  );
}

// ============================================================
// MACRO RING
// ============================================================

function MacroRing({ label, current, target, unit, color, icon }: {
  label: string; current: number; target: number; unit: string; color: string; icon: string;
}) {
  const { tokens: c } = useTheme();
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const isOver = current > target;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 96, height: 96 }}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke={c.border} strokeWidth="6" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke={isOver ? c.error : color}
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
  const { tokens: c } = useTheme();
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

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await foodService.search(searchQuery.trim(), 15);
        setSearchResults(results);
        setSearchPerformed(true);
        setSelectedFood(null);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
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
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Начните вводить название..." fullWidth autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') { /* triggered by debounce */ } }} />
            {searching && <Text muted size="sm" style={{ textAlign: 'center' }}>⏳ Ищем...</Text>}

            {/* Selected food preview + portion */}
            {selectedFood && (
              <Card padding="lg" style={{ background: c.surfaceActive, border: `1px solid ${c.primary}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Text fontWeight="semibold" size="lg">{selectedFood.name}</Text>
                    <Text muted size="sm">{selectedFood.kcal || '—'} ккал на 100г</Text>
                  </div>
                  <Button variant="ghost" size="sm" onPress={() => setSelectedFood(null)}>✕</Button>
                </div>

                {/* Nutrition per portion */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: c.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: c.warning }}>{computedNutrition?.calories}</Text>
                    <Text muted size="xs">ккал</Text>
                  </div>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: c.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: c.success }}>{computedNutrition?.protein}г</Text>
                    <Text muted size="xs">белки</Text>
                  </div>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: c.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: c.error }}>{computedNutrition?.fat}г</Text>
                    <Text muted size="xs">жиры</Text>
                  </div>
                  <div style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, background: c.surfaceHover }}>
                    <Text fontWeight="bold" size="lg" style={{ color: c.info }}>{computedNutrition?.carbs}г</Text>
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
                      background: c.surfaceHover,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = c.primary;
                      (e.currentTarget as HTMLElement).style.background = c.surfaceActive;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                      (e.currentTarget as HTMLElement).style.background = c.surfaceHover;
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
  const { tokens: c } = useTheme();
  const pct = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text fontWeight="semibold" size="lg">💧 Вода</Text>
        <Badge variant={pct >= 100 ? 'success' : 'primary'}>{total} / {goal} мл</Badge>
      </div>
      <div style={{ height: 10, borderRadius: 5, background: c.border, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? c.success : c.info, borderRadius: 5, transition: 'width 0.3s' }} />
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
  const { tokens: c } = useTheme();
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
// STATS TAB
// ============================================================

function StatsTab({ nutrition, weeklyData }: { nutrition: any; weeklyData: any[] }) {
  const { tokens: c } = useTheme();
  const consumed = nutrition?.consumed || { calories: 0, protein_g: 0, fat_g: 0, carbs_g: 0 };
  const goal = nutrition?.goal;
  const total = consumed.calories + consumed.protein_g * 4 + consumed.fat_g * 9 + consumed.carbs_g * 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Macro pie chart */}
      {consumed.calories > 0 && (
        <Card padding="lg">
          <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>🥧 Макронутриенты</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <MacroPie protein={consumed.protein_g} fat={consumed.fat_g} carbs={consumed.carbs_g} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <MacroLegend label="Белки" grams={consumed.protein_g} calPerGram={4} color={c.success} />
              <MacroLegend label="Жиры" grams={consumed.fat_g} calPerGram={9} color={c.error} />
              <MacroLegend label="Углеводы" grams={consumed.carbs_g} calPerGram={4} color={c.info} />
            </div>
          </div>
        </Card>
      )}

      {/* Weekly summary */}
      {weeklyData && weeklyData.length > 0 && (
        <WeeklyChart data={weeklyData} goal={goal?.calories || 2000} />
      )}

      {/* Weekly totals */}
      <Card padding="lg">
        <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📈 Итого за неделю</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
          <StatBox label="Калории" value={weeklyData.reduce((s, d) => s + d.calories, 0).toLocaleString('ru-RU')} unit="ккал" />
          <StatBox label="Белки" value={weeklyData.reduce((s, d) => s + d.protein_g, 0).toFixed(0)} unit="г" />
          <StatBox label="Жиры" value={weeklyData.reduce((s, d) => s + d.fat_g, 0).toFixed(0)} unit="г" />
          <StatBox label="Углеводы" value={weeklyData.reduce((s, d) => s + d.carbs_g, 0).toFixed(0)} unit="г" />
          <StatBox label="Вода" value={(weeklyData.reduce((s, d) => s + d.water_ml, 0) / 1000).toFixed(1)} unit="л" />
          <StatBox label="Приёмы" value={weeklyData.reduce((s, d) => s + d.mealCount, 0)} unit="" />
        </div>
      </Card>

      {/* Daily averages */}
      {weeklyData && weeklyData.length > 0 && (
        <Card padding="lg">
          <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📊 Среднее в день</Text>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12 }}>
            <StatBox label="Калории" value={Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / 7).toLocaleString('ru-RU')} unit="ккал" />
            <StatBox label="Белки" value={(weeklyData.reduce((s, d) => s + d.protein_g, 0) / 7).toFixed(0)} unit="г" />
            <StatBox label="Жиры" value={(weeklyData.reduce((s, d) => s + d.fat_g, 0) / 7).toFixed(0)} unit="г" />
            <StatBox label="Углеводы" value={(weeklyData.reduce((s, d) => s + d.carbs_g, 0) / 7).toFixed(0)} unit="г" />
            <StatBox label="Вода" value={(weeklyData.reduce((s, d) => s + d.water_ml, 0) / 7 / 1000).toFixed(1)} unit="л" />
          </div>
        </Card>
      )}
    </div>
  );
}

function MacroPie({ protein, fat, carbs }: { protein: number; fat: number; carbs: number }) {
  const { tokens: c } = useTheme();
  const pCal = protein * 4;
  const fCal = fat * 9;
  const cCal = carbs * 4;
  const total = pCal + fCal + cCal;
  if (total === 0) return null;

  const pPct = pCal / total;
  const fPct = fCal / total;

  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="50" fill="none" stroke={c.border} strokeWidth="16" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={c.success} strokeWidth="16"
        strokeDasharray={`${pPct * 314} ${314 - pPct * 314}`} transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={c.error} strokeWidth="16"
        strokeDasharray={`${fPct * 314} ${314 - fPct * 314}`} strokeDashoffset={`-${pPct * 314}`} transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="50" fill="none" stroke={c.info} strokeWidth="16"
        strokeDasharray={`${(1 - pPct - fPct) * 314} ${314 - (1 - pPct - fPct) * 314}`} strokeDashoffset={`-${(pPct + fPct) * 314}`} transform="rotate(-90 60 60)" />
      <text x="60" y="56" textAnchor="middle" fill={c.text} fontSize="14" fontWeight="bold">{Math.round(total)}</text>
      <text x="60" y="72" textAnchor="middle" fill={c.muted} fontSize="10">ккал</text>
    </svg>
  );
}

function MacroLegend({ label, grams, calPerGram, color }: { label: string; grams: number; calPerGram: number; color: string }) {
  const { tokens: c } = useTheme();
  const cal = Math.round(grams * calPerGram);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
        <Text size="sm">{label}</Text>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Text size="sm" fontWeight="semibold" as="span">{grams.toFixed(0)}г <Text muted size="xs" as="span">({cal} ккал)</Text></Text>
      </div>
    </div>
  );
}

function StatBox({ label, value, unit }: { label: string; value: string; unit: string }) {
  const { tokens: c } = useTheme();
  return (
    <div style={{ padding: 12, borderRadius: 8, background: c.surfaceHover, textAlign: 'center' }}>
      <Text muted size="xs">{label}</Text>
      <Text size="lg" fontWeight="bold" as="span">{value} <Text muted size="xs" as="span">{unit}</Text></Text>
    </div>
  );
}

// ============================================================
// RECIPES TAB
// ============================================================

function RecipesTab() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await recipeService.list(50);
      setRecipes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Button variant="primary" size="lg" onPress={() => setModalOpen(true)}>+ Добавить рецепт</Button>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <Card key={i} padding="lg"><Skeleton width="60%" height={18} style={{ marginBottom: 8 }} /><Skeleton width="40%" height={14} /></Card>)}
        </div>
      ) : recipes.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
            <Text muted size="lg">Нет рецептов</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Создайте первый рецепт с ингредиентами и КБЖУ</Text>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {recipes.map((recipe) => (
            <Card key={recipe.id} padding="lg" hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text fontWeight="semibold" size="lg">{recipe.title}</Text>
                <Badge variant="default" size="sm">{recipe.servings || 1} порц.</Badge>
              </div>
              {recipe.description && <Text muted size="sm" style={{ marginBottom: 8 }}>{recipe.description}</Text>}
              {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                <Text muted size="xs">⏱️ Подг: {recipe.prep_time_minutes || 0} мин, Готовка: {recipe.cook_time_minutes || 0} мин</Text>
              )}
              <Button variant="ghost" size="sm" style={{ marginTop: 8 }} onPress={async () => {
                try { await recipeService.delete(recipe.id); loadData(); } catch { /* */ }
              }}>🗑️ Удалить</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="📖 Новый рецепт" size="lg">
        <RecipeForm onClose={() => setModalOpen(false)} onSaved={loadData} />
      </Modal>
    </div>
  );
}

function RecipeForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('1');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await recipeService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        prep_time_minutes: parseInt(prepTime) || undefined,
        cook_time_minutes: parseInt(cookTime) || undefined,
        servings: parseInt(servings) || 1,
        instructions: instructions.trim() || undefined,
        items: [],
      });
      onSaved();
      onClose();
    } catch { /* */ } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название рецепта" fullWidth autoFocus />
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание (необязательно)" fullWidth />
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Text muted size="sm" style={{ marginBottom: 4 }}>Подготовка (мин)</Text>
          <Input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} fullWidth />
        </div>
        <div style={{ flex: 1 }}>
          <Text muted size="sm" style={{ marginBottom: 4 }}>Готовка (мин)</Text>
          <Input type="number" value={cookTime} onChange={(e) => setCookTime(e.target.value)} fullWidth />
        </div>
        <div style={{ flex: 1 }}>
          <Text muted size="sm" style={{ marginBottom: 4 }}>Порции</Text>
          <Input type="number" value={servings} onChange={(e) => setServings(e.target.value)} fullWidth />
        </div>
      </div>
      <div>
        <Text muted size="sm" style={{ marginBottom: 4 }}>Инструкция</Text>
        <TextArea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Шаги приготовления..." rows={4} fullWidth />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button variant="primary" onPress={handleSave} loading={saving}>Сохранить</Button>
        <Button variant="ghost" onPress={onClose}>Отмена</Button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN NUTRITION PAGE
// ============================================================

const NUTRITION_TABS = [
  { id: 'daily', label: '📅 День' },
  { id: 'recipes', label: '📖 Рецепты' },
  { id: 'stats', label: '📊 Статистика' },
] as const;
type NutritionTab = typeof NUTRITION_TABS[number]['id'];

export function NutritionPage() {
  const { tokens: c } = useTheme();
  const [activeTab, setActiveTab] = useState<NutritionTab>('daily');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [nutrition, setNutrition] = useState<Awaited<ReturnType<typeof getDailyNutrition>> | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ date: string; dayName: string; calories: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMealType, setAddingMealType] = useState<string | null>(null);
  const [currentMealLogId, setCurrentMealLogId] = useState<string | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [deletingMealLogId, setDeletingMealLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (targetDate?: string) => {
    const d = targetDate || date;
    setLoading(true);
    setError(null);
    try {
      const [data, weekly] = await Promise.all([
        getDailyNutrition(d),
        getWeeklySummary(d),
      ]);
      setNutrition(data);
      setWeeklyData(weekly.days);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { refresh(); }, [date]);

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
      {/* Internal tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {NUTRITION_TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'daily' && (
        <>
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
            <Card padding="lg" style={{ borderColor: c.error }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text error>⚠️ {error}</Text>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="ghost" size="sm" onPress={() => refresh()}>🔄 Обновить</Button>
                  <Button variant="ghost" size="sm" onPress={() => setError(null)}>✕</Button>
                </div>
              </div>
            </Card>
          )
          }

          {/* Macro rings */}
          {
            goal && (
              <Card padding="lg">
                <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>🎯 Дневные цели</Text>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
                  <MacroRing label="Калории" current={consumed.calories} target={goal.calories} unit="" color={c.warning} icon="🔥" />
                  <MacroRing label="Белки" current={consumed.protein_g} target={goal.protein_g} unit="г" color={c.success} icon="🥩" />
                  <MacroRing label="Жиры" current={consumed.fat_g} target={goal.fat_g} unit="г" color={c.error} icon="🧈" />
                  <MacroRing label="Углеводы" current={consumed.carbs_g} target={goal.carbs_g} unit="г" color={c.info} icon="🍞" />
                </div>
              </Card>
            )
          }

          {/* Water */}
          <WaterTracker
            total={consumed.water_ml}
            goal={goal?.water_ml || 2000}
            onAdd={addWater}
            onRefresh={refresh}
          />

          {/* Meals */}
          {
            MEAL_TYPES.map((mt) => {
              const meal = nutrition.meals.find((m) => m.meal_type === mt.value);
              const mealCalories = meal?.items.reduce((s, i) => s + (i.calories || 0), 0) || 0;

              return (
                <Card key={mt.value} padding="lg">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: [c.warning, c.success, c.info, c.primary][['breakfast', 'lunch', 'dinner', 'snack'].indexOf(mt.value)] ?? c.muted }} />
                      <Text fontWeight="semibold" size="lg">{mt.label}</Text>
                      <Text muted size="sm">{mealCalories} ккал</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="ghost" size="sm" onPress={() => { if (!meal) addMeal(mt.value); else { setCurrentMealLogId(meal.id); setAddingMealType(mt.value); } }}>
                        + Добавить
                      </Button>
                      {meal && (
                        <Button variant="ghost" size="sm" onPress={() => { if (confirm('Удалить приём пищи?')) deleteMeal(meal.id); }} aria-label="Удалить приём пищи">
                          🗑️
                        </Button>
                      )}
                    </div>
                  </div>

                  {meal && meal.items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                      {meal.items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, background: c.surfaceHover, opacity: deletingItemId === item.id ? 0.5 : 1 }}>
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
            })
          }

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
        </>
      )}

      {activeTab === 'recipes' && (
        <RecipesTab />
      )}

      {activeTab === 'stats' && (
        <StatsTab nutrition={nutrition} weeklyData={weeklyData} />
      )}
    </div>
  );
}
