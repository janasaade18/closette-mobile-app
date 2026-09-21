import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cadreScreenHole } from '../lib/cadreGeometry';
import type { FitStatus } from '../hooks/useOutlineFit';

type Props = {
  status: FitStatus;
  progress: number;
  colorNotReady: string;
  colorReady: string;
};

export function FootOutlineCadre({
  status,
  progress,
  colorNotReady,
  colorReady,
}: Props) {
  const { width: sw, height: sh } = useWindowDimensions();
  const { holeW, holeH, holeLeft, holeTop } = cadreScreenHole(sw, sh);

  const ready = useSharedValue(status === 'ready' ? 1 : 0);
  const hold = useSharedValue(progress);

  useEffect(() => {
    ready.value = withTiming(status === 'ready' ? 1 : 0, { duration: 180 });
  }, [status, ready]);

  useEffect(() => {
    hold.value = withTiming(progress, { duration: 120 });
  }, [progress, hold]);

  const frameStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      Math.max(ready.value, hold.value),
      [0, 1],
      [colorNotReady, colorReady],
    ),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + hold.value * 0.8,
    borderColor: interpolateColor(hold.value, [0, 1], [colorNotReady, colorReady]),
  }));

  const dim = 'rgba(4, 8, 14, 0.72)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: holeTop, backgroundColor: dim }} />
      <View style={{ position: 'absolute', top: holeTop + holeH, left: 0, right: 0, bottom: 0, backgroundColor: dim }} />
      <View style={{ position: 'absolute', top: holeTop, left: 0, width: holeLeft, height: holeH, backgroundColor: dim }} />
      <View style={{ position: 'absolute', top: holeTop, right: 0, width: holeLeft, height: holeH, backgroundColor: dim }} />

      <Animated.View
        style={[
          styles.ring,
          progressStyle,
          {
            left: holeLeft - 5,
            top: holeTop - 5,
            width: holeW + 10,
            height: holeH + 10,
            borderRadius: (holeW + 10) / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.frame,
          frameStyle,
          {
            left: holeLeft,
            top: holeTop,
            width: holeW,
            height: holeH,
            borderRadius: holeW / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: 'absolute', borderWidth: 3, backgroundColor: 'transparent' },
  ring: { position: 'absolute', borderWidth: 3, backgroundColor: 'transparent' },
});
