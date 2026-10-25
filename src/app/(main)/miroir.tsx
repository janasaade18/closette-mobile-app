import MiroirScreen from '@/features/miroir/screens/MiroirScreen';
import { useLocalSearchParams } from 'expo-router';

export default function MiroirRoute() {
  const params = useLocalSearchParams<{ product?: string; price?: string; category?: string; returnTo?: string; mode?: string; source?: string }>();
  const routeKey = [params.product, params.price, params.category, params.returnTo, params.mode, params.source].join('|');
  return <MiroirScreen key={routeKey} />;
}
