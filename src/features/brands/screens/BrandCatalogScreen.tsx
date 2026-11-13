import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';
import { StatusBlock } from '@/features/brands/components/FormKit';
import { fetchBrand, fetchOwnedProducts } from '@/features/catalog/api';
import { formatPrice, type CatalogProduct } from '@/features/catalog/types';

type Filter = 'all' | 'active' | 'hidden';

export default function BrandCatalogScreen() {
  const router = useRouter();
  const { brandId } = useAuth();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!brandId) return;
    try {
      setError(null);
      const brand = await fetchBrand(brandId);
      setProducts(brand ? await fetchOwnedProducts(brandId, brand.name) : []);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((product) => {
      if (filter === 'active' && !product.isActive) return false;
      if (filter === 'hidden' && product.isActive) return false;
      if (!search) return true;
      return [product.name, product.category ?? ''].join(' ').toLowerCase().includes(search);
    });
  }, [filter, products, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My catalog</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add product"
            onPress={() => router.push('/brand/product/new')}
            style={styles.icon}>
            <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={Colors.light.primary} size={22} />
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search products"
          placeholderTextColor={Colors.light.textSecondary}
          style={styles.search}
        />
        <View style={styles.filters}>
          {(['all', 'active', 'hidden'] as const).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, filter === item && styles.chipOn]}>
              <Text style={[styles.chipText, filter === item && styles.chipTextOn]}>
                {item[0].toUpperCase() + item.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        {loading ? <StatusBlock title="Loading catalog" /> : null}
        {!loading && error ? (
          <StatusBlock title="Could not load catalog" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        {!loading && !error && visible.length === 0 ? (
          <StatusBlock title="No products yet" body="Add a product with a photo to start this catalog." />
        ) : null}
        {visible.map((product) => (
          <Pressable
            key={product.id}
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/brand/product/[productId]', params: { productId: product.id } })
            }
            style={styles.card}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photo} />
            )}
            <View style={styles.copy}>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.meta}>
                {product.isActive ? 'Visible' : 'Hidden'}
                {product.price != null ? ` · ${formatPrice(product.price)}` : ''}
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
  title: { fontFamily: Typeface.display, fontSize: 28, color: Colors.light.primary },
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
    padding: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundElement,
  },
  photo: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.light.softBlue },
  copy: { flex: 1 },
  name: { fontFamily: Typeface.bodyStrong, fontSize: 16, color: Colors.light.primary },
  meta: { fontFamily: Typeface.body, fontSize: 13, color: Colors.light.textSecondary },
});
