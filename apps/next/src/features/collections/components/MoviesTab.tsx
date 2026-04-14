'use client';

import { Card, Text, Badge, Button, Input, Select, TextArea, useTheme, Modal } from '@superapp/ui';
import { collectionsService, type CollectionItem, type CollectionStatus, type MovieMetadata } from '../services/collectionsService';
import { useState, useEffect, useCallback } from 'react';

const STATUS_OPTIONS = [
  { value: 'planned', label: '🎬 Хочу посмотреть' },
  { value: 'in_progress', label: '▶️ Смотрю' },
  { value: 'completed', label: '✅ Посмотрел' },
  { value: 'dropped', label: '❌ Бросил' },
];

const GENRE_OPTIONS = ['Боевик', 'Комедия', 'Драма', 'Фантастика', 'Триллер', 'Ужасы', 'Документальный', 'Анимация', 'Мелодрама', 'Приключения'];
const PLATFORM_OPTIONS = ['Netflix', 'Кинопоиск', 'Иви', 'Okko', 'Apple TV+', 'HBO', 'Кинозал', 'Другое'];

export function MoviesTab() {
  const { tokens: c } = useTheme();
  const [movies, setMovies] = useState<CollectionItem<'movie'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formDirector, setFormDirector] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formRuntime, setFormRuntime] = useState('');
  const [formGenre, setFormGenre] = useState('');
  const [formPlatform, setFormPlatform] = useState('');
  const [formWatchDate, setFormWatchDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<CollectionStatus>('planned');

  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await collectionsService.list<'movie'>({
        type: 'movie',
        limit: 200,
        search: search || undefined,
        status: (statusFilter as CollectionStatus) || undefined,
      });
      setMovies(data.data);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadMovies(); }, [loadMovies]);

  const handleAdd = async () => {
    if (!formTitle.trim()) return;
    const metadata: MovieMetadata = {
      director: formDirector || undefined,
      releaseYear: formYear ? parseInt(formYear, 10) : undefined,
      runtimeMinutes: formRuntime ? parseInt(formRuntime, 10) : undefined,
      genres: formGenre ? [formGenre] : undefined,
      streamingPlatform: formPlatform || undefined,
      watchDate: formWatchDate || undefined,
    };
    await collectionsService.create({
      type: 'movie',
      title: formTitle.trim(),
      status: formStatus,
      metadata,
      notes: formNotes || undefined,
      date_completed: formStatus === 'completed' ? new Date().toISOString() : undefined,
    });
    resetForm();
    loadMovies();
  };

  const resetForm = () => {
    setFormTitle(''); setFormDirector(''); setFormYear(''); setFormRuntime('');
    setFormGenre(''); setFormPlatform(''); setFormWatchDate(''); setFormNotes(''); setFormStatus('planned');
  };

  const handleDelete = async (id: string) => { if (!confirm('Удалить фильм?')) return; await collectionsService.delete(id); loadMovies(); };
  const handleStatusChange = async (id: string, status: CollectionStatus) => {
    const updates: any = { status };
    if (status === 'completed') { updates.date_completed = new Date().toISOString(); updates.rewatch_count = 0; }
    await collectionsService.update(id, updates);
    loadMovies();
  };
  const handleRatingChange = async (id: string, rating: number) => { await collectionsService.update(id, { rating: rating || null }); loadMovies(); };
  const handleRewatch = async (id: string, movie: CollectionItem<'movie'>) => {
    await collectionsService.update(id, { rewatch_count: (movie.rewatch_count || 0) + 1, status: 'completed', date_completed: new Date().toISOString() });
    loadMovies();
  };

  const grouped: Record<string, CollectionItem<'movie'>[]> = {};
  for (const m of movies) { if (!grouped[m.status]) grouped[m.status] = []; grouped[m.status].push(m); }

  const statusLabels: Record<string, string> = { in_progress: '▶️ Смотрю', planned: '🎬 Хочу посмотреть', completed: '✅ Посмотрел', dropped: '❌ Бросил' };
  const statusOrder = ['in_progress', 'planned', 'completed', 'dropped'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="lg">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input placeholder="🔍 Поиск по названию или режиссёру..." value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
          </div>
          <Select options={[{ value: '', label: 'Все статусы' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: 180 }} aria-label="Фильтр по статусу" />
          <Button variant="primary" size="sm" onPress={() => { resetForm(); setShowAddModal(true); }}>➕ Добавить</Button>
        </div>
      </Card>

      {loading ? <Text muted style={{ textAlign: 'center', padding: 24 }}>Загрузка...</Text> : movies.length === 0 ? (
        <Card padding="2xl" variant="outlined"><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 8 }}>🎬</div><Text muted size="lg">Нет фильмов</Text><Text muted size="sm" style={{ marginTop: 4 }}>Добавьте первый фильм!</Text></div></Card>
      ) : (
        statusOrder.filter((s) => grouped[s]?.length > 0).map((status) => (
          <div key={status}>
            <Text fontWeight="semibold" size="md" style={{ marginBottom: 8, color: c.primary }}>{statusLabels[status]} ({grouped[status].length})</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grouped[status].map((movie) => (
                <Card key={movie.id} padding="md" hoverable>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <Text fontWeight="semibold" size="lg">{movie.title}</Text>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {movie.metadata?.director && <Text muted size="sm">🎬 {movie.metadata.director}</Text>}
                        {movie.metadata?.releaseYear && <Text muted size="sm">· {movie.metadata.releaseYear}</Text>}
                        {movie.metadata?.runtimeMinutes && <Text muted size="sm">· {movie.metadata.runtimeMinutes} мин</Text>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {movie.metadata?.genres?.map((g) => <Badge key={g} variant="info" size="sm">{g}</Badge>)}
                        {movie.metadata?.streamingPlatform && <Badge variant="default" size="sm">📺 {movie.metadata.streamingPlatform}</Badge>}
                        {movie.rewatch_count > 0 && <Badge variant="warning" size="sm">🔄 Пересмотрено: {movie.rewatch_count}x</Badge>}
                      </div>
                      {movie.metadata?.watchDate && <Text muted size="xs" style={{ marginTop: 4 }}>📅 {new Date(movie.metadata.watchDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>}
                      {movie.notes && <Text muted size="xs" style={{ marginTop: 4, fontStyle: 'italic' }}>📝 {movie.notes}</Text>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <StarRating value={movie.rating} onChange={(r) => handleRatingChange(movie.id, r)} />
                      <Select options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} value={movie.status} onChange={(e) => handleStatusChange(movie.id, e.target.value as CollectionStatus)} style={{ minWidth: 150 }} />
                      {movie.status === 'completed' && <Button variant="ghost" size="sm" onPress={() => handleRewatch(movie.id, movie)} aria-label="Пересмотреть">🔄</Button>}
                      <Button variant="ghost" size="sm" onPress={() => handleDelete(movie.id)} aria-label="Удалить фильм">🗑️</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="🎬 Добавить фильм" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Название *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} fullWidth autoFocus />
          <Input placeholder="Режиссёр" value={formDirector} onChange={(e) => setFormDirector(e.target.value)} fullWidth />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input type="number" placeholder="Год" value={formYear} onChange={(e) => setFormYear(e.target.value)} fullWidth />
            <Input type="number" placeholder="Длит. (мин)" value={formRuntime} onChange={(e) => setFormRuntime(e.target.value)} fullWidth />
          </div>
          <Select options={[{ value: '', label: 'Жанр' }, ...GENRE_OPTIONS.map((g) => ({ value: g, label: g }))]} value={formGenre} onChange={(e) => setFormGenre(e.target.value)} fullWidth />
          <Select options={[{ value: '', label: 'Где смотрел' }, ...PLATFORM_OPTIONS.map((p) => ({ value: p, label: p }))]} value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} fullWidth />
          <Input type="date" placeholder="Дата просмотра" value={formWatchDate} onChange={(e) => setFormWatchDate(e.target.value)} fullWidth />
          <Select options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} value={formStatus} onChange={(e) => setFormStatus(e.target.value as CollectionStatus)} fullWidth />
          <TextArea placeholder="Рецензия / заметки" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} fullWidth />
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
