import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';
import { Field, PrimaryButton } from '@/features/brands/components/FormKit';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const name = nameDraft ?? profile?.display_name ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    if (!user?.id || !name.trim()) {
      setError('Enter your name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ display_name: name.trim() })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <Field label="Name" value={name} onChangeText={setNameDraft} />
        <PrimaryButton label="Save name" onPress={() => void saveName()} busy={busy} />
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
  email: { fontFamily: Typeface.body, color: Colors.light.textSecondary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body },
});
