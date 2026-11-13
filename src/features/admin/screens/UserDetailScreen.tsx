import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { fetchClients, resetClientPassword, setClientActive, type ClientRow } from '@/features/admin/api';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';
import { PasswordField, PrimaryButton, StatusBlock } from '@/features/brands/components/FormKit';

export default function UserDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [person, setPerson] = useState<ClientRow | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const people = await fetchClients();
      setPerson(people.find((item) => item.id === userId) ?? null);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const resetPassword = async () => {
    if (!person) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await resetClientPassword(person.id, password);
      setPassword('');
      Alert.alert(
        'Password updated',
        `${result.ownerEmail ?? person.email} can sign in with the password you typed. They will be asked to choose a new one.`,
      );
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    if (!person) return;
    if (person.id === user?.id) {
      setError('You cannot change your own access.');
      return;
    }
    const active = Boolean(person.disabled_at);
    Alert.alert(
      active ? 'Activate user?' : 'Deactivate user?',
      active ? 'This person can sign in again.' : 'This person stays in the database but cannot sign in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: active ? 'Activate' : 'Deactivate',
          style: active ? 'default' : 'destructive',
          onPress: () => {
            setBusy(true);
            void setClientActive(person.id, active)
              .then(() => load())
              .catch((err) => setError(authErrorMessage(err)))
              .finally(() => setBusy(false));
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={Colors.light.primary} size={20} />
          <Text style={styles.backText}>Users</Text>
        </Pressable>
        {loading ? <StatusBlock title="Loading user" /> : null}
        {!loading && !person ? <StatusBlock title="User not found" /> : null}
        {person ? (
          <View style={styles.body}>
            <Text style={styles.title}>{person.display_name || 'Closette member'}</Text>
            <Text style={styles.meta}>{person.email}</Text>
            <Text style={styles.meta}>
              {person.role} · {person.disabled_at ? 'Inactive' : 'Active'} · joined {person.created_at.slice(0, 10)}
            </Text>
            <PasswordField label="New temporary password" value={password} onChangeText={setPassword} />
            <PrimaryButton label="Reset password" onPress={() => void resetPassword()} busy={busy} />
            <PrimaryButton
              label={person.disabled_at ? 'Activate user' : 'Deactivate user'}
              onPress={toggle}
              busy={busy}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 40, gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: Typeface.body, fontSize: 16, color: Colors.light.primary },
  body: { gap: 12 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  meta: { fontFamily: Typeface.body, color: Colors.light.textSecondary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body },
});
