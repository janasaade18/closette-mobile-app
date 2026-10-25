import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '@/constants/theme';
import HangerMark from '@/onboarding/components/HangerMark';
import PrimaryButton from '@/onboarding/components/PrimaryButton';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function WelcomeScreen({
  onGetStarted,
  onSignIn,
}: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.blob, styles.sand]} />
      <View style={[styles.blob, styles.bubbleTop]} />
      <View style={[styles.blob, styles.bubbleLeft]} />
      <View style={[styles.blob, styles.bubbleBottom]} />

      <View style={styles.hero}>
        <View style={styles.mark}>
          <HangerMark color={Colors.light.primary} size={78} />
        </View>
        <Text style={styles.wordmark}>closette</Text>
        <Text style={styles.tagline}>
          Your whole closet, pocket-sized{'\n'}and ready to style.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Get started" onPress={onGetStarted} tone="light" />
        <PrimaryButton
          title="I already have an account"
          onPress={onSignIn}
          tone="outline"
        />
      </View>
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
  },
  sand: {
    width: 54,
    height: 54,
    backgroundColor: Colors.light.sand,
    top: '27%',
    right: '22%',
  },
  bubbleTop: {
    width: 180,
    height: 180,
    backgroundColor: Colors.light.navySoft,
    top: -40,
    right: -50,
  },
  bubbleLeft: {
    width: 36,
    height: 36,
    backgroundColor: Colors.light.bubble,
    opacity: 0.45,
    top: '38%',
    left: 36,
  },
  bubbleBottom: {
    width: 150,
    height: 150,
    backgroundColor: Colors.light.navySoft,
    bottom: 90,
    left: -40,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: Colors.light.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  wordmark: {
    fontSize: 42,
    fontFamily: Typeface.display,
    color: Colors.light.onPrimary,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Typeface.body,
    color: Colors.light.onPrimaryMuted,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});
