'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Badge, Skeleton, Button, Modal, Input, TextArea, useTheme, StatCard } from '@superapp/ui';
import { fitnessService } from '../../src/features/fitness/services/fitnessService';
import { ActiveSession } from '../../src/features/fitness/components/ActiveSession';
import { WorkoutSessionDetail } from '../../src/features/fitness/components/WorkoutSessionDetail';
import { ExercisesTab } from '../../src/features/fitness/components/ExercisesTab';
import { ProgressTab } from '../../src/features/fitness/components/ProgressTab';
import { useIsMobile } from '../../src/hooks/useIsMobile';

import { CalendarTab } from '../../src/features/fitness/components/CalendarTab';
import { TemplatesTab } from '../../src/features/fitness/components/TemplatesTab';

const TABS = ['Обзор', 'Тренировки', 'Упражнения', 'Шаблоны', 'Календарь', 'Прогресс'] as const;
type Tab = (typeof TABS)[number];

export default function FitnessPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Обзор');
  const { tokens: c } = useTheme();
  const isMobile = useIsMobile(768);

  // Overview state
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ totalSessions: number; totalDurationMinutes: number } | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState(0);
  const [activeSessionFlag, setActiveSessionFlag] = useState(false);

  // Workouts state
  const [activeSession, setActiveSession] = useState<Awaited<ReturnType<typeof fitnessService.getActiveSession>>>(null);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof fitnessService.getRecentWorkouts>>>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionNotes, setNewSessionNotes] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, active] = await Promise.all([
        fitnessService.getStatistics(),
        fitnessService.getActiveSession(),
      ]);
      setStats(statsData);
      setActiveSessionFlag(!!active);
      setActiveSession(active);

      const recent = await fitnessService.getRecentWorkouts(7);
      setRecentWorkouts(recent.filter((w: { started_at: string }) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(w.started_at) >= weekAgo;
      }).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setError(null);
    try {
      const [active, recent] = await Promise.all([
        fitnessService.getActiveSession(),
        fitnessService.getRecentWorkouts(20),
      ]);
      setActiveSession(active);
      setSessions(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { if (activeTab === 'Тренировки') loadSessions(); }, [activeTab, loadSessions]);

  const startSession = async () => {
    try {
      const session = await fitnessService.create({
        title: newSessionTitle || undefined,
        notes: newSessionNotes || undefined,
      });
      setActiveSession(session);
      setShowNewSessionModal(false);
      setNewSessionTitle('');
      setNewSessionNotes('');
      await loadSessions();
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания тренировки');
    }
  };

  const handleSessionEnd = async () => {
    setActiveSession(null);
    await loadSessions();
    await loadOverview();
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Удалить тренировку?')) return;
    try {
      await fitnessService.delete(id);
      if (selectedSessionId === id) setSelectedSessionId(null);
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  // Session detail view within workouts tab
  if (activeTab === 'Тренировки' && selectedSessionId) {
    const session = sessions.find((s) => s.id === selectedSessionId) || null;
    return (
      <AppLayout
        headerTitle="Фитнес"
        headerSubtitle="Тренировки"
        headerRight={
          <Button variant="ghost" size="sm" onPress={() => setSelectedSessionId(null)}>
            ← Назад
          </Button>
        }
      >
        {session && <WorkoutSessionDetail session={session} onClose={() => setSelectedSessionId(null)} />}
      </AppLayout>
    );
  }

  return (
    <AppLayout
      headerTitle="Фитнес"
      headerSubtitle="Трекинг тренировок и прогресс"
      headerRight={
        activeTab === 'Тренировки' && !activeSession ? (
          <Button variant="primary" size="sm" onPress={() => setShowNewSessionModal(true)}>
            🏋️ Начать тренировку
          </Button>
        ) : activeTab === 'Тренировки' && activeSession ? (
          <Badge variant="warning" dot>Активная сессия</Badge>
        ) : null
      }
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: isMobile ? 2 : 4, marginBottom: 24, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 8 }}>
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            size={isMobile ? 'xs' : 'sm'}
            onPress={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <Card padding="lg" style={{ borderColor: c.error }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Text error>⚠️ {error}</Text>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm" onPress={() => { setError(null); loadOverview(); loadSessions(); }}>🔄 Повторить</Button>
              <Button variant="ghost" size="sm" onPress={() => setError(null)}>✕</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'Обзор' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} padding="lg">
                  <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={24} />
                </Card>
              ))
            ) : (
              <>
                <StatCard icon="🏋️" label="Всего тренировок" value={stats?.totalSessions ?? 0} />
                <StatCard icon="📅" label="За неделю" value={recentWorkouts} />
                {stats && stats.totalDurationMinutes > 0 && (
                  <StatCard icon="⏱" label="Общее время" value={
                    stats.totalDurationMinutes >= 60
                      ? `${Math.round(stats.totalDurationMinutes / 60)}ч ${stats.totalDurationMinutes % 60}м`
                      : `${stats.totalDurationMinutes} мин`
                  } />
                )}
                {activeSessionFlag && (
                  <Card padding="lg" style={{ borderColor: c.warning }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>🔥</span>
                      <div>
                        <Text muted size="sm">Активная сессия</Text>
                        <Badge variant="warning" dot>В процессе</Badge>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Quick Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            <QuickLinkCard
              onClick={() => setActiveTab('Тренировки')}
              icon="🏋️"
              title="Тренировки"
              description="Начните тренировку, добавляйте упражнения и подходы"
            />
            <QuickLinkCard
              onClick={() => setActiveTab('Упражнения')}
              icon="📋"
              title="Каталог упражнений"
              description="Управляйте базой упражнений по группам мышц"
            />
            <QuickLinkCard
              onClick={() => setActiveTab('Шаблоны')}
              icon="📋"
              title="Шаблоны"
              description="Создавайте шаблоны для быстрого старта тренировки"
            />
            <QuickLinkCard
              onClick={() => setActiveTab('Календарь')}
              icon="📅"
              title="Календарь"
              description="Просмотр тренировок по датам, статистика за месяц"
            />
            <QuickLinkCard
              onClick={() => setActiveTab('Прогресс')}
              icon="🏆"
              title="Прогресс"
              description="Личные рекорды, объём и нагрузка по группам мышц"
            />
          </div>
        </div>
      )}

      {/* Workouts Tab */}
      {activeTab === 'Тренировки' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeSession && (
            <ActiveSession session={activeSession} onEnd={handleSessionEnd} />
          )}

          {!activeSession && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Text fontWeight="semibold" size="lg">История тренировок</Text>
              {sessionsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} padding="lg">
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ width: 120, height: 14, borderRadius: 6, background: c.surfaceHover, marginBottom: 8 }} />
                        <div style={{ width: 80, height: 12, borderRadius: 6, background: c.surfaceHover }} />
                      </div>
                    </div>
                  </Card>
                ))
              ) : sessions.length === 0 ? (
                <Card padding="2xl" variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🏋️</div>
                    <Text muted size="lg">Нет тренировок</Text>
                    <Text muted size="sm" style={{ marginTop: 4 }}>Начните свою первую тренировку!</Text>
                  </div>
                </Card>
              ) : (
                sessions.map((session) => (
                  <Card key={session.id} padding="lg" hoverable style={{ cursor: 'pointer' }}>
                    <div
                      onClick={() => setSelectedSessionId(session.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSessionId(session.id); } }}
                      role="button"
                      tabIndex={0}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
                    >
                      <div>
                        <Text fontWeight="semibold" size="lg">
                          {session.title || 'Тренировка'}
                        </Text>
                        <Text muted size="sm">
                          {new Date(session.started_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                        {session.notes && (
                          <Text muted size="sm" style={{ marginTop: 4, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {session.notes}
                          </Text>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {session.ended_at ? (
                          <Badge variant="success" size="sm">✓ Завершена</Badge>
                        ) : (
                          <Badge variant="warning" dot>В процессе</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => handleDeleteSession(session.id)}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Exercises Tab */}
      {activeTab === 'Упражнения' && <ExercisesTab />}

      {/* Templates Tab */}
      {activeTab === 'Шаблоны' && <TemplatesTab />}

      {/* Calendar Tab */}
      {activeTab === 'Календарь' && <CalendarTab />}

      {/* Progress Tab */}
      {activeTab === 'Прогресс' && <ProgressTab />}

      {/* New Session Modal */}
      <Modal
        isOpen={showNewSessionModal}
        onClose={() => { setShowNewSessionModal(false); setNewSessionTitle(''); setNewSessionNotes(''); }}
        title="🏋️ Новая тренировка"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            placeholder="Название (необязательно)"
            value={newSessionTitle}
            onChange={(e) => setNewSessionTitle(e.target.value)}
            fullWidth
            autoFocus
          />
          <TextArea
            placeholder="Заметки (необязательно)"
            value={newSessionNotes}
            onChange={(e) => setNewSessionNotes(e.target.value)}
            rows={3}
            fullWidth
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={startSession}>Начать</Button>
            <Button variant="ghost" onPress={() => { setShowNewSessionModal(false); setNewSessionTitle(''); setNewSessionNotes(''); }}>Отмена</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function QuickLinkCard({ onClick, icon, title, description }: { onClick: () => void; icon: string; title: string; description: string }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <Card padding="lg" hoverable>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 32 }}>{icon}</span>
          <div>
            <Text fontWeight="semibold" size="lg">{title}</Text>
            <Text muted size="sm">{description}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
