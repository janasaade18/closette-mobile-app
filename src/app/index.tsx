import { useState } from 'react';

import BasicInfoScreen from './onboarding/screens/BasicInfoScreen';
import ConfirmationScreen from './onboarding/screens/ConfirmationScreen';
import OccasionPreferencesScreen from './onboarding/screens/OccasionPreferencesScreen';
import StylePreferencesScreen from './onboarding/screens/StylePreferencesScreen';
import WelcomeScreen from './onboarding/screens/WelcomeScreen';

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
      setStep(4);
    } else {
      setStep(nextStep);
    }
  };

  return (
    <OnboardingProvider>
      {step === 0 && (
        <WelcomeScreen
          onGetStarted={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <BasicInfoScreen
          onContinue={() => finishSection(2)}
        />
      )}

      {step === 2 && (
        <StylePreferencesScreen
          onContinue={() => finishSection(3)}
        />
      )}

      {step === 3 && (
        <OccasionPreferencesScreen
          onContinue={() => finishSection(4)}
        />
      )}

      {step === 4 && (
        <ConfirmationScreen
          onContinue={() => setStep(5)}
          onEdit={editSection}
        />
      )}
    </OnboardingProvider>
  );
}