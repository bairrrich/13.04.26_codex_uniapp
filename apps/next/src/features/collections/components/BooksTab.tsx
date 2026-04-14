'use client';

import { Card, Text, Badge, Button, Input, Select, TextArea, useTheme, Modal } from '@superapp/ui';
import { collectionsService, type CollectionItem, type CollectionStatus, type BookMetadata } from '../services/collectionsService';
import { useState, useEffect, useCallback } from 'react';

type BookStatus = CollectionStatus;

const STATUS_OPTIONS = [
  { value: 'planned', label: '📋 Хочу прочитать', color: 'info' as const },
  { value: 'in_progress', label: '📖 Читаю', color: 'warning' as const },
  { value: 'completed', label: '✅ Прочитал', color: 'success' as const },
  { value: 'dropped', label: '❌ Бросил', color: 'error' as const },
];

const FORMAT_OPTIONS = [
  { value: '', label: 'Не указан' },
  { value: 'hardcover', label: '📕 Твёрдый переплёт' },
  { value: 'paperback', label: '📖 Мягкий переплёт' },
  { value: 'ebook', label: '📱 Электронная' },
  { value: 'audiobook', label: '🎧 Аудиокнига' },
];

export function BooksTab() {
  const { tokens: c } = useTheme();
  const [books, setBooks] = useState<CollectionItem<'book'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challenge, setChallenge] = useState<{ goal: number; completed: number } | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formStatus, setFormStatus] = useState<BookStatus>('planned');
  const [formTotalPages, setFormTotalPages] = useState('');
  const [formCurrentPage, setFormCurrentPage] = useState('');
  const [formFormat, setFormFormat] = useState('');
  const [formIsbn, setIsbn] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formSeries, setFormSeries] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formGenre, setFormGenre] = useState('');

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const [booksData, challengeData] = await Promise.all([
        collectionsService.list<'book'>({
          type: 'book',
          limit: 200,
          search: search || undefined,
          status: (statusFilter as CollectionStatus) || undefined,
        }),
        collectionsService.getReadingChallenge(new Date().getFullYear()),
      ]);
      setBooks(booksData.data);
      setChallenge({ goal: challengeData.goal, completed: challengeData.completed });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const resetForm = () => {
    setFormTitle('');
    setFormAuthor('');
    setFormStatus('planned');
    setFormTotalPages('');
    setFormCurrentPage('');
    setFormFormat('');
    setIsbn('');
    setFormYear('');
    setFormSeries('');
    setFormNotes('');
    setFormGenre('');
  };

  const handleAdd = async () => {
    if (!formTitle.trim()) return;

    const metadata: BookMetadata = {
      author: formAuthor || undefined,
      totalPages: formTotalPages ? parseInt(formTotalPages, 10) : undefined,
      currentPage: formCurrentPage ? parseInt(formCurrentPage, 10) : undefined,
      format: (formFormat as BookMetadata['format']) || undefined,
      isbn: formIsbn || undefined,
      publishedYear: formYear ? parseInt(formYear, 10) : undefined,
      seriesName: formSeries || undefined,
      genre: formGenre ? [formGenre] : undefined,
    };

    await collectionsService.create({
      type: 'book',
      title: formTitle.trim(),
      status: formStatus,
      metadata,
      notes: formNotes || undefined,
      date_started: formStatus === 'in_progress' ? new Date().toISOString() : undefined,
    });

    resetForm();
    setShowAddModal(false);
    loadBooks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить книгу?')) return;
    await collectionsService.delete(id);
    loadBooks();
  };

  const handleStatusChange = async (id: string, status: CollectionStatus) => {
    const updates: any = { status };
    if (status === 'in_progress') updates.date_started = new Date().toISOString();
    if (status === 'completed') {
      updates.date_completed = new Date().toISOString();
      const book = books.find((b) => b.id === id);
      if (book?.metadata?.totalPages) {
        updates.metadata = { ...book.metadata, currentPage: book.metadata.totalPages };
      }
    }
    await collectionsService.update(id, updates);
    loadBooks();
  };

  const handleRatingChange = async (id: string, rating: number) => {
    await collectionsService.update(id, { rating: rating || null });
    loadBooks();
  };

  const updateProgress = async (id: string, currentPage: number) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    const metadata = { ...(book.metadata as BookMetadata), currentPage };
    await collectionsService.update(id, { metadata });
    loadBooks();
  };

  // Group by status
  const grouped: Record<string, CollectionItem<'book'>[]> = {};
  for (const book of books) {
    if (!grouped[book.status]) grouped[book.status] = [];
    grouped[book.status].push(book);
  }

  const statusLabels: Record<string, string> = {
    in_progress: '📖 Читаю',
    planned: '📋 Хочу прочитать',
    completed: '✅ Прочитал',
    dropped: '❌ Бросил',
  };

  const statusOrder = ['in_progress', 'planned', 'completed', 'dropped'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Controls */}
      <Card padding="lg">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input placeholder="🔍 Поиск по названию или автору..." value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
          </div>
          <Select
            options={[{ value: '', label: 'Все статусы' }, ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: 180 }}
            aria-label="Фильтр по статусу"
          />
          <Button variant="primary" size="sm" onPress={() => { resetForm(); setShowAddModal(true); }}>➕ Добавить</Button>
          <Button variant="secondary" size="sm" onPress={() => setShowChallengeModal(true)}>🏆 Челлендж</Button>
        </div>
      </Card>

      {/* Reading Challenge Progress */}
      {challenge && (
        <Card padding="lg" style={{ borderColor: c.primary }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <Text fontWeight="semibold">📚 Годовой челлендж {new Date().getFullYear()}</Text>
              <Text muted size="sm">Прочитано {challenge.completed} из {challenge.goal}</Text>
            </div>
            <div style={{ flex: 1, maxWidth: 300, minWidth: 150 }}>
              <div style={{ height: 12, borderRadius: 6, background: c.border, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((challenge.completed / challenge.goal) * 100, 100)}%`,
                  height: '100%',
                  background: challenge.completed >= challenge.goal ? c.success : c.primary,
                  borderRadius: 6,
                  transition: 'width 0.5s',
                }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Books by Status */}
      {loading ? (
        <Text muted style={{ textAlign: 'center', padding: 24 }}>Загрузка...</Text>
      ) : books.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📚</div>
            <Text muted size="lg">Нет книг</Text>
            <Text muted size="sm" style={{ marginTop: 4 }}>Добавьте первую книгу в коллекцию!</Text>
          </div>
        </Card>
      ) : (
        statusOrder.filter((s) => grouped[s]?.length > 0).map((status) => (
          <div key={status}>
            <Text fontWeight="semibold" size="md" style={{ marginBottom: 8, color: c.primary }}>
              {statusLabels[status]} ({grouped[status].length})
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grouped[status].map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={() => handleDelete(book.id)}
                  onStatusChange={(s) => handleStatusChange(book.id, s)}
                  onRatingChange={(r) => handleRatingChange(book.id, r)}
                  onProgressUpdate={(p) => updateProgress(book.id, p)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add Book Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="📚 Добавить книгу" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="Название *" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} fullWidth autoFocus />
          <Input placeholder="Автор" value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} fullWidth />
          <Select
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as BookStatus)}
            fullWidth
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input type="number" placeholder="Всего страниц" value={formTotalPages} onChange={(e) => setFormTotalPages(e.target.value)} fullWidth />
            </div>
            {formTotalPages && (
              <div style={{ flex: 1 }}>
                <Input type="number" placeholder="Текущая стр." value={formCurrentPage} onChange={(e) => setFormCurrentPage(e.target.value)} fullWidth />
              </div>
            )}
          </div>
          <Select options={FORMAT_OPTIONS} value={formFormat} onChange={(e) => setFormFormat(e.target.value)} fullWidth />
          <Input placeholder="Жанр" value={formGenre} onChange={(e) => setFormGenre(e.target.value)} fullWidth />
          <div style={{ display: 'flex', gap: 8 }}>
            <Input placeholder="ISBN" value={formIsbn} onChange={(e) => setIsbn(e.target.value)} fullWidth />
            <Input type="number" placeholder="Год издания" value={formYear} onChange={(e) => setFormYear(e.target.value)} fullWidth />
          </div>
          <Input placeholder="Серия" value={formSeries} onChange={(e) => setFormSeries(e.target.value)} fullWidth />
          <TextArea placeholder="Заметки" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} fullWidth />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" onPress={handleAdd} disabled={!formTitle.trim()}>Добавить</Button>
            <Button variant="ghost" onPress={() => { setShowAddModal(false); resetForm(); }}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Reading Challenge Modal */}
      <Modal isOpen={showChallengeModal} onClose={() => setShowChallengeModal(false)} title="🏆 Годовой челлендж" size="sm">
        <div style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
          <Text size="xl" fontWeight="bold">{challenge?.completed ?? 0} / {challenge?.goal ?? 12}</Text>
          <Text muted>книг прочитано в {new Date().getFullYear()}</Text>
          {challenge && challenge.completed >= challenge.goal && (
            <Badge variant="success" size="md" style={{ marginTop: 12 }}>🎉 Челлендж выполнен!</Badge>
          )}
          <div style={{ marginTop: 16 }}>
            <Button variant="ghost" onPress={() => setShowChallengeModal(false)}>Закрыть</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BookCard({
  book,
  onDelete,
  onStatusChange,
  onRatingChange,
  onProgressUpdate,
}: {
  book: CollectionItem<'book'>;
  onDelete: () => void;
  onStatusChange: (status: CollectionStatus) => void;
  onRatingChange: (rating: number) => void;
  onProgressUpdate: (page: number) => void;
}) {
  const { tokens: c } = useTheme();
  const meta = book.metadata as BookMetadata;
  const progress = meta.totalPages && meta.currentPage ? Math.round((meta.currentPage / meta.totalPages) * 100) : 0;

  return (
    <Card padding="md" hoverable>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Text fontWeight="semibold" size="lg">{book.title}</Text>
          {meta.author && <Text muted size="sm">{meta.author}</Text>}
          {meta.genre && <Badge variant="info" size="sm" style={{ marginTop: 4 }}>{meta.genre.join(', ')}</Badge>}
          {meta.format && <Badge variant="default" size="sm" style={{ marginTop: 4, marginLeft: 4 }}>{FORMAT_OPTIONS.find((f) => f.value === meta.format)?.label}</Badge>}

          {/* Reading Progress */}
          {book.status === 'in_progress' && meta.totalPages && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text muted size="xs">Прогресс: {progress}%</Text>
                <Text muted size="xs">{meta.currentPage} / {meta.totalPages} стр.</Text>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: c.border, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: c.primary, borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
              <Input
                type="number"
                value={meta.currentPage?.toString() ?? ''}
                onChange={(e) => onProgressUpdate(parseInt(e.target.value, 10) || 0)}
                placeholder="Текущая страница"
                style={{ marginTop: 4 }}
                fullWidth
              />
            </div>
          )}

          {meta.seriesName && <Text muted size="xs" style={{ marginTop: 4 }}>📖 Серия: {meta.seriesName}{meta.seriesNumber ? ` #${meta.seriesNumber}` : ''}</Text>}
          {book.notes && <Text muted size="xs" style={{ marginTop: 4, fontStyle: 'italic' }}>📝 {book.notes}</Text>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StarRating value={book.rating} onChange={onRatingChange} />
          <Select
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={book.status}
            onChange={(e) => onStatusChange(e.target.value as CollectionStatus)}
            style={{ minWidth: 160 }}
          />
          <Button variant="ghost" size="sm" onPress={onDelete} aria-label="Удалить книгу">🗑️</Button>
        </div>
      </div>
    </Card>
  );
}

function StarRating({ value, onChange }: { value: number | null; onChange: (rating: number) => void }) {
  const { tokens: c } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r === value ? 0 : r)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: (value ?? 0) >= r ? c.warning : c.mutedLight,
            padding: 0,
            lineHeight: 1,
          }}
          aria-label={`${r} звезд`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
