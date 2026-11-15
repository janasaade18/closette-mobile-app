import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { fetchClients, type ClientRow } from '@/features/admin/api';
import { authErrorMessage } from '@/features/auth/userProfile';
import { StatusBlock } from '@/features/brands/components/FormKit';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [people, setPeople] = useState<ClientRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPeople(await fetchClients());
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return people;
    return people.filter((person) =>
      [person.display_name ?? '', person.email ?? ''].join(' ').toLowerCase().includes(search),
    );
  }, [people, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Users</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add user"
            onPress={() => router.push('/admin/user/new')}
            style={styles.icon}>
            <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={Colors.light.primary} size={22} />
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or email"
          placeholderTextColor={Colors.light.textSecondary}
          autoCapitalize="none"
          style={styles.search}
        />
        {loading ? <StatusBlock title="Loading users" /> : null}
        {!loading && error ? (
          <StatusBlock title="Could not load users" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        {!loading && !error && visible.length === 0 ? <StatusBlock title="No clients yet" /> : null}
        {visible.map((person) => (
          <Pressable
            key={person.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/admin/user/[userId]', params: { userId: person.id } })}
            style={styles.card}>
            <Text style={styles.name}>{person.display_name || 'Closette member'}</Text>
            <Text style={styles.meta}>{person.email}</Text>
            <Text style={styles.meta}>
              {person.role} · {person.disabled_at ? 'Inactive' : 'Active'} · {person.created_at.slice(0, 10)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 120, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  search: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.backgroundElement,
    fontFamily: Typeface.body,
    color: Colors.light.primary,
  },
  card: { padding: 14, borderRadius: 22, backgroundColor: Colors.light.backgroundElement, gap: 2 },
  name: { fontFamily: Typeface.bodyStrong, fontSize: 16, color: Colors.light.primary },
  meta: { fontFamily: Typeface.body, fontSize: 13, color: Colors.light.textSecondary },
});
