import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { authErrorMessage } from '@/features/auth/userProfile';
import { resetBrandPassword, setBrandActive } from '@/features/brands/adminApi';
import { Field, PasswordField, PrimaryButton, StatusBlock } from '@/features/brands/components/FormKit';
import {
  deleteProduct,
  fetchBrand,
  fetchOwnedProducts,
  pickCatalogImage,
  updateBrandProfile,
} from '@/features/catalog/api';
import { formatPrice, type CatalogBrand, type CatalogProduct } from '@/features/catalog/types';

export default function BrandAdminDetailScreen() {
  const router = useRouter();
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const [brand, setBrand] = useState<CatalogBrand | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!brandId) return;
    try {
      setError(null);
      const next = await fetchBrand(brandId);
      setBrand(next);
      setName(next?.name ?? '');
      setDescription(next?.description ?? '');
      setProducts(next ? await fetchOwnedProducts(next.id, next.name) : []);
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

  const save = async () => {
    if (!brand) return;
    if (!name.trim()) {
      setError('Enter a brand name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await updateBrandProfile({
        brandId: brand.id,
        name: name.trim(),
        description: description.trim() || null,
        logoUri,
      });
      setBrand(next);
      setLogoUri(null);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = () => {
    if (!brand) return;
    const next = !brand.isActive;
    Alert.alert(
      next ? 'Activate brand?' : 'Deactivate brand?',
      next
        ? 'This brand and its visible products return to the shop.'
        : 'The brand stays in the database, but its products leave the shop and the owner is blocked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Activate' : 'Deactivate',
          style: next ? 'default' : 'destructive',
          onPress: () => {
            setBusy(true);
            void setBrandActive(brand.id, next)
              .then(() => load())
              .catch((err) => setError(authErrorMessage(err)))
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  };

  const resetPassword = async () => {
    if (!brand) return;
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await resetBrandPassword(brand.id, password);
      setPassword('');
      Alert.alert(
        'Password updated',
        `${result.ownerEmail ?? 'Brand login'} can sign in with the password you typed. They will be asked to choose a new one.`,
      );
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = (product: CatalogProduct) => {
    Alert.alert('Remove product?', `${product.name} will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void deleteProduct(product)
            .then(() => load())
            .catch((err) => setError(authErrorMessage(err)));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={Colors.light.primary}
            size={20}
          />
          <Text style={styles.backText}>Brands</Text>
        </Pressable>
        {loading ? <StatusBlock title="Loading brand" /> : null}
        {!loading && error && !brand ? (
          <StatusBlock title="Could not load brand" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        {brand ? (
          <View style={styles.body}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void pickCatalogImage().then((uri) => uri && setLogoUri(uri))}>
              {logoUri || brand.logoUrl ? (
                <Image source={{ uri: logoUri || brand.logoUrl || undefined }} style={styles.logo} />
              ) : (
                <View style={styles.logo}>
                  <Text style={styles.logoLetter}>{brand.name.slice(0, 1)}</Text>
                </View>
              )}
            </Pressable>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field label="Description" value={description} onChangeText={setDescription} multiline />
            <PrimaryButton label="Save brand" onPress={() => void save()} busy={busy} />
            <PrimaryButton
              label={brand.isActive ? 'Deactivate brand' : 'Activate brand'}
              onPress={toggleActive}
              busy={busy}
            />
            <PasswordField label="New temporary password" value={password} onChangeText={setPassword} />
            <PrimaryButton label="Reset password" onPress={() => void resetPassword()} busy={busy} />
            <Text style={styles.section}>Products</Text>
            {products.length === 0 ? <StatusBlock title="No products yet" /> : null}
            {products.map((product) => (
              <View key={product.id} style={styles.product}>
                <View style={styles.productCopy}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.meta}>
                    {product.isActive ? 'Visible' : 'Hidden'}
                    {product.price != null ? ` · ${formatPrice(product.price)}` : ''}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => removeProduct(product)}>
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            ))}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 40 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontFamily: Typeface.body, fontSize: 16, color: Colors.light.primary },
  body: { gap: 12 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.softBlue,
  },
  logoLetter: { fontFamily: Typeface.display, fontSize: 28, color: Colors.light.primary },
  section: { fontFamily: Typeface.display, fontSize: 22, color: Colors.light.primary, marginTop: 8 },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
  },
  productCopy: { flex: 1 },
  productName: { fontFamily: Typeface.bodyStrong, fontSize: 16, color: Colors.light.primary },
  meta: { fontFamily: Typeface.body, fontSize: 13, color: Colors.light.textSecondary },
  remove: { fontFamily: Typeface.bodyStrong, color: Colors.light.rust, fontSize: 14 },
  error: { color: Colors.light.rust, fontFamily: Typeface.body, fontSize: 14 },
});
