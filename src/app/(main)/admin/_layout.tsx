import { Stack } from 'expo-router';

import { RoleGate } from '@/features/auth/RoleGate';
import { useAuth } from '@/features/auth/AuthContext';

export default function AdminLayout() {
  const { isAdmin } = useAuth();
  return (
    <RoleGate allowed={isAdmin}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
