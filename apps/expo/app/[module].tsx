import { View, Text, StyleSheet } from 'react-native';

const screens = [
  { name: 'diary', title: '📔 Дневник' },
  { name: 'finance', title: '💰 Финансы' },
  { name: 'nutrition', title: '🍽️ Питание' },
  { name: 'fitness', title: '🏋️ Фитнес' },
  { name: 'collections', title: '📚 Коллекции' },
  { name: 'feed', title: '📰 Лента' },
];

const ModulePlaceholder = ({ title }: { title: string }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.text}>В разработке...</Text>
  </View>
);

export const diary = () => <ModulePlaceholder title="📔 Дневник" />;
export const finance = () => <ModulePlaceholder title="💰 Финансы" />;
export const nutrition = () => <ModulePlaceholder title="🍽️ Питание" />;
export const fitness = () => <ModulePlaceholder title="🏋️ Фитнес" />;
export const collections = () => <ModulePlaceholder title="📚 Коллекции" />;
export const feed = () => <ModulePlaceholder title="📰 Лента" />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#F4F7FF', marginBottom: 12 },
  text: { fontSize: 16, color: '#888' },
});
