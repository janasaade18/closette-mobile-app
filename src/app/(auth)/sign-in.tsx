import { useRouter } from 'expo-router';

import SignInScreen from '@/features/auth/screens/SignInScreen';

export default function SignInRoute() {
  const router = useRouter();
  return (
    <SignInScreen
      onComplete={() => router.replace('/')}
      onSignUp={() => router.replace('/sign-up')}
    />
  );
}
