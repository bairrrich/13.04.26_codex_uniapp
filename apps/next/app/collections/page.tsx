'use client';

import { useState, useEffect, useCallback } from 'react';
import { CollectionForm } from '../../src/features/collections/components/CollectionForm';
import { CollectionList } from '../../src/features/collections/components/CollectionList';
import { collectionsService, type CollectionItem } from '../../src/features/collections/services/collectionsService';

export default function CollectionsPage() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await collectionsService.list();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1>📚 Коллекции</h1>
      <CollectionForm onSuccess={fetchData} />
      <CollectionList items={items} loading={loading} onRefresh={fetchData} />
    </main>
  );
}
