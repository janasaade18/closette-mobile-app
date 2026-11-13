import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { PasswordChangeForm } from '@/features/auth/components/PasswordChangeForm';
import { authErrorMessage } from '@/features/auth/userProfile';
import { fetchAdminStats } from '@/features/admin/api';
import { Field, PrimaryButton, ProgressLabel, StatusBlock } from '@/features/brands/components/FormKit';
import { avatarImageUrl, pickCatalogImage, removeAvatar, uploadAvatar } from '@/features/catalog/api';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? profile?.display_name ?? '';
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [stats, setStats] = useState<{ brands: number; users: number; products: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    try {
      setError(null);
      setStats(await fetchAdminStats());
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

  const saveName = async () => {
    if (!user?.id || !name.trim()) {
      setError('Enter your name.');
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const { error: updateError } = await supabase.from('users').update({ display_name: name.trim() }).eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setNameDraft(null);
      setSaved('Name saved.');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const changeAvatar = async () => {
    if (!user?.id) return;
    try {
      const uri = await pickCatalogImage([1, 1]);
      if (!uri) return;
      setAvatarUri(uri);
      setBusy(true);
      setError(null);
      setProgress(0);
      const path = await uploadAvatar({ userId: user.id, uri, onProgress: setProgress });
      const { error: updateError } = await supabase.from('users').update({ photo_url: path }).eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setAvatarUri(null);
      setSaved('Photo updated.');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const clearAvatar = async () => {
    if (!user?.id) return;
    setBusy(true);
    setError(null);
    try {
      await removeAvatar(user.id);
      const { error: updateError } = await supabase.from('users').update({ photo_url: null }).eq('id', user.id);
      if (updateError) throw updateError;
      setAvatarUri(null);
      await refreshProfile();
      setSaved('Photo removed.');
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

  const photo = avatarUri || avatarImageUrl(profile?.photo_url ?? null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Profile</Text>
        {loading ? <StatusBlock title="Loading profile" /> : null}
        {!loading && error && !stats ? (
          <StatusBlock title="Could not load profile" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => void changeAvatar()}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.letter}>{name.slice(0, 1).toUpperCase() || 'A'}</Text>
            </View>
          )}
        </Pressable>
        {photo ? (
          <Pressable accessibilityRole="button" onPress={() => void clearAvatar()}>
            <Text style={styles.link}>Remove photo</Text>
          </Pressable>
        ) : null}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Admin</Text>
        </View>
        <Text style={styles.email}>{profile?.email}</Text>
        {stats ? (
          <Text style={styles.stats}>
            {stats.brands} brands · {stats.users} users · {stats.products} products
          </Text>
        ) : null}
        <Field label="Name" value={name} onChangeText={setNameDraft} />
        {busy ? <ProgressLabel value={progress} /> : null}
        {saved ? <Text style={styles.saved}>{saved}</Text> : null}
        {error && stats ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Save name" onPress={() => void saveName()} busy={busy} />
        <Text style={styles.section}>Account</Text>
        <PasswordChangeForm />
        <PrimaryButton label="Log out" onPress={logout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 20, paddingBottom: 120, gap: 12 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.softBlue,
    overflow: 'hidden',
  },
  letter: { fontFamily: Typeface.display, fontSize: 28, color: Colors.light.primary },
  link: { fontFamily: Typeface.bodyStrong, color: Colors.light.primary },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  badgeText: { color: Colors.light.onPrimary, fontFamily: Typeface.bodyStrong, fontSize: 12 },
  email: { fontFamily: Typeface.body, color: Colors.light.textSecondary },
  stats: { fontFamily: Typeface.body, color: Colors.light.textSecondary },
  saved: { fontFamily: Typeface.body, color: Colors.light.primary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body },
  section: { fontFamily: Typeface.display, fontSize: 24, color: Colors.light.primary, marginTop: 8 },
});
