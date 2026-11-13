import { Stack } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { RoleGate } from '@/features/auth/RoleGate';

export default function BrandLayout() {
  const { brandId } = useAuth();
  return (
    <RoleGate allowed={Boolean(brandId)}>
      <Stack screenOptions={{ headerShown: false }} />
    </RoleGate>
  );
}
