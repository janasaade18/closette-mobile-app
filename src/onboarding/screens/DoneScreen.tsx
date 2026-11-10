import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Colors, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage, saveOnboardingProfile } from '@/features/auth/userProfile';
import PrimaryButton from '@/onboarding/components/PrimaryButton';
import { useOnboarding } from '@/onboarding/OnboardingContext';

interface DoneScreenProps {
  onOpenCloset: () => void;
}

export default function DoneScreen({ onOpenCloset }: DoneScreenProps) {
  const { user, setProfile } = useAuth();
  const { preferences } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const handleOpenCloset = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Create an account before opening your closet.');
      return;
    }

    setSaving(true);
    try {
      const displayName =
        preferences.name?.trim() ||
        (typeof user.user_metadata?.display_name === 'string'
          ? user.user_metadata.display_name
          : undefined);
      const profile = await saveOnboardingProfile(user.id, {
        ...preferences,
        name: displayName,
      });
      setProfile(profile);
      onOpenCloset();
    } catch (error) {
      Alert.alert('Could not save preferences', authErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobRight]} />
      <View style={[styles.blob, styles.blobLeft]} />

      <View style={styles.hero}>
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.title}>You&apos;re all set</Text>
        <Text style={styles.body}>
          Add your first piece and let{'\n'}Closette start styling.
        </Text>
      </View>

      {saving ? (
        <View style={styles.saving}>
          <ActivityIndicator color={Colors.light.onPrimary} />
          <Text style={styles.savingText}>Saving your Closette…</Text>
        </View>
      ) : (
        <PrimaryButton title="Open my closet" onPress={handleOpenCloset} tone="light" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.light.navySoft,
  },
  blobTop: {
    width: 160,
    height: 160,
    top: -30,
    left: -20,
  },
  blobRight: {
    width: 120,
    height: 120,
    top: '28%',
    right: -30,
  },
  blobLeft: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -60,
  },
  hero: {
    alignItems: 'center',
    marginTop: 48,
  },
  check: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkMark: {
    color: Colors.light.primary,
    fontSize: 34,
    fontFamily: Typeface.display,
  },
  title: {
    color: Colors.light.onPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontFamily: Typeface.display,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: Colors.light.onPrimary,
    opacity: 0.86,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Typeface.body,
    textAlign: 'center',
  },
  saving: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 18,
  },
  savingText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.body,
    fontSize: 15,
  },
});
