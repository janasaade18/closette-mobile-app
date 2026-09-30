import { createContext, ReactNode, useContext, useState } from 'react';
import { UserPreferences } from './models/UserPreferences';

const defaultPreferences: UserPreferences = {
  preferredStyles: [],
  preferredColors: [],
  preferredClothing: [],
  commonOccasions: [],
};

interface OnboardingContextType {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((current) => ({
      ...current,
      ...updates,
    }));
  };

  return (
    <OnboardingContext.Provider
      value={{
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error(
      'useOnboarding must be used inside an OnboardingProvider'
    );
  }

  return context;
}