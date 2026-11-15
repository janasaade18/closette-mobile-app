import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Database } from '@/lib/database.types';

const extra = Constants.expoConfig?.extra as
  | { supabaseUrl?: string; supabaseAnonKey?: string }
  | undefined;

// Anon key is public by design. Hardcoded fallbacks keep Expo Go usable when
// Metro does not inject EXPO_PUBLIC_* env vars.
const FALLBACK_URL = 'https://ntrfbndjtdlghnbbxxtz.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cmZibmRqdGRsZ2huYmJ4eHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDE1ODMsImV4cCI6MjEwNTQ3NzU4M30.Ji1MwUhX98D5wYM4NVfjC_YHsZNq1sUazcXmiY1RH2w';

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ||
  extra?.supabaseUrl?.trim() ||
  FALLBACK_URL;

const anonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  extra?.supabaseAnonKey?.trim() ||
  FALLBACK_ANON_KEY;

const memoryStore = new Map<string, string>();

const isServer = typeof window === 'undefined' && Platform.OS === 'web';

const authStorage = {
  getItem: async (key: string) => {
    if (isServer) return memoryStore.get(key) ?? null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (isServer) {
      memoryStore.set(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (isServer) {
      memoryStore.delete(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
