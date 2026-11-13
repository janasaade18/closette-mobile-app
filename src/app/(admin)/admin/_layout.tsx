import { Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { RoleGate } from '@/features/auth/RoleGate';
import { usePasswordGate } from '@/features/auth/usePasswordGate';

export default function AdminLayout() {
  const { isAdmin } = useAuth();
  usePasswordGate();
  return (
    <RoleGate allowed={isAdmin}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
