import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({
  onFinish,
}: SplashScreenProps) {
  const logoScale = useSharedValue(0.88);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 700,
    });

    logoScale.value = withTiming(1, {
      duration: 900,
    });

    const timer = setTimeout(() => {
      onFinish();
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      {
        scale: logoScale.value,
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.logo}>CLOSETTE</Text>

        <Animated.View
          entering={FadeIn.delay(500).duration(600)}
          style={styles.line}
        />

        <Animated.Text
          entering={FadeInUp.delay(650).duration(600)}
          style={styles.tagline}
        >
          YOUR STYLE, YOUR WAY
        </Animated.Text>
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoContainer: {
    alignItems: 'center',
  },

  logo: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 7,
    color: Colors.light.text,
  },

  line: {
    width: 42,
    height: 1,
    backgroundColor: Colors.light.primary,
    marginTop: 18,
    marginBottom: 12,
  },

  tagline: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 3,
    color: Colors.light.textSecondary,
  },
});