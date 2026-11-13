import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { authErrorMessage } from '@/features/auth/userProfile';
import { createBrandAccount } from '@/features/brands/adminApi';
import { Field, PasswordField, PrimaryButton, ProgressLabel } from '@/features/brands/components/FormKit';
import { pickCatalogImage, updateBrandProfile } from '@/features/catalog/api';

export default function AddBrandScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const chooseLogo = async () => {
    try {
      const uri = await pickCatalogImage();
      if (uri) setLogoUri(uri);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  const submit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a brand name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid login email.');
      return;
    }
    if (password.length < 6) {
      setError('Temporary password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    setError(null);
    setProgress(logoUri ? 0.05 : 0);
    try {
      const created = await createBrandAccount({
        name: trimmedName,
        description: description.trim(),
        email,
        password,
      });

      if (logoUri) {
        await updateBrandProfile({
          brandId: created.brand.id,
          name: trimmedName,
          description: description.trim() || null,
          logoUri,
          onProgress: setProgress,
        });
      }

      Alert.alert(
        'Brand ready',
        `${created.ownerEmail} can sign in with the password you typed. They will be asked to choose a new one. It is not stored in the app.`,
        [
          {
            text: 'Open brand',
            onPress: () =>
              router.replace({ pathname: '/admin/brand/[brandId]', params: { brandId: created.brand.id } }),
          },
        ],
      );
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={Colors.light.primary}
            size={20}
          />
          <Text style={styles.backText}>Brands</Text>
        </Pressable>
        <Text style={styles.title}>Add brand</Text>
        <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field
          label="Login email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <PasswordField label="Temporary password" value={password} onChangeText={setPassword} />
        <Pressable accessibilityRole="button" onPress={() => void chooseLogo()} style={styles.logoButton}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logo} />
          ) : (
            <Text style={styles.logoText}>Add logo</Text>
          )}
        </Pressable>
        {busy && logoUri ? <ProgressLabel value={progress} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Create brand login" onPress={() => void submit()} busy={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 40, gap: 14 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  logoButton: {
    height: 120,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  logo: { width: '100%', height: '100%' },
  logoText: { fontFamily: Typeface.bodyStrong, color: Colors.light.primary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body, fontSize: 14 },
});
