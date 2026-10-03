import LottieView from 'lottie-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

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
      <Animated.View
        entering={FadeIn.duration(700)}
        style={styles.header}
      >
        <Text style={styles.logo}>CLOSETTE</Text>
      </Animated.View>

      <View style={styles.visualArea}>
        <Animated.View
          entering={FadeIn.duration(900)}
          style={styles.visual}
        >
          <LottieView
  source={require('../../assets/animations/tshirt.json')}
  autoPlay
  loop={false}
  style={styles.animation}
/>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(400).duration(700)}
          style={styles.title}
        >
          Make every look feel like you.
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInUp.delay(500).duration(700)}
        style={styles.actions}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={onSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInBold}>
              Sign In
            </Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 28,
    paddingTop: 58,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },

  header: {
    alignItems: 'center',
  },

  logo: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 5,
    color: Colors.light.text,
  },

  visualArea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  visual: {
    width: 260,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  animation: {
    width: 260,
    height: 260,
  },

  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    maxWidth: 330,
  },

  actions: {
    width: '100%',
  },

  primaryButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },

  signInButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },

  signInText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },

  signInBold: {
    color: Colors.light.text,
    fontWeight: '600',
  },
});