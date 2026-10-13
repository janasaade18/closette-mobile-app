import { useState } from 'react';

import SignInScreen from './auth/sign-in';
import SignUpScreen from './auth/sign-up';
import ClosetHomeScreen from './ClosetHomeScreen';
import GarmentClassificationScreen from './features/garmentClassification/screens/GarmentClassificationScreen';
import AccentScreen from './onboarding/screens/AccentScreen';
import BasicInfoScreen from './onboarding/screens/BasicInfoScreen';
import DoneScreen from './onboarding/screens/DoneScreen';
import FitScreen from './onboarding/screens/FitScreen';
import IntroCarouselScreen from './onboarding/screens/IntroCarouselScreen';
import OccasionPreferencesScreen from './onboarding/screens/OccasionPreferencesScreen';
import StylePreferencesScreen from './onboarding/screens/StylePreferencesScreen';
import SplashScreen from './SplashScreen';
import WelcomeScreen from './WelcomeScreen';

import { OnboardingProvider } from '../onboarding/OnboardingContext';

export default function HomeScreen() {
  const [step, setStep] = useState(0);

  return (
    <OnboardingProvider>
      {step === 0 && <SplashScreen onFinish={() => setStep(1)} />}

      {step === 1 && (
        <WelcomeScreen
          onGetStarted={() => setStep(2)}
          onSignIn={() => setStep(9)}
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

      {step === 8 && <DoneScreen onOpenCloset={() => setStep(11)} />}

      {step === 9 && (
        <SignInScreen onComplete={() => setStep(11)} onSignUp={() => setStep(10)} />
      )}

      {step === 10 && (
        <SignUpScreen onComplete={() => setStep(11)} onSignIn={() => setStep(9)} />
      )}

      {step === 11 && (
        <ClosetHomeScreen onAddPiece={() => setStep(12)} />
      )}

      {step === 12 && (
        <GarmentClassificationScreen onBack={() => setStep(11)} />
      )}
    </OnboardingProvider>
  );
}
