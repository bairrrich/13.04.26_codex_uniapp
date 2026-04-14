import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '../src/theme';

const modules = [
  { name: 'Дневник', icon: '📔', href: '/diary' },
  { name: 'Финансы', icon: '💰', href: '/finance' },
  { name: 'Питание', icon: '🍽️', href: '/nutrition' },
  { name: 'Фитнес', icon: '🏋️', href: '/fitness' },
  { name: 'Коллекции', icon: '📚', href: '/collections' },
  { name: 'Лента', icon: '📰', href: '/feed' },
];

export default function HomeScreen() {
  const { colors, theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>SuperApp</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>Life Management OS</Text>

      <View style={styles.grid}>
        {modules.map((mod) => (
          <Link key={mod.name} href={mod.href as any} asChild>
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.icon}>{mod.icon}</Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{mod.name}</Text>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
