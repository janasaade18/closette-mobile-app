import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';
import { Field, PrimaryButton, ProgressLabel } from '@/features/brands/components/FormKit';
import { fetchBrand, pickCatalogImage, updateBrandProfile } from '@/features/catalog/api';

export default function BrandProfileScreen() {
  const router = useRouter();
  const { brandId, signOut } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (!brandId || loaded.current) return;
    try {
      const brand = await fetchBrand(brandId);
      setName(brand?.name ?? '');
      setDescription(brand?.description ?? '');
      setLogoUrl(brand?.logoUrl ?? null);
      loaded.current = true;
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }, [brandId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    if (!brandId || !name.trim()) {
      setError('Enter a brand name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await updateBrandProfile({
        brandId,
        name: name.trim(),
        description: description.trim() || null,
        logoUri,
        onProgress: setProgress,
      });
      setLogoUrl(next.logoUrl);
      setLogoUri(null);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      Alert.alert('Password updated', 'Use this password the next time you sign in.');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    Alert.alert('Log out?', 'You can sign in again whenever you want.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/sign-in'));
        },
      },
    ]);
  };

  const preview = logoUri || logoUrl;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Brand profile</Text>
        <Pressable accessibilityRole="button" onPress={() => void pickCatalogImage().then((uri) => uri && setLogoUri(uri))}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.logo} />
          ) : (
            <View style={styles.logo}>
              <Text style={styles.letter}>{name.slice(0, 1) || 'B'}</Text>
            </View>
          )}
        </Pressable>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} multiline />
        {busy ? <ProgressLabel value={progress} /> : null}
        <PrimaryButton label="Save profile" onPress={() => void save()} busy={busy} />
        <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        <PrimaryButton label="Change password" onPress={() => void changePassword()} busy={busy} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Log out" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 20, paddingBottom: 120, gap: 12 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.softBlue,
  },
  letter: { fontFamily: Typeface.display, fontSize: 28, color: Colors.light.primary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body },
});
