import { StyleSheet, Text, TouchableOpacity } from 'react-native';

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
    borderColor: '#DDDDDD',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  selectedContainer: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },

  text: {
    fontSize: 14,
    color: '#333333',
  },

  selectedText: {
    color: '#FFFFFF',
  },
});
