import { useState } from 'react';
import { useRouter } from 'expo-router';

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
  const [step, setStep] = useState(0);
  const router = useRouter();

  return (
    <>
      {step === 0 && <SplashScreen onFinish={() => setStep(1)} />}
      {step === 1 && (
        <WelcomeScreen
          onGetStarted={() => setStep(2)}
          onSignIn={() => router.push('/sign-in')}
        />
      )}
      {step === 2 && (
        <IntroCarouselScreen
          onBack={() => setStep(1)}
          onDone={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <BasicInfoScreen
          onBack={() => setStep(2)}
          onContinue={() => setStep(4)}
        />
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
