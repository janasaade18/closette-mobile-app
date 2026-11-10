import type { UserPreferences } from '@/onboarding/models/UserPreferences';

import { supabase } from '@/lib/supabase';

import type { ClosetteUserProfile, OnboardingProfileInput } from './types';

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ClosetteUserProfile | null;
}

export async function saveOnboardingProfile(
  userId: string,
  preferences: UserPreferences,
) {
  const payload: OnboardingProfileInput = {
    display_name: preferences.name?.trim() || null,
    age_range: preferences.ageRange ?? null,
    gender: preferences.gender ?? null,
    location: preferences.location ?? null,
    preferred_units: preferences.preferredUnits ?? null,
    height_cm: preferences.heightCm ?? null,
    top_size: preferences.topSize ?? null,
    bottom_size: preferences.bottomSize ?? null,
    accent_color: preferences.accentColor ?? null,
    photo_url: preferences.photoUri ?? null,
    weather_aware: Boolean(preferences.weatherAware),
    preferred_styles: preferences.preferredStyles ?? [],
    preferred_colors: preferences.preferredColors ?? [],
    preferred_clothing: preferences.preferredClothing ?? [],
    common_occasions: preferences.commonOccasions ?? [],
    onboarding_completed_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as ClosetteUserProfile;
}

export function authErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'Something went wrong. Try again.';
  }

  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Something went wrong. Try again.';

  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) {
    return 'Wrong email or password.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'That email already has an account. Sign in instead.';
  }
  if (lower.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('unable to validate email') || lower.includes('invalid email')) {
    return 'Enter a valid email address.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email, then sign in again.';
  }
  if (lower.includes('email rate limit exceeded') || lower.includes('over_email_send_rate_limit')) {
    return 'Too many signup emails sent. Wait about an hour, or turn off Confirm email in the Supabase Auth settings for development.';
  }
  return message;
}
