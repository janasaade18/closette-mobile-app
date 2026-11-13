import { ReactNode, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { roleHome } from '@/features/auth/roleHome';

export function RoleGate({
  allowed,
  children,
}: {
  allowed: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const { loading, isAdmin, brandId } = useAuth();

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace(roleHome(isAdmin, brandId));
    }
  }, [allowed, brandId, isAdmin, loading, router]);

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
