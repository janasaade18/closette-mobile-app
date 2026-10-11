import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '../../constants/theme';

interface OnboardingHeaderProps {
  step: number;
  total?: number;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function OnboardingHeader({
  step,
  total = 5,
  title,
  subtitle,
  onBack,
}: OnboardingHeaderProps) {
  const progress = Math.min(1, Math.max(0, step / total));

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable
          onPress={onBack}
          disabled={!onBack}
          style={styles.back}
          hitSlop={8}>
          <Text style={styles.backIcon}>{onBack ? '‹' : ''}</Text>
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.count}>
          {step}/{total}
        </Text>
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  back: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    lineHeight: 28,
    color: Colors.light.primary,
    fontFamily: Typeface.displayMedium,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: Colors.light.bubble,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 99,
    backgroundColor: Colors.light.primary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  count: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontFamily: Typeface.body,
    minWidth: 28,
    textAlign: 'right',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    marginBottom: 8,
  },
});
