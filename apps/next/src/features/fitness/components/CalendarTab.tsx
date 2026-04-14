'use client';

import { useState, useEffect, useCallback } from 'react';
import { fitnessService, type WorkoutSession } from '../services/fitnessService';
import { Card, Text, Badge, Button, useTheme } from '@superapp/ui';

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export function CalendarTab() {
  const { tokens: c } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Load sessions for current month
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const allSessions = await fitnessService.getRecentWorkouts(200);
      // Filter to current month
      const monthSessions = allSessions.filter((s) => {
        const d = new Date(s.started_at);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      setSessions(monthSessions);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Generate calendar days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const d = new Date(year, month - 1, day);
    days.push({ date: d.toISOString().slice(0, 10), day, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d).toISOString().slice(0, 10);
    days.push({ date, day: d, isCurrentMonth: true });
  }

  // Next month days to fill the grid
  const remaining = 42 - days.length; // 6 rows × 7 days
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d).toISOString().slice(0, 10);
    days.push({ date, day: d, isCurrentMonth: false });
  }

  // Group sessions by date
  const sessionsByDate: Record<string, WorkoutSession[]> = {};
  for (const s of sessions) {
    const dateStr = s.started_at.slice(0, 10);
    if (!sessionsByDate[dateStr]) sessionsByDate[dateStr] = [];
    sessionsByDate[dateStr].push(s);
  }

  // Calculate monthly stats
  const monthSessionCount = sessions.length;
  const monthDuration = sessions.reduce((sum, s) => {
    if (s.ended_at) return sum + Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000);
    return sum;
  }, 0);
  const activeDays = new Set(sessions.map((s) => s.started_at.slice(0, 10))).size;

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const selectedSessions = selectedDate ? sessionsByDate[selectedDate] || [] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Month Navigation */}
      <Card padding="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Button variant="ghost" size="sm" onPress={goToPrevMonth}>←</Button>
          <Text fontWeight="bold" size="xl">{MONTHS_RU[month]} {year}</Text>
          <Button variant="ghost" size="sm" onPress={goToNextMonth}>→</Button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Button variant="secondary" size="xs" onPress={goToToday} style={{ fontSize: 12 }}>
            {todayStr === `${year}-${String(month + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` ? '📅 Сегодня' : '← Сегодня'}
          </Button>
        </div>

        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DAYS_RU.map((day) => (
            <Text key={day} muted size="xs" style={{ textAlign: 'center', padding: '4px 0' }}>{day}</Text>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {days.map((dayInfo, idx) => {
            const isToday = dayInfo.date === todayStr;
            const hasWorkout = sessionsByDate[dayInfo.date]?.length > 0;
            const isSelected = dayInfo.date === selectedDate;
            const workoutCount = sessionsByDate[dayInfo.date]?.length || 0;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => dayInfo.isCurrentMonth && setSelectedDate(isSelected ? null : dayInfo.date)}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  border: 'none',
                  cursor: dayInfo.isCurrentMonth ? 'pointer' : 'default',
                  background: isSelected ? c.primaryLight : isToday ? c.primary : 'transparent',
                  color: isToday && !isSelected ? '#ffffff' : dayInfo.isCurrentMonth ? c.text : c.mutedLight,
                  fontWeight: isToday || isSelected ? 'bold' : 'normal',
                  fontSize: 13,
                  opacity: dayInfo.isCurrentMonth ? 1 : 0.4,
                  transition: 'all 150ms',
                  position: 'relative',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                {dayInfo.day}
                {hasWorkout && (
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isToday && !isSelected ? '#fff' : c.success,
                    marginTop: 2,
                  }} />
                )}
                {workoutCount > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: c.error,
                    color: '#ffffff',
                    fontSize: 8,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {workoutCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Monthly Stats */}
      <Card padding="lg">
        <Text fontWeight="semibold" size="md" style={{ marginBottom: 12 }}>📊 Статистика за месяц</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatBox label="Тренировок" value={String(monthSessionCount)} />
          <StatBox label="Активных дней" value={String(activeDays)} />
          <StatBox label="Время" value={monthDuration >= 60 ? `${Math.round(monthDuration / 60)}ч ${monthDuration % 60}м` : `${monthDuration}м`} />
        </div>
      </Card>

      {/* Selected Day Sessions */}
      {selectedDate && (
        <Card padding="lg" style={{ borderColor: c.primary }}>
          <Text fontWeight="semibold" size="md" style={{ marginBottom: 12 }}>
            📅 {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          {selectedSessions.length === 0 ? (
            <Text muted>Нет тренировок в этот день</Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedSessions.map((s) => {
                const duration = s.ended_at ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000) : null;
                return (
                  <div key={s.id} style={{
                    padding: 12,
                    borderRadius: 8,
                    background: c.surfaceHover,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <Text fontWeight="semibold">{s.title || 'Тренировка'}</Text>
                      <Text muted size="xs">
                        {new Date(s.started_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {duration !== null && <Badge variant="primary" size="sm">{duration} мин</Badge>}
                      <Badge variant={s.ended_at ? 'success' : 'warning'} size="sm">
                        {s.ended_at ? '✓' : '⏳'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  const { tokens: c } = useTheme();
  return (
    <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: c.surfaceHover }}>
      <Text size="xl" fontWeight="bold">{value}</Text>
      <Text muted size="xs">{label}</Text>
    </div>
  );
}
