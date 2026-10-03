import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/theme';

interface PreferenceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function PreferenceChip({
  label,
  selected,
  onPress,
}: PreferenceChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selectedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          selected && styles.selectedText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  selectedContainer: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },

  text: {
    fontSize: 14,
    color: Colors.light.text,
  },

  selectedText: {
    color: Colors.light.background,
  },
});