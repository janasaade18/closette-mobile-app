import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';
import { Field, PrimaryButton, ProgressLabel } from '@/features/brands/components/FormKit';
import {
  createProduct,
  deleteProduct,
  fetchBrand,
  fetchOwnedProducts,
  pickCatalogImage,
  updateProduct,
} from '@/features/catalog/api';
import { PRODUCT_CATEGORIES, type CatalogProduct } from '@/features/catalog/types';

export default function ProductFormScreen() {
  const router = useRouter();
  const { brandId } = useAuth();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const editing = Boolean(productId);
  const [brandName, setBrandName] = useState('');
  const [existing, setExisting] = useState<CatalogProduct | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!brandId) return;
    let active = true;
    void (async () => {
      try {
        const brand = await fetchBrand(brandId);
        if (!active) return;
        setBrandName(brand?.name ?? '');
        if (!productId || !brand) return;
        const products = await fetchOwnedProducts(brandId, brand.name);
        const product = products.find((item) => item.id === productId) ?? null;
        if (!active) return;
        setExisting(product);
        if (product) {
          setName(product.name);
          setDescription(product.description ?? '');
          setPrice(product.price == null ? '' : String(product.price));
          setCategory(product.category);
        }
      } catch (err) {
        if (active) setError(authErrorMessage(err));
      }
    })();
    return () => {
      active = false;
    };
  }, [brandId, productId]);

  const parsedPrice = () => {
    const trimmed = price.trim();
    if (!trimmed) return null;
    const amount = Number(trimmed);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Enter a price of zero or more, or leave it blank.');
    }
    return amount;
  };

  const save = async () => {
    if (!brandId) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a product name.');
      return;
    }
    if (!editing && !imageUri) {
      setError('Add a product photo.');
      return;
    }
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      const amount = parsedPrice();
      if (editing && existing) {
        await updateProduct({
          product: existing,
          name: trimmedName,
          description: description.trim() || null,
          price: amount,
          category,
          isActive: existing.isActive,
          imageUri,
          onProgress: setProgress,
        });
      } else if (imageUri) {
        await createProduct({
          brandId,
          brandName,
          name: trimmedName,
          description: description.trim() || null,
          price: amount,
          category,
          imageUri,
          onProgress: setProgress,
        });
      }
      router.back();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const hide = async () => {
    if (!existing) return;
    setBusy(true);
    try {
      await updateProduct({
        product: existing,
        name: existing.name,
        description: existing.description,
        price: existing.price,
        category: existing.category,
        isActive: !existing.isActive,
      });
      router.back();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  };

  const remove = () => {
    if (!existing) return;
    Alert.alert('Delete product?', 'This removes the product and its photo.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          void deleteProduct(existing)
            .then(() => router.back())
            .catch((err) => {
              setError(authErrorMessage(err));
              setBusy(false);
            });
        },
      },
    ]);
  };

  const preview = imageUri || existing?.imageUrl;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={Colors.light.primary}
            size={20}
          />
          <Text style={styles.backText}>My catalog</Text>
        </Pressable>
        <Text style={styles.title}>{editing ? 'Edit product' : 'Add product'}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            void pickCatalogImage()
              .then((uri) => {
                if (uri) setImageUri(uri);
              })
              .catch((err) => setError(authErrorMessage(err)))
          }
          style={styles.photoButton}>
          {preview ? <Image source={{ uri: preview }} style={styles.photo} /> : <Text style={styles.photoText}>Add photo</Text>}
        </Pressable>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        <Field label="Price" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <View style={styles.categories}>
          {PRODUCT_CATEGORIES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(category === item ? null : item)}
              style={[styles.chip, category === item && styles.chipOn]}>
              <Text style={[styles.chipText, category === item && styles.chipTextOn]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {busy ? <ProgressLabel value={progress} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={editing ? 'Save product' : 'Add product'} onPress={() => void save()} busy={busy} />
        {existing ? (
          <View style={styles.row}>
            <Pressable onPress={() => void hide()} style={styles.secondary}>
              <Text style={styles.secondaryText}>{existing.isActive ? 'Hide' : 'Show'}</Text>
            </Pressable>
            <Pressable onPress={remove} style={styles.secondary}>
              <Text style={styles.danger}>Delete</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 48, gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  photoButton: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  photo: { width: '100%', height: '100%' },
  photoText: { fontFamily: Typeface.bodyStrong, color: Colors.light.primary },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.outlineBlue,
    backgroundColor: Colors.light.backgroundElement,
  },
  chipOn: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 13 },
  chipTextOn: { color: Colors.light.onPrimary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  secondary: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  secondaryText: { fontFamily: Typeface.bodyStrong, color: Colors.light.primary },
  danger: { fontFamily: Typeface.bodyStrong, color: Colors.light.rust },
});
