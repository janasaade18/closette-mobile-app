import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';
import { Field, PrimaryButton, ProgressLabel, StatusBlock } from '@/features/brands/components/FormKit';
import {
  fetchBrand,
  fetchOwnedProducts,
  pickCatalogImage,
  updateBrandProfile,
} from '@/features/catalog/api';
import { formatPrice, type CatalogBrand, type CatalogProduct } from '@/features/catalog/types';

export default function BrandCatalogScreen() {
  const router = useRouter();
  const { brandId } = useAuth();
  const [brand, setBrand] = useState<CatalogBrand | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (!brandId) return;
    try {
      setError(null);
      const nextBrand = await fetchBrand(brandId);
      setBrand(nextBrand);
      setName(nextBrand?.name ?? '');
      setDescription(nextBrand?.description ?? '');
      setProducts(nextBrand ? await fetchOwnedProducts(brandId, nextBrand.name) : []);
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

  const saveBrand = async () => {
    if (!brand) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a brand name.');
      return;
    }
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const next = await updateBrandProfile({
        brandId: brand.id,
        name: trimmed,
        description: description.trim() || null,
        logoUri,
        onProgress: setProgress,
      });
      setBrand(next);
      setLogoUri(null);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

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
          <Text style={styles.title}>My catalog</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add product"
            onPress={() => router.push('/brand/product/new')}
            style={styles.icon}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={Colors.light.primary}
              size={22}
            />
          </Pressable>
        </View>

        {loading ? <StatusBlock title="Loading catalog" /> : null}
        {!loading && error && !brand ? (
          <StatusBlock title="Could not load catalog" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}

        {brand ? (
          <View style={styles.editor}>
            <Pressable accessibilityRole="button" onPress={() => void pickCatalogImage().then((uri) => uri && setLogoUri(uri))}>
              {logoUri || brand.logoUrl ? (
                <Image source={{ uri: logoUri || brand.logoUrl || undefined }} style={styles.logo} />
              ) : (
                <View style={styles.logoFallback}>
                  <Text style={styles.logoLetter}>{brand.name.slice(0, 1)}</Text>
                </View>
              )}
            </Pressable>
            <Field label="Brand name" value={name} onChangeText={setName} />
            <Field label="Description" value={description} onChangeText={setDescription} multiline />
            {busy ? <ProgressLabel value={progress} /> : null}
            <PrimaryButton label="Save brand" onPress={() => void saveBrand()} busy={busy} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : null}

        {!loading && brand && products.length === 0 ? (
          <StatusBlock title="No products yet" body="Add a product with a photo to start this catalog." />
        ) : null}

        {products.map((product) => (
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
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 40, gap: 12 },
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
  editor: { gap: 12 },
  logo: { width: 88, height: 88, borderRadius: 22 },
  logoFallback: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.softBlue,
  },
  logoLetter: { fontFamily: Typeface.display, fontSize: 28, color: Colors.light.primary },
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
  error: { color: Colors.light.rust, fontFamily: Typeface.body, fontSize: 14 },
});
