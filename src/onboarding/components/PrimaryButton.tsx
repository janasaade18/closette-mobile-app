import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors, Typeface } from '../../constants/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  tone?: 'navy' | 'light' | 'outline';
  bottomSpacing?: number;
}

export default function PrimaryButton({
  title,
  onPress,
  tone = 'navy',
  bottomSpacing = 16,
}: PrimaryButtonProps) {
  const light = tone === 'light';
  const outline = tone === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { marginBottom: bottomSpacing },
        light && styles.lightButton,
        outline && styles.outlineButton,
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Text
        style={[
          styles.text,
          light && styles.lightText,
          outline && styles.outlineText,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightButton: {
    backgroundColor: Colors.light.onPrimary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.light.outlineOnNavy,
  },
  text: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontFamily: Typeface.display,
  },
  lightText: {
    color: Colors.light.primary,
  },
  outlineText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.displayMedium,
  },
});
