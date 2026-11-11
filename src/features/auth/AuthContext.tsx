import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

import type { ClosetteUserProfile } from './types';
import { authErrorMessage, fetchUserProfile } from './userProfile';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: ClosetteUserProfile | null;
  loading: boolean;
  signUp: (input: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<ClosetteUserProfile | null>;
  setProfile: (profile: ClosetteUserProfile | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ClosetteUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const next = await fetchUserProfile(userId);
      setProfile(next);
      return next;
    } catch (error) {
      console.warn('Failed to load Closette profile', authErrorMessage(error));
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          void loadProfile(data.session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.warn('Failed to restore session', authErrorMessage(error));
        if (mounted) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          void loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(
    async (input: { email: string; password: string; displayName: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            display_name: input.displayName.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      // With email confirmation on, existing emails often return a user with
      // empty identities and no session instead of a hard error.
      const identities = data.user?.identities ?? [];
      if (data.user && identities.length === 0) {
        throw new Error('User already registered');
      }

      if (data.session?.user) {
        // Trigger creates the public.users row; give it a beat then load.
        await new Promise((resolve) => setTimeout(resolve, 400));
        await loadProfile(data.session.user.id);
        return { needsEmailConfirmation: false };
      }

      return { needsEmailConfirmation: true };
    },
    [loadProfile],
  );

  const signIn = useCallback(
    async (input: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email.trim(),
        password: input.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await loadProfile(data.user.id);
      }
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }
    return loadProfile(user.id);
  }, [loadProfile, user?.id]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      setProfile,
    }),
    [session, user, profile, loading, signUp, signIn, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
