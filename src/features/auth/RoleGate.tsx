import { ReactNode, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';

export function RoleGate({
  allowed,
  children,
}: {
  allowed: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace('/profile');
    }
  }, [allowed, loading, router]);

  if (loading || !allowed) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={Colors.light.primary} />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  waiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.canvas,
  },
});
