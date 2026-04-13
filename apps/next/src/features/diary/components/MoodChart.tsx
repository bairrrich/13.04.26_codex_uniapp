'use client';

import { Card, Text, Badge } from '@superapp/ui';

interface MoodChartProps {
  data: { date: string; mood: number }[];
}

const moodEmojis = ['😢', '😟', '😐', '🙂', '😊'];
const moodColors = ['#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e'];

export function MoodChart({ data }: MoodChartProps) {
  if (data.length === 0) {
    return (
      <Card padding="lg" variant="outlined">
        <Text muted>Нет данных о настроении</Text>
      </Card>
    );
  }

  const last7 = data.slice(-7);
  const avgMood = data.reduce((sum, d) => sum + d.mood, 0) / data.length;

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text fontWeight="semibold" size="lg">📊 Настроение</Text>
        <Badge variant="primary" size="md">
          Среднее: {avgMood.toFixed(1)}/5
        </Badge>
      </div>

      {/* Bar Chart */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120, marginBottom: 12 }}>
        {last7.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12 }}>{moodEmojis[d.mood - 1]}</span>
            <div
              style={{
                width: '100%',
                maxWidth: 32,
                height: `${d.mood * 20}%`,
                minHeight: 8,
                background: moodColors[d.mood - 1],
                borderRadius: 6,
                transition: 'height 0.3s',
              }}
            />
            <span style={{ fontSize: 10, color: '#64748B' }}>{d.date}</span>
          </div>
        ))}
      </div>

      {/* Trend */}
      {data.length >= 2 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingTop: 12, borderTop: '1px solid #1e293b' }}>
          <Text muted size="sm">Тренд:</Text>
          {data[data.length - 1].mood > data[data.length - 2].mood ? (
            <Badge variant="success" dot>Растёт 📈</Badge>
          ) : data[data.length - 1].mood < data[data.length - 2].mood ? (
            <Badge variant="error" dot>Падает 📉</Badge>
          ) : (
            <Badge variant="default" dot>Стабильно ➡️</Badge>
          )}
        </div>
      )}
    </Card>
  );
}
