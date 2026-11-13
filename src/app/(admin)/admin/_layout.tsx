import { Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { RoleGate } from '@/features/auth/RoleGate';

export default function AdminLayout() {
  const { isAdmin } = useAuth();
  return (
    <RoleGate allowed={isAdmin}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
