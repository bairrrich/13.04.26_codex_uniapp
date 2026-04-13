'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heading, Card, Text } from '@superapp/ui';
import { CollectionForm } from '../../src/features/collections/components/CollectionForm';
import { CollectionList } from '../../src/features/collections/components/CollectionList';
import { collectionsService, type CollectionItem } from '../../src/features/collections/services/collectionsService';

export default function CollectionsPage() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await collectionsService.list();
      setItems(data);
    } catch (e) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Heading level={1}>📚 Коллекции</Heading>
      <CollectionForm onSuccess={fetchData} />
      {error && (
        <Card padding="md" style={{ marginBottom: 16 }}>
          <Text error>{error}</Text>
        </Card>
      )}
      <CollectionList items={items} loading={loading} onRefresh={fetchData} />
    </main>
  );
}
