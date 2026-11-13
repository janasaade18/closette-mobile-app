import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Colors, Typeface } from '@/constants/theme';
import { PasswordField, PrimaryButton } from '@/features/brands/components/FormKit';
import { authErrorMessage } from '@/features/auth/userProfile';
import { useAuth } from '@/features/auth/AuthContext';

import { changeOwnPassword, PASSWORD_TOO_SHORT, passwordMismatch, passwordTooShort } from '../password';

export function PasswordChangeForm({ onChanged }: { onChanged?: () => void }) {
  const { refreshProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (passwordTooShort(newPassword)) {
      setError(PASSWORD_TOO_SHORT);
      return;
    }
    if (passwordMismatch(newPassword, confirmPassword)) {
      setError('Those passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a different password.');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await changeOwnPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshProfile();
      setSuccess('Password updated. You are still signed in.');
      onChanged?.();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PasswordField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} />
      <PasswordField label="New password" value={newPassword} onChangeText={setNewPassword} />
      <PasswordField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <PrimaryButton label="Change password" onPress={() => void submit()} busy={busy} />
    </>
  );
}

const styles = StyleSheet.create({
  error: { color: Colors.light.rust, fontFamily: Typeface.body },
  success: { color: Colors.light.primary, fontFamily: Typeface.body },
});
