import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from '@/features/auth/AuthContext';
import { roleHome } from '@/features/auth/roleHome';
import AccentScreen from '@/onboarding/screens/AccentScreen';
import BasicInfoScreen from '@/onboarding/screens/BasicInfoScreen';
import DoneScreen from '@/onboarding/screens/DoneScreen';
import FitScreen from '@/onboarding/screens/FitScreen';
import IntroCarouselScreen from '@/onboarding/screens/IntroCarouselScreen';
import OccasionPreferencesScreen from '@/onboarding/screens/OccasionPreferencesScreen';
import StylePreferencesScreen from '@/onboarding/screens/StylePreferencesScreen';
import SplashScreen from '@/onboarding/screens/SplashScreen';
import WelcomeScreen from '@/onboarding/screens/WelcomeScreen';

export default function IndexRoute() {
  const router = useRouter();
  const { session, profile, loading, isAdmin, brandId } = useAuth();
  const [step, setStep] = useState(0);
  const [splashDone, setSplashDone] = useState(false);

  const needsOnboarding = Boolean(session && !profile?.onboarding_completed_at);

  useEffect(() => {
    if (loading || !splashDone) {
      return;
    }

    if (session && profile?.onboarding_completed_at) {
      router.replace(roleHome(isAdmin, brandId));
      return;
    }

    if (session && !profile?.onboarding_completed_at && step < 2) {
      // Authenticated users who never finished onboarding skip welcome/auth.
      setStep(2);
    }
  }, [loading, splashDone, session, profile, isAdmin, brandId, step, router]);

  if (!splashDone || loading) {
    return (
      <SplashScreen
        onFinish={() => {
          setSplashDone(true);
          setStep(1);
        }}
      />
    );
  }

  if (!session) {
    return (
      <WelcomeScreen
        onGetStarted={() => router.push('/sign-up')}
        onSignIn={() => router.push('/sign-in')}
      />
    );
  }

  if (!needsOnboarding) {
    return (
      <SplashScreen
        onFinish={() => {
          router.replace(roleHome(isAdmin, brandId));
        }}
      />
    );
  }

  return (
    <>
      {step === 2 && (
        <IntroCarouselScreen onBack={() => setStep(2)} onDone={() => setStep(3)} />
      )}
      {step === 3 && (
        <BasicInfoScreen onBack={() => setStep(2)} onContinue={() => setStep(4)} />
      )}
      {step === 4 && (
        <StylePreferencesScreen
          onBack={() => setStep(3)}
          onContinue={() => setStep(5)}
        />
      )}
      {step === 5 && (
        <FitScreen onBack={() => setStep(4)} onContinue={() => setStep(6)} />
      )}
      {step === 6 && (
        <OccasionPreferencesScreen
          onBack={() => setStep(5)}
          onContinue={() => setStep(7)}
        />
      )}
      {step === 7 && (
        <AccentScreen onBack={() => setStep(6)} onContinue={() => setStep(8)} />
      )}
      {step === 8 && (
        <DoneScreen onOpenCloset={() => router.replace('/home')} />
      )}
    </>
  );
}
