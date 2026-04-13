import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

const modules = [
  { name: 'Дневник', icon: '📔', href: '/diary' },
  { name: 'Финансы', icon: '💰', href: '/finance' },
  { name: 'Питание', icon: '🍽️', href: '/nutrition' },
  { name: 'Фитнес', icon: '🏋️', href: '/fitness' },
  { name: 'Коллекции', icon: '📚', href: '/collections' },
  { name: 'Лента', icon: '📰', href: '/feed' },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SuperApp</Text>
      <Text style={styles.subtitle}>Life Management OS</Text>

      <View style={styles.grid}>
        {modules.map((mod) => (
          <Link key={mod.name} href={mod.href as any} asChild>
            <TouchableOpacity style={styles.card}>
              <Text style={styles.icon}>{mod.icon}</Text>
              <Text style={styles.cardTitle}>{mod.name}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5B6CFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  card: {
    width: 140,
    padding: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F4F7FF',
  },
});
