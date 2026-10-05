import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import OnboardingHeader from '../../../onboarding/components/OnboardingHeader';
import PreferenceChip from '../../../onboarding/components/PreferenceChip';
import PrimaryButton from '../../../onboarding/components/PrimaryButton';
import { useOnboarding } from '../../../onboarding/OnboardingContext';

interface StylePreferencesScreenProps {
  onContinue: () => void;
}

const stylesList = [
  'Casual',
  'Minimal',
  'Streetwear',
  'Formal',
  'Smart Casual',
  'Sporty',
  'Vintage',
  'Classic',
  'Trendy',
  'Elegant',
];

const colors = [
  'Black',
  'White',
  'Beige',
  'Brown',
  'Grey',
  'Blue',
  'Pink',
  'Red',
  'Green',
  'Purple',
];

export default function StylePreferencesScreen({
  onContinue,
}: StylePreferencesScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();

  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    preferences.preferredStyles
  );

  const [selectedColors, setSelectedColors] = useState<string[]>(
    preferences.preferredColors
  );

  const toggleItem = (
    item: string,
    selectedItems: string[],
    setSelectedItems: (items: string[]) => void
  ) => {
    setSelectedItems(
      selectedItems.includes(item)
        ? selectedItems.filter((current) => current !== item)
        : [...selectedItems, item]
    );
  };

  const handleContinue = () => {
    updatePreferences({
      preferredStyles: selectedStyles,
      preferredColors: selectedColors,
    });

    onContinue();
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        step={2}
        title="What's your style?"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          Your style
        </Text>

        <View style={styles.options}>
          {stylesList.map((style) => (
            <PreferenceChip
              key={style}
              label={style}
              selected={selectedStyles.includes(style)}
              onPress={() =>
                toggleItem(
                  style,
                  selectedStyles,
                  setSelectedStyles
                )
              }
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>
          Favorite colors
        </Text>

        <View style={styles.options}>
          {colors.map((color) => (
            <PreferenceChip
              key={color}
              label={color}
              selected={selectedColors.includes(color)}
              onPress={() =>
                toggleItem(
                  color,
                  selectedColors,
                  setSelectedColors
                )
              }
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 54,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingBottom: 24,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 12,
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },

  bottom: {
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
});