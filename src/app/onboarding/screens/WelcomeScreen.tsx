import { StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../../../onboarding/components/PrimaryButton';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({
  onGetStarted,
}: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>CLOSETTE</Text>

        <Text style={styles.title}>
          Your wardrobe, smarter.
        </Text>

        <Text style={styles.description}>
          Organize your clothes and discover outfits that fit your
          style, occasion, and context.
        </Text>
      </View>

      <PrimaryButton
        title="Get Started"
        onPress={onGetStarted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'space-between',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 50,
  },

  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  description: {
    fontSize: 17,
    lineHeight: 26,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 340,
  },
});