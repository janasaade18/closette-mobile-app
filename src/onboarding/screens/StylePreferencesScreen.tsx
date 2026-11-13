import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '@/constants/theme';
import OnboardingHeader from '@/onboarding/components/OnboardingHeader';
import PreferenceChip from '@/onboarding/components/PreferenceChip';
import PrimaryButton from '@/onboarding/components/PrimaryButton';
import { useOnboarding } from '@/onboarding/OnboardingContext';

interface StylePreferencesScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

const stylesList = [
  'Minimal',
  'Streetwear',
  'Smart casual',
  'Sporty',
  'Classic',
  'Boho',
  'Y2K',
  'Modest',
  'Elegant',
  'Vintage',
];

const clothingList = [
  't-shirt',
  'shirt',
  'blouse',
  'sweater',
  'hoodie',
  'jeans',
  'trousers',
  'skirt',
  'dress',
  'jacket',
  'coat',
  'sneakers',
  'boots',
  'heels',
];

const colorList = [
  'black',
  'white',
  'navy',
  'beige',
  'grey',
  'brown',
  'olive',
  'blue',
  'cream',
];

export default function StylePreferencesScreen({
  onContinue,
  onBack,
}: StylePreferencesScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    preferences.preferredStyles,
  );
  const [selectedClothing, setSelectedClothing] = useState<string[]>(
    preferences.preferredClothing ?? [],
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    (preferences.preferredColors ?? []).filter((c) => !c.startsWith('#')),
  );

  const toggle = (value: string, current: string[], setCurrent: (next: string[]) => void) => {
    setCurrent(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleContinue = () => {
    updatePreferences({
      preferredStyles: selectedStyles,
      preferredClothing: selectedClothing,
      preferredColors: selectedColors.length
        ? selectedColors
        : preferences.preferredColors,
    });
    onContinue();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingHeader
        step={2}
        title="What's your style?"
        subtitle="Muse remembers these tastes and leans into them for closet + shop looks."
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>Vibes</Text>
        <View style={styles.options}>
          {stylesList.map((style) => (
            <PreferenceChip
              key={style}
              label={style}
              selected={selectedStyles.includes(style)}
              onPress={() => toggle(style, selectedStyles, setSelectedStyles)}
            />
          ))}
        </View>

        <Text style={styles.section}>Pieces you love</Text>
        <View style={styles.options}>
          {clothingList.map((item) => (
            <PreferenceChip
              key={item}
              label={item}
              selected={selectedClothing.includes(item)}
              onPress={() => toggle(item, selectedClothing, setSelectedClothing)}
            />
          ))}
        </View>

        <Text style={styles.section}>Favorite colors</Text>
        <View style={styles.options}>
          {colorList.map((color) => (
            <PreferenceChip
              key={color}
              label={color}
              selected={selectedColors.includes(color)}
              onPress={() => toggle(color, selectedColors, setSelectedColors)}
            />
          ))}
        </View>
      </ScrollView>

      <PrimaryButton title="Continue" onPress={handleContinue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvas,
    paddingHorizontal: 24,
    paddingTop: 54,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    marginTop: 18,
    marginBottom: 10,
    fontFamily: Typeface.bodyStrong,
    fontSize: 14,
    color: Colors.light.primary,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
