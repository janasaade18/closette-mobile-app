import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { PasswordChangeForm } from '@/features/auth/components/PasswordChangeForm';
import { useAuth } from '@/features/auth/AuthContext';
import { roleHome } from '@/features/auth/roleHome';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { session, profile, loading, isAdmin, brandId } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/sign-in');
      return;
    }
    if (profile && !profile.must_change_password) {
      router.replace(roleHome(isAdmin, brandId));
    }
  }, [loading, session, profile, isAdmin, brandId, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.body}>
          This sign-in was given a temporary password. Set your own before continuing.
        </Text>
        <PasswordChangeForm onChanged={() => router.replace(roleHome(isAdmin, brandId))} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 28, paddingBottom: 40, gap: 12 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  body: { fontFamily: Typeface.body, fontSize: 16, lineHeight: 22, color: Colors.light.textSecondary },
});
