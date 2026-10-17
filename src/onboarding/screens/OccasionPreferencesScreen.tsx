import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '@/constants/theme';
import OnboardingHeader from '@/onboarding/components/OnboardingHeader';
import PreferenceChip from '@/onboarding/components/PreferenceChip';
import PrimaryButton from '@/onboarding/components/PrimaryButton';
import { useOnboarding } from '@/onboarding/OnboardingContext';

interface OccasionPreferencesScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

const occasions = ['Work', 'Uni', 'Going out', 'Gym', 'Events', 'Travel'];

export default function OccasionPreferencesScreen({
  onContinue,
  onBack,
}: OccasionPreferencesScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>(
    preferences.commonOccasions,
  );
  const [weatherAware, setWeatherAware] = useState(
    preferences.weatherAware ?? false,
  );

  const toggleOccasion = (occasion: string) => {
    setSelectedOccasions((current) =>
      current.includes(occasion)
        ? current.filter((item) => item !== occasion)
        : [...current, occasion],
    );
  };

  const handleContinue = () => {
    updatePreferences({
      commonOccasions: selectedOccasions,
      weatherAware,
    });
    onContinue();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingHeader
        step={4}
        title="Where do you dress for?"
        subtitle="Choose your usual occasions so suggestions match your week."
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
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

        <View style={styles.card}>
          <View style={styles.cardCopy}>
            <Text style={styles.cardTitle}>Weather-aware</Text>
            <Text style={styles.cardBody}>Use my location for outfits</Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: weatherAware }}
            onPress={() => setWeatherAware((current) => !current)}
            style={[styles.switchTrack, weatherAware && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, weatherAware && styles.switchThumbOn]} />
          </Pressable>
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
    paddingTop: 8,
    paddingBottom: 24,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    marginTop: 28,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardCopy: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    marginBottom: 2,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.border,
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: Colors.light.primary,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.onPrimary,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
});
