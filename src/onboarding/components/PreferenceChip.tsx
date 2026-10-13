import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors, Typeface } from '../../constants/theme';

interface PreferenceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  shape?: 'pill' | 'circle';
}

export default function PreferenceChip({
  label,
  selected,
  onPress,
  shape = 'pill',
}: PreferenceChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        shape === 'circle' && styles.circle,
        selected && styles.selectedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedContainer: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  text: {
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: Typeface.bodyStrong,
  },
  selectedText: {
    color: Colors.light.onPrimary,
  },
});
