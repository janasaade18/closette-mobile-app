import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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

  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
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
      <View>
        <OnboardingHeader
          step="03 / 04"
          title="Where do you usually dress for?"
          subtitle="Select the occasions you would like Closette to consider when recommending outfits."
        />

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
      </View>

      <PrimaryButton
        title="Continue"
        onPress={handleContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'space-between',
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});