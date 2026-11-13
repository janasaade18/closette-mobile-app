import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { roleHome } from '@/features/auth/roleHome';
import { usePasswordGate } from '@/features/auth/usePasswordGate';

export default function MainLayout() {
  const router = useRouter();
  const { session, profile, loading, isAdmin, brandId } = useAuth();
  usePasswordGate();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!session) {
      router.replace('/sign-in');
      return;
    }
    if (profile?.must_change_password) {
      return;
    }
    if (isAdmin || brandId) {
      router.replace(roleHome(isAdmin, brandId));
      return;
    }
    // Only bounce incomplete onboarding when we actually have a profile row.
    // A null profile during a refresh must not kick completed users to `/` → home.
    if (profile && !profile.onboarding_completed_at) {
      router.replace('/');
    }
  }, [loading, session, profile, isAdmin, brandId, router]);

  if (loading || !session || profile?.must_change_password || isAdmin || brandId) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={Colors.light.primary} />
      </View>
    );
  }

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
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.canvas,
  },
});
