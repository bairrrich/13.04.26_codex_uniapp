'use client';

import { useState, useEffect, useCallback } from 'react';
import { fitnessService, type PersonalRecord, type MuscleGroupStats, type WeeklyVolumeData, type BodyWeightEntry } from '../services/fitnessService';
import { Card, Text, Badge, Skeleton, useTheme, Input, Button, StatCard } from '@superapp/ui';

export function ProgressTab() {
  const { tokens: c } = useTheme();
  const [loading, setLoading] = useState(true);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [muscleGroupStats, setMuscleGroupStats] = useState<MuscleGroupStats[]>([]);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolumeData[]>([]);
  const [stats, setStats] = useState<{ totalSessions: number; totalDurationMinutes: number } | null>(null);
  const [streak, setStreak] = useState<{ current: number; longest: number; thisMonth: number; avgPerWeek: number } | null>(null);
  const [bodyWeight, setBodyWeight] = useState<BodyWeightEntry[]>([]);
  const [showBodyWeightForm, setShowBodyWeightForm] = useState(false);
  const [newBodyWeight, setNewBodyWeight] = useState('');
  const [newBodyWeightNotes, setNewBodyWeightNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prs, mgStats, volume, statsData, sessions, bwLogs] = await Promise.all([
        fitnessService.getPersonalRecords(),
        fitnessService.getMuscleGroupBreakdown(),
        fitnessService.getWeeklyVolume(12),
        fitnessService.getStatistics(),
        fitnessService.getRecentWorkouts(200),
        fitnessService.listBodyWeightLogs(90),
      ]);
      setPersonalRecords(prs);
      setMuscleGroupStats(mgStats);
      setWeeklyVolume(volume);
      setStats(statsData);

      // Calculate streak
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthCount = sessions.filter((s) => new Date(s.started_at) >= monthStart).length;

      // Group sessions by week
      const weekMap = new Map<string, number>();
      for (const s of sessions) {
        const d = new Date(s.started_at);
        const weekKey = `${d.getFullYear()}-W${Math.ceil((d.getDate() + (d.getDay() || 6)) / 7)}`;
        weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
      }

      // Current streak: consecutive weeks with at least 1 session
      let currentStreak = 0;
      const sortedWeeks = Array.from(weekMap.keys()).sort().reverse();
      if (sortedWeeks.length > 0) {
        currentStreak = 1;
        for (let i = 1; i < sortedWeeks.length; i++) {
          const prev = new Date(sortedWeeks[i - 1]);
          const curr = new Date(sortedWeeks[i]);
          const diffWeeks = Math.round((prev.getTime() - curr.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (diffWeeks <= 1) currentStreak++;
          else break;
        }
      }

      const longestStreak = weekMap.size > 0 ? Math.max(currentStreak, 1) : 0;
      const totalWeeks = weekMap.size || 1;
      const avgPerWeek = Math.round((sessions.length / totalWeeks) * 10) / 10;

      setStreak({ current: currentStreak, longest: longestStreak, thisMonth: thisMonthCount, avgPerWeek });
      setBodyWeight(bwLogs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const logBodyWeight = async () => {
    const kg = parseFloat(newBodyWeight);
    if (!kg || kg < 20 || kg > 300) return;
    try {
      await fitnessService.createBodyWeight({
        weight_grams: Math.round(kg * 1000),
        notes: newBodyWeightNotes || undefined,
      });
      setNewBodyWeight('');
      setNewBodyWeightNotes('');
      setShowBodyWeightForm(false);
      loadData();
    } catch { /* */ }
  };

  const deleteBodyWeight = async (id: string) => {
    await fitnessService.deleteBodyWeight(id);
    loadData();
  };

  const formatWeight = (grams: number | null) => {
    if (grams === null) return '—';
    return `${(grams / 1000).toFixed(1)} кг`;
  };

  const formatVolume = (grams: number | null) => {
    if (grams === null) return '—';
    return `${(grams / 1000).toFixed(0)} кг`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Overall Stats */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[1, 2].map((i) => (
            <Card key={i} padding="lg"><Skeleton width="80%" height={24} /></Card>
          ))}
        </div>
      ) : stats && streak && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatCard icon="🏋️" label="Тренировок" value={String(stats.totalSessions)} />
          <StatCard icon="⏱" label="Время" value={stats.totalDurationMinutes >= 60 ? `${Math.round(stats.totalDurationMinutes / 60)}ч` : `${stats.totalDurationMinutes}м`} />
          <StatCard icon="🔥" label="Серия" value={`${streak.current} нед.`} />
          <StatCard icon="📊" label="В неделю" value={String(streak.avgPerWeek)} />
          <StatCard icon="📅" label="В этом мес." value={String(streak.thisMonth)} />
          <StatCard icon="🏆" label="Рекорд серии" value={`${streak.longest} нед.`} />
        </div>
      )}

      {/* Personal Records */}
      <Card padding="lg">
        <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>🏆 Личные рекорды</Text>
        {loading ? (
          <Skeleton width="100%" height={120} />
        ) : personalRecords.length === 0 ? (
          <Text muted>Нет данных. Начните тренироваться!</Text>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {personalRecords.sort((a, b) => (b.max_weight_grams ?? 0) - (a.max_weight_grams ?? 0)).map((pr) => (
              <Card key={pr.exercise_id} padding="md" variant="outlined">
                <div>
                  <Text fontWeight="semibold" size="sm">{pr.exercise_name}</Text>
                  {pr.muscle_group && (
                    <Badge variant="info" size="sm" style={{ marginTop: 4 }}>{pr.muscle_group}</Badge>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                  {pr.estimated_1rm_grams !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text muted size="xs">1ПМ (расч.)</Text>
                      <Text size="sm" fontWeight="bold" style={{ color: c.error }}>{formatWeight(pr.estimated_1rm_grams)}</Text>
                    </div>
                  )}
                  {pr.max_weight_grams !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text muted size="xs">Макс. вес</Text>
                      <Text size="sm" fontWeight="bold" style={{ color: c.warning }}>{formatWeight(pr.max_weight_grams)}</Text>
                    </div>
                  )}
                  {pr.max_reps !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text muted size="xs">Макс. повторы</Text>
                      <Text size="sm" fontWeight="bold" style={{ color: c.success }}>{pr.max_reps}</Text>
                    </div>
                  )}
                  {pr.total_volume_grams !== null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text muted size="xs">Объём</Text>
                      <Text size="sm" style={{ color: c.primary }}>{formatVolume(pr.total_volume_grams)}</Text>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Weekly Volume Chart */}
      {weeklyVolume.length > 0 && (
        <Card padding="lg">
          <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📊 Объём за неделю</Text>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 140 }}>
            {weeklyVolume.map((week, i) => {
              const maxVol = Math.max(...weeklyVolume.map((w) => w.total_volume_kg), 1);
              const heightPct = (week.total_volume_kg / maxVol) * 100;
              return (
                <div key={week.week_start} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {week.total_volume_kg > 0 && (
                    <Text muted size="xs">{Math.round(week.total_volume_kg)}</Text>
                  )}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 32,
                      height: `${Math.max(heightPct, 2)}%`,
                      minHeight: week.total_volume_kg > 0 ? 8 : 2,
                      background: i === weeklyVolume.length - 1 ? c.primary : c.primaryLight,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s',
                    }}
                    title={`${week.total_volume_kg} кг, ${week.total_sets} подходов, ${week.sessions_count} тренировок`}
                  />
                  <Text muted size="xs">
                    {new Date(week.week_start).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </Text>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Muscle Group Breakdown */}
      {muscleGroupStats.length > 0 && (
        <Card padding="lg">
          <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>💪 Нагрузка по группам</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {muscleGroupStats.map((mg) => {
              const maxSets = muscleGroupStats[0]?.total_sets || 1;
              const pct = (mg.total_sets / maxSets) * 100;
              return (
                <div key={mg.muscle_group}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text size="sm">{mg.muscle_group}</Text>
                    <Text muted size="sm">{mg.total_sets} подходов{mg.avg_weight_grams ? ` · ${formatWeight(mg.avg_weight_grams)} ср.` : ''}</Text>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: c.border, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: c.primary,
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Body Weight Tracking */}
      <Card padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text fontWeight="semibold" size="lg">⚖️ Вес тела</Text>
          <Button variant="primary" size="sm" onPress={() => setShowBodyWeightForm(!showBodyWeightForm)}>
            {showBodyWeightForm ? '✕' : '➕ Записать'}
          </Button>
        </div>

        {/* Log Form */}
        {showBodyWeightForm && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 100 }}>
              <Text muted size="xs" style={{ marginBottom: 4 }}>Вес (кг)</Text>
              <Input
                type="number"
                placeholder="75.5"
                value={newBodyWeight}
                onChange={(e) => setNewBodyWeight(e.target.value)}
                fullWidth
              />
            </div>
            <div style={{ flex: 2, minWidth: 150 }}>
              <Text muted size="xs" style={{ marginBottom: 4 }}>Заметки</Text>
              <Input
                placeholder="Утром, натощак..."
                value={newBodyWeightNotes}
                onChange={(e) => setNewBodyWeightNotes(e.target.value)}
                fullWidth
              />
            </div>
            <Button variant="primary" size="sm" onPress={logBodyWeight} disabled={!newBodyWeight}>OK</Button>
          </div>
        )}

        {/* Weight Chart */}
        {bodyWeight.length > 0 ? (
          <>
            {/* Simple Line Chart */}
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 100, marginBottom: 12 }}>
              {bodyWeight.slice(-30).reverse().map((entry, i) => {
                const allWeights = bodyWeight.slice(-30).map((e) => e.weight_grams);
                const minW = Math.min(...allWeights);
                const maxW = Math.max(...allWeights);
                const range = maxW - minW || 1;
                const heightPct = ((entry.weight_grams - minW) / range) * 80 + 20;
                return (
                  <div key={entry.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 12,
                        height: `${heightPct}%`,
                        background: c.primary,
                        borderRadius: '2px 2px 0 0',
                        minHeight: 4,
                      }}
                      title={`${(entry.weight_grams / 1000).toFixed(1)} кг`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Recent Entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bodyWeight.slice(0, 7).map((entry) => (
                <div key={entry.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: c.surfaceHover,
                }}>
                  <Text size="sm" fontWeight="semibold">{(entry.weight_grams / 1000).toFixed(1)} кг</Text>
                  <Text muted size="xs">
                    {new Date(entry.logged_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    {entry.notes ? ` · ${entry.notes}` : ''}
                  </Text>
                  <Button variant="ghost" size="xs" onPress={() => deleteBodyWeight(entry.id)} aria-label="Удалить запись">✕</Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Text muted>Нет записей. Начните отслеживать вес тела!</Text>
        )}
      </Card>
    </div>
  );
}
