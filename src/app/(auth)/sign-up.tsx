import { useRouter } from 'expo-router';

import SignUpScreen from '@/features/auth/screens/SignUpScreen';

export default function SignUpRoute() {
  const router = useRouter();
  return (
    <SignUpScreen
      onComplete={() => router.replace('/')}
      onSignIn={() => router.replace('/sign-in')}
    />
  );
}
