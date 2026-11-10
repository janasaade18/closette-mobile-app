import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';

export default function MainLayout() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!session) {
      router.replace('/sign-in');
      return;
    }
    // Only bounce incomplete onboarding when we actually have a profile row.
    // A null profile during a refresh must not kick completed users to `/` → home.
    if (profile && !profile.onboarding_completed_at) {
      router.replace('/');
    }
  }, [loading, session, profile, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: styles.scene,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="muse-chat" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="miroir" options={{ animation: 'fade' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: Colors.light.canvas },
});
