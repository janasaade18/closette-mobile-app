import { Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { RoleGate } from '@/features/auth/RoleGate';
import { usePasswordGate } from '@/features/auth/usePasswordGate';

export default function BrandLayout() {
  const { brandId } = useAuth();
  usePasswordGate();

  return (
    <RoleGate allowed={Boolean(brandId)}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
