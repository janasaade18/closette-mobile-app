import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { authErrorMessage } from '@/features/auth/userProfile';
import { StatusBlock } from '@/features/brands/components/FormKit';
import { fetchAllBrands } from '@/features/catalog/api';
import type { CatalogBrand } from '@/features/catalog/types';

type Filter = 'all' | 'active' | 'inactive';

export default function AdminBrandsScreen() {
  const router = useRouter();
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextBrands, products] = await Promise.all([
        fetchAllBrands(),
        supabase.from('brand_products').select('brand_id'),
      ]);
      if (products.error) throw products.error;
      const nextCounts: Record<string, number> = {};
      for (const row of products.data ?? []) {
        nextCounts[row.brand_id] = (nextCounts[row.brand_id] ?? 0) + 1;
      }
      setBrands(nextBrands);
      setCounts(nextCounts);
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
    return brands.filter((brand) => {
      if (filter === 'active' && !brand.isActive) return false;
      if (filter === 'inactive' && brand.isActive) return false;
      if (!search) return true;
      return brand.name.toLowerCase().includes(search);
    });
  }, [brands, filter, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Brands</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add brand"
            onPress={() => router.push('/admin/brand/new')}
            style={styles.icon}>
            <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={Colors.light.primary} size={22} />
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search brands"
          placeholderTextColor={Colors.light.textSecondary}
          style={styles.search}
        />
        <View style={styles.filters}>
          {(['all', 'active', 'inactive'] as const).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipOn]}>
              <Text style={[styles.chipText, filter === item && styles.chipTextOn]}>
                {item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        {loading ? <StatusBlock title="Loading brands" /> : null}
        {!loading && error ? (
          <StatusBlock title="Could not load brands" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        {!loading && !error && visible.length === 0 ? (
          <StatusBlock title="No brands yet" body="Add a brand and a login so they can upload a catalog." />
        ) : null}
        {visible.map((brand) => (
          <Pressable
            key={brand.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/admin/brand/[brandId]', params: { brandId: brand.id } })}
            style={styles.card}>
            {brand.logoUrl ? (
              <Image source={{ uri: brand.logoUrl }} style={styles.mark} />
            ) : (
              <View style={styles.mark}>
                <Text style={styles.markText}>{brand.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.copy}>
              <Text style={styles.name}>{brand.name}</Text>
              <Text style={styles.meta}>
                {brand.isActive ? 'Active' : 'Inactive'} · {counts[brand.id] ?? 0} products
              </Text>
            </View>
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
  filters: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  chipOn: { backgroundColor: Colors.light.primary },
  chipText: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 13 },
  chipTextOn: { color: Colors.light.onPrimary },
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
