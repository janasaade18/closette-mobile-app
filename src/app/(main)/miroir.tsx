import { useLocalSearchParams } from 'expo-router';

import MiroirScreen from '@/features/miroir/screens/MiroirScreen';

/**
 * Always use the non-native Miroir UI in this route.
 * Vision Camera / NitroModules live in MiroirNativeCameraScreen and are
 * not imported here — Expo Go cannot load them.
 */
export default function MiroirRoute() {
  const params = useLocalSearchParams<{
    product?: string;
    price?: string;
    category?: string;
    returnTo?: string;
    mode?: string;
    source?: string;
  }>();
  const routeKey = [
    params.product,
    params.price,
    params.category,
    params.returnTo,
    params.mode,
    params.source,
  ].join('|');

  return <MiroirScreen key={routeKey} />;
}
