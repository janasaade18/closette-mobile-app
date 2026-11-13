import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { createClientAccount } from '@/features/admin/api';
import { authErrorMessage } from '@/features/auth/userProfile';
import { Field, PasswordField, PrimaryButton } from '@/features/brands/components/FormKit';

export default function AddUserScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError('Enter a name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email.');
      return;
    }
    if (password.length < 6) {
      setError('Temporary password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createClientAccount({ name: name.trim(), email, password });
      Alert.alert(
        'User ready',
        `${created.user.email} can sign in with the password you typed. They will be asked to choose a new one. It is not stored in the app.`,
        [{ text: 'Done', onPress: () => router.back() }],
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
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={Colors.light.primary} size={20} />
          <Text style={styles.backText}>Users</Text>
        </Pressable>
        <Text style={styles.title}>Add user</Text>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <PasswordField label="Temporary password" value={password} onChangeText={setPassword} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Create user" onPress={() => void submit()} busy={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 40, gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontFamily: Typeface.body, fontSize: 16, color: Colors.light.primary },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body },
});
