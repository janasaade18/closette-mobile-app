import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { authErrorMessage } from '@/features/auth/userProfile';
import { fetchAllBrands } from '@/features/catalog/api';
import type { CatalogBrand } from '@/features/catalog/types';
import { StatusBlock } from '@/features/brands/components/FormKit';

export default function AdminBrandsScreen() {
  const router = useRouter();
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setBrands(await fetchAllBrands());
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.icon}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={Colors.light.primary}
              size={22}
            />
          </Pressable>
          <Text style={styles.title}>Brands</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add brand"
            onPress={() => router.push('/admin/new')}
            style={styles.icon}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={Colors.light.primary}
              size={22}
            />
          </Pressable>
        </View>

        {loading ? <StatusBlock title="Loading brands" /> : null}
        {!loading && error ? (
          <StatusBlock title="Could not load brands" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        {!loading && !error && brands.length === 0 ? (
          <StatusBlock title="No brands yet" body="Add a brand and a login so they can upload a catalog." />
        ) : null}

        {brands.map((brand) => (
          <Pressable
            key={brand.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/admin/[brandId]', params: { brandId: brand.id } })}
            style={styles.card}>
            <View style={styles.mark}>
              <Text style={styles.markText}>{brand.name.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.name}>{brand.name}</Text>
              <Text style={styles.meta}>{brand.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 40, gap: 12 },
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
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundElement,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.softBlue,
  },
  markText: { fontFamily: Typeface.display, fontSize: 20, color: Colors.light.primary },
  copy: { flex: 1 },
  name: { fontFamily: Typeface.bodyStrong, fontSize: 16, color: Colors.light.primary },
  meta: { fontFamily: Typeface.body, fontSize: 13, color: Colors.light.textSecondary },
});
