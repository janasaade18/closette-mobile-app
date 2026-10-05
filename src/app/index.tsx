import { useState } from 'react';

import SignInScreen from './auth/sign-in';
import SignUpScreen from './auth/sign-up';
import BasicInfoScreen from './onboarding/screens/BasicInfoScreen';
import ConfirmationScreen from './onboarding/screens/ConfirmationScreen';
import OccasionPreferencesScreen from './onboarding/screens/OccasionPreferencesScreen';
import StylePreferencesScreen from './onboarding/screens/StylePreferencesScreen';
import SplashScreen from './SplashScreen';
import WelcomeScreen from './WelcomeScreen';

import { OnboardingProvider } from '../onboarding/OnboardingContext';

export default function HomeScreen() {
  const [step, setStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const editSection = (editStep: number) => {
    setIsEditing(true);
    setStep(editStep);
  };

  const finishSection = (nextStep: number) => {
    if (isEditing) {
      setIsEditing(false);
      setStep(5);
    } else {
      setStep(nextStep);
    }
  };

  return (
    <OnboardingProvider>
      {step === 0 && (
        <SplashScreen
          onFinish={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <WelcomeScreen
          onGetStarted={() => setStep(2)}
          onSignIn={() => setStep(6)}
        />
      )}

      {step === 2 && (
        <BasicInfoScreen
          onContinue={() => finishSection(3)}
        />
      )}

      {step === 3 && (
        <StylePreferencesScreen
          onContinue={() => finishSection(4)}
        />
      )}

      {step === 4 && (
        <OccasionPreferencesScreen
          onContinue={() => finishSection(5)}
        />
      )}

      {step === 5 && (
        <ConfirmationScreen
          onContinue={() => setStep(7)}
          onEdit={editSection}
        />
      )}

      {step === 6 && (
        <SignInScreen
          onComplete={() => setStep(8)}
          onSignUp={() => setStep(7)}
        />
      )}

      {step === 7 && (
        <SignUpScreen
          onComplete={() => setStep(8)}
          onSignIn={() => setStep(6)}
        />
      )}

      {step === 8 && (
        <HomeScreenContent />
      )}
    </OnboardingProvider>
  );
}

function HomeScreenContent() {
  return null;
}