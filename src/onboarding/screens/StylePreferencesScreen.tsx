import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
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

export default function StylePreferencesScreen({
  onContinue,
  onBack,
}: StylePreferencesScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    preferences.preferredStyles,
  );

  const toggleStyle = (style: string) => {
    setSelectedStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style],
    );
  };

  const handleContinue = () => {
    updatePreferences({ preferredStyles: selectedStyles });
    onContinue();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingHeader
        step={2}
        title="What's your style?"
        subtitle="Pick a few vibes. Closette will lean toward them when it builds outfits."
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.options}>
          {stylesList.map((style) => (
            <PreferenceChip
              key={style}
              label={style}
              selected={selectedStyles.includes(style)}
              onPress={() => toggleStyle(style)}
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
