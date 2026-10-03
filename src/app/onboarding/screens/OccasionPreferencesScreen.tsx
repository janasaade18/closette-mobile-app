import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import { Colors } from '../../../constants/theme';
import OnboardingHeader from '../../../onboarding/components/OnboardingHeader';
import PreferenceChip from '../../../onboarding/components/PreferenceChip';
import PrimaryButton from '../../../onboarding/components/PrimaryButton';
import { useOnboarding } from '../../../onboarding/OnboardingContext';

interface OccasionPreferencesScreenProps {
  onContinue: () => void;
}

const occasions = [
  'Everyday / Casual',
  'University / School',
  'Work',
  'Business',
  'Formal Events',
  'Dates',
  'Parties',
  'Sport / Gym',
  'Travel',
];

export default function OccasionPreferencesScreen({
  onContinue,
}: OccasionPreferencesScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();

  const [selectedOccasions, setSelectedOccasions] =
    useState<string[]>(
      preferences.commonOccasions
    );

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions((current) =>
      current.includes(occasion)
        ? current.filter((item) => item !== occasion)
        : [...current, occasion]
    );
  };

  const handleContinue = () => {
    updatePreferences({
      commonOccasions: selectedOccasions,
    });

    onContinue();
  };

  return (
    <View style={styles.container}>
      <OnboardingHeader
        step={3}
        title="Where do you usually dress for?"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.options}>
          {occasions.map((occasion) => (
            <PreferenceChip
              key={occasion}
              label={occasion}
              selected={selectedOccasions.includes(occasion)}
              onPress={() => toggleOccasion(occasion)}
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
    backgroundColor: Colors.light.background,
    paddingHorizontal: 24,
    paddingTop: 54,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingBottom: 24,
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  bottom: {
    paddingTop: 12,
    backgroundColor: Colors.light.background,
  },
});