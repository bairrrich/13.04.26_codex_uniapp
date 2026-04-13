'use client';

import { useState } from 'react';
import { Card, Text, Badge, Button, Divider, tokens } from '@superapp/ui';
import { feedService, type FeedPost, type ActivityEvent } from '../services/feedService';

interface FeedListProps {
  posts: FeedPost[];
  events: ActivityEvent[];
  loading: boolean;
  onRefresh: () => void;
}

const typeLabels: Record<string, string> = {
  'diary.created': 'Запись в дневнике',
  'transaction.created': 'Транзакция',
  'meal.logged': 'Приём пищи',
  'workout.completed': 'Тренировка',
  'collection.added': 'Новое в коллекции',
  'feed.created': 'Пост в ленте',
};

const typeBadgeVariant: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
  'diary.created': 'info',
  'transaction.created': 'warning',
  'meal.logged': 'success',
  'workout.completed': 'primary',
  'collection.added': 'default',
  'feed.created': 'default',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PostCard({
  post,
  onDelete,
  onRefresh,
}: {
  post: FeedPost;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<Awaited<ReturnType<typeof feedService.listComments>>['data']>([]);
  const [newComment, setNewComment] = useState('');
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const toggleLike = async () => {
    setLikeLoading(true);
    try {
      if (liked) {
        await feedService.unlikePost(post.id);
        setLiked(false);
        setLikes((c) => Math.max(0, c - 1));
      } else {
        await feedService.likePost(post.id);
        setLiked(true);
        setLikes((c) => c + 1);
      }
    } catch {
      // silently ignore
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setCommentsOpen((v) => !v);
      return;
    }
    try {
      const result = await feedService.listComments(post.id);
      setComments(result.data);
      setCommentsOpen(true);
    } catch {
      // silently ignore
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      const created = await feedService.createComment({ postId: post.id, content: newComment.trim() });
      setComments((prev) => [...prev, created]);
      setNewComment('');
    } catch {
      // silently ignore
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(post.id);
    } finally {
      setDeleteConfirm(false);
    }
  };

  const visibilityLabel = post.visibility === 'private' ? 'Только я' : 'Все';
  const visibilityVariant = post.visibility === 'private' ? 'default' : 'primary';

  return (
    <Card padding="lg">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.md }}>
        <div style={{ display: 'flex', gap: tokens.space.sm, alignItems: 'center' }}>
          <Badge variant="default" size="sm">
            Пост
          </Badge>
          <Badge variant={visibilityVariant} size="xs">
            {visibilityLabel}
          </Badge>
        </div>
        <Text muted size="xs">{formatDate(post.created_at)}</Text>
      </div>

      {/* Content */}
      <Text style={{ lineHeight: 1.6, marginBottom: tokens.space.md, whiteSpace: 'pre-wrap' }}>
        {post.content}
      </Text>

      <Divider style={{ margin: `${tokens.space.sm} 0` }} />

      {/* Actions */}
      <div style={{ display: 'flex', gap: tokens.space.md, alignItems: 'center' }}>
        <Button
          variant={liked ? 'primary' : 'ghost'}
          size="sm"
          onPress={toggleLike}
          disabled={likeLoading}
          style={{ minWidth: 80 }}
        >
          {liked ? '❤️' : '🤍'} {likes}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onPress={loadComments}
          style={{ minWidth: 80 }}
        >
          💬 {comments.length > 0 ? comments.length : 'Коммент'}
        </Button>

        <div style={{ flex: 1 }} />

        {!deleteConfirm ? (
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setDeleteConfirm(true)}
            style={{ color: tokens.colors.error }}
          >
            Удалить
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: tokens.space.sm }}>
            <Button variant="danger" size="sm" onPress={handleDelete}>
              Да
            </Button>
            <Button variant="secondary" size="sm" onPress={() => setDeleteConfirm(false)}>
              Нет
            </Button>
          </div>
        )}
      </div>

      {/* Comments Section */}
      {commentsOpen && (
        <>
          <Divider style={{ margin: `${tokens.space.md} 0` }} />
          <div>
            {comments.length === 0 ? (
              <Text muted size="sm" style={{ marginBottom: tokens.space.md }}>
                Нет комментариев. Будьте первым!
              </Text>
            ) : (
              <div style={{ marginBottom: tokens.space.md, display: 'flex', flexDirection: 'column', gap: tokens.space.sm }}>
                {comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: `${tokens.space.sm} ${tokens.space.md}`,
                      background: tokens.colors.surfaceHover,
                      borderRadius: tokens.radius.md,
                    }}
                  >
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{c.content}</Text>
                    <Text muted size="xs" style={{ marginTop: tokens.space.xs }}>
                      {formatDate(c.created_at)}
                    </Text>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: tokens.space.sm }}>
              <input
                type="text"
                placeholder="Написать комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addComment();
                }}
                style={{
                  flex: 1,
                  padding: `${tokens.space.sm} ${tokens.space.md}`,
                  background: tokens.colors.surface,
                  border: `1px solid ${tokens.colors.border}`,
                  borderRadius: tokens.radius.md,
                  color: tokens.colors.text,
                  fontSize: tokens.fontSizes.sm,
                  outline: 'none',
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onPress={addComment}
                loading={commentLoading}
                disabled={!newComment.trim()}
              >
                →
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function EventCard({ event }: { event: ActivityEvent }) {
  const variant = typeBadgeVariant[event.type] ?? 'default';
  const label = typeLabels[event.type] ?? event.type;

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.space.md }}>
        <Badge variant={variant} size="sm" dot>
          {label}
        </Badge>
        <Text muted size="xs">{formatDate(event.created_at)}</Text>
      </div>
      <Text muted size="sm" style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(event.payload, null, 2)}
      </Text>
    </Card>
  );
}

export function FeedList({ posts, events, loading, onRefresh }: FeedListProps) {
  const handleDelete = async (id: string) => {
    try {
      await feedService.delete(id);
      onRefresh();
    } catch {
      // silently ignore, user will see no change
    }
  };

  if (loading) {
    return (
      <Text muted style={{ padding: tokens.space['2xl'], textAlign: 'center' }}>
        Загрузка...
      </Text>
    );
  }

  const allItems = [
    ...posts.map((p) => ({ ...p, kind: 'post' as const })),
    ...events.map((e) => ({ ...e, kind: 'event' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (allItems.length === 0) {
    return (
      <Card variant="outlined" padding="2xl">
        <div style={{ textAlign: 'center' }}>
          <Text muted size="lg">Лента пуста</Text>
          <Text muted size="sm" style={{ marginTop: tokens.space.sm }}>
            Создайте первый пост или выполните действие
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>
      {allItems.map((item) => (
        item.kind === 'post'
          ? <PostCard key={item.id} post={item} onDelete={handleDelete} onRefresh={onRefresh} />
          : <EventCard key={item.id} event={item} />
      ))}
    </div>
  );
}
