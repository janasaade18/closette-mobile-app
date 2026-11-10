import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/AuthContext';

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
  resetPreferences: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<UserPreferences>(defaultPreferences);
  const [boundUserId, setBoundUserId] = useState<string | null>(user?.id ?? null);

  useEffect(() => {
    const nextId = user?.id ?? null;
    if (nextId !== boundUserId) {
      setBoundUserId(nextId);
      setPreferences(defaultPreferences);
    }
  }, [user?.id, boundUserId]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences((current) => ({
      ...current,
      ...updates,
    }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  return (
    <OnboardingContext.Provider
      value={{
        preferences,
        updatePreferences,
        resetPreferences,
      }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used inside an OnboardingProvider');
  }

  return context;
}
