import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

import { Colors, Typeface } from '../constants/theme';
import HangerMark from '../onboarding/components/HangerMark';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700 });
    logoScale.value = withTiming(1, { duration: 900 });

    const timer = setTimeout(onFinish, 1600);
    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.blob, styles.blobSand]} />
      <View style={[styles.blob, styles.blobBubble]} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.mark}>
          <HangerMark color={Colors.light.primary} size={64} />
        </View>
        <Animated.Text entering={FadeIn.delay(250).duration(500)} style={styles.logo}>
          closette
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobSand: {
    width: 90,
    height: 90,
    backgroundColor: Colors.light.sand,
    top: '22%',
    right: '18%',
    opacity: 0.9,
  },
  blobBubble: {
    width: 140,
    height: 140,
    backgroundColor: Colors.light.bubble,
    bottom: '16%',
    left: -30,
    opacity: 0.18,
  },
  logoContainer: {
    alignItems: 'center',
  },
  mark: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: Colors.light.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logo: {
    fontSize: 40,
    fontFamily: Typeface.display,
    color: Colors.light.onPrimary,
    letterSpacing: -0.5,
  },
});
