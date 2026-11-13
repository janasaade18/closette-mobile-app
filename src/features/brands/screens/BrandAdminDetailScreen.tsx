import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { authErrorMessage } from '@/features/auth/userProfile';
import { resetBrandPassword, setBrandActive } from '@/features/brands/adminApi';
import { Field, PrimaryButton, StatusBlock } from '@/features/brands/components/FormKit';
import { fetchBrand } from '@/features/catalog/api';
import type { CatalogBrand } from '@/features/catalog/types';

export default function BrandAdminDetailScreen() {
  const router = useRouter();
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const [brand, setBrand] = useState<CatalogBrand | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!brandId) return;
    try {
      setError(null);
      setBrand(await fetchBrand(brandId));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async () => {
    if (!brand) return;
    setBusy(true);
    setError(null);
    try {
      await setBrandActive(brand.id, !brand.isActive);
      await load();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
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
        `${result.ownerEmail ?? 'Brand login'}\nTemporary password: ${result.temporaryPassword}`,
      );
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
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
        {!loading && !brand && !error ? <StatusBlock title="Brand not found" /> : null}
        {brand ? (
          <View style={styles.body}>
            <Text style={styles.title}>{brand.name}</Text>
            <Text style={styles.meta}>{brand.isActive ? 'Active' : 'Inactive'}</Text>
            {brand.description ? <Text style={styles.description}>{brand.description}</Text> : null}
            <PrimaryButton
              label={brand.isActive ? 'Deactivate brand' : 'Activate brand'}
              onPress={() => void toggleActive()}
              busy={busy}
            />
            <Field
              label="New temporary password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <PrimaryButton label="Reset password" onPress={() => void resetPassword()} busy={busy} />
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
  backText: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 },
  body: { gap: 14 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  meta: { fontFamily: Typeface.body, color: Colors.light.textSecondary, fontSize: 14 },
  description: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15, lineHeight: 22 },
  error: { color: Colors.light.rust, fontFamily: Typeface.body, fontSize: 14 },
});
