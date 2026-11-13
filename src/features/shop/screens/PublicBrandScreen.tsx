import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { StatusBlock } from '@/features/brands/components/FormKit';
import { fetchActiveBrandProducts, fetchBrand } from '@/features/catalog/api';
import { formatPrice, type CatalogBrand, type CatalogProduct } from '@/features/catalog/types';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';

function BrandLink({ url }: { url: string }) {
  return (
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(url)}>
      <Text style={styles.link}>{url}</Text>
    </Pressable>
  );
}

export default function PublicBrandScreen() {
  const router = useRouter();
  const { brandId: ownedBrandId } = useAuth();
  const params = useLocalSearchParams<{ brandId: string }>();
  const brandId = params.brandId || ownedBrandId;
  const [brand, setBrand] = useState<CatalogBrand | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!brandId) return;
    try {
      setError(null);
      const nextBrand = await fetchBrand(brandId);
      const visible = nextBrand && (nextBrand.isActive || nextBrand.id === ownedBrandId) ? nextBrand : null;
      setBrand(visible);
      setProducts(visible ? await fetchActiveBrandProducts(visible.id) : []);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [brandId, ownedBrandId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={Colors.light.primary}
            size={20}
          />
          <Text style={styles.backText}>Shop</Text>
        </Pressable>

        {loading ? <StatusBlock title="Loading products" /> : null}
        {!loading && error ? (
          <StatusBlock title="Could not load products" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        {!loading && !error && !brand ? <StatusBlock title="No products yet" /> : null}

        {brand ? (
          <View style={styles.heading}>
            {brand.coverUrl ? <Image source={{ uri: brand.coverUrl }} style={styles.cover} contentFit="cover" /> : null}
            {brand.logoUrl ? (
              <Image source={{ uri: brand.logoUrl }} style={styles.logo} contentFit="cover" />
            ) : null}
            <Text style={styles.title}>{brand.name}</Text>
            {brand.category ? <Text style={styles.meta}>{brand.category}</Text> : null}
            {brand.description ? <Text style={styles.description}>{brand.description}</Text> : null}
            {[brand.city, brand.country].filter(Boolean).length ? (
              <Text style={styles.meta}>{[brand.city, brand.country].filter(Boolean).join(', ')}</Text>
            ) : null}
            {brand.website ? <BrandLink url={brand.website} /> : null}
            {brand.instagram ? <BrandLink url={brand.instagram} /> : null}
            {brand.contactEmail ? <Text style={styles.meta}>{brand.contactEmail}</Text> : null}
            {brand.phone ? <Text style={styles.meta}>{brand.phone}</Text> : null}
          </View>
        ) : null}

        {!loading && brand && products.length === 0 ? <StatusBlock title="No products yet" /> : null}

        <View style={styles.grid}>
          {products.map((product) => (
            <View key={product.id} style={styles.card}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.photo} contentFit="cover" />
              ) : (
                <View style={styles.photo} />
              )}
              <Text numberOfLines={2} style={styles.name}>
                {product.name}
              </Text>
              {product.price != null ? <Text style={styles.price}>{formatPrice(product.price)}</Text> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 },
  heading: { gap: 8, marginBottom: 18 },
  cover: { width: '100%', height: 140, borderRadius: 22, marginBottom: 8 },
  logo: { width: 72, height: 72, borderRadius: 36 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  description: { fontFamily: Typeface.body, fontSize: 15, lineHeight: 22, color: Colors.light.textSecondary },
  meta: { fontFamily: Typeface.body, fontSize: 14, color: Colors.light.textSecondary },
  link: { fontFamily: Typeface.bodyStrong, fontSize: 14, color: Colors.light.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', gap: 6 },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 22,
    backgroundColor: Colors.light.softBlue,
  },
  name: { fontFamily: Typeface.bodyStrong, fontSize: 15, color: Colors.light.primary },
  price: { fontFamily: Typeface.body, fontSize: 14, color: Colors.light.primary },
});
