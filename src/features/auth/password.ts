import { supabase } from '@/lib/supabase';

import { invokeFunction } from './functions';

export const PASSWORD_TOO_SHORT = 'Password must be at least 6 characters.';

export function passwordTooShort(password: string) {
  return password.length < 6;
}

export function passwordMismatch(password: string, confirm: string) {
  return password !== confirm;
}

export async function changeOwnPassword(input: { currentPassword: string; newPassword: string }) {
  const data = await invokeFunction<{ accessToken: string; refreshToken: string }>('change-password', {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  });
  const { error } = await supabase.auth.setSession({
    access_token: data.accessToken,
    refresh_token: data.refreshToken,
  });
  if (error) throw error;
}
