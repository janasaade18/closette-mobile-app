import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import OnboardingHeader from '../../../onboarding/components/OnboardingHeader';
import PreferenceChip from '../../../onboarding/components/PreferenceChip';
import PrimaryButton from '../../../onboarding/components/PrimaryButton';
import { useOnboarding } from '../../../onboarding/OnboardingContext';

interface BasicInfoScreenProps {
  onContinue: () => void;
}

export default function BasicInfoScreen({
  onContinue,
}: BasicInfoScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();

  const [name, setName] = useState(preferences.name ?? '');
  const [ageRange, setAgeRange] = useState(
    preferences.ageRange ?? ''
  );
  const [gender, setGender] = useState(
    preferences.gender ?? ''
  );
  const [location, setLocation] = useState(
    preferences.location ?? ''
  );
  const [preferredUnits, setPreferredUnits] = useState(
    preferences.preferredUnits ?? ''
  );

  const handleContinue = () => {
    updatePreferences({
      name,
      ageRange,
      gender,
      location,
      preferredUnits,
    });

    onContinue();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHeader
          step="01 / 04"
          title="Tell us a little about you"
          subtitle="This helps us personalize your wardrobe recommendations."
        />

        <Text style={styles.label}>Name or nickname</Text>

        <TextInput
          style={styles.input}
          placeholder="Your name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Age range</Text>

        <View style={styles.options}>
          {['Under 18', '18–24', '25–34', '35+'].map(
            (option) => (
              <PreferenceChip
                key={option}
                label={option}
                selected={ageRange === option}
                onPress={() => setAgeRange(option)}
              />
            )
          )}
        </View>

        <Text style={styles.label}>Gender</Text>

        <View style={styles.options}>
          {['Female', 'Male', 'Prefer not to say'].map(
            (option) => (
              <PreferenceChip
                key={option}
                label={option}
                selected={gender === option}
                onPress={() => setGender(option)}
              />
            )
          )}
        </View>

        <Text style={styles.label}>Country / location</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. Lebanon"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Measuring units</Text>

        <View style={styles.options}>
          {['Metric (cm / kg)', 'Imperial (in / lb)'].map(
            (option) => (
              <PreferenceChip
                key={option}
                label={option}
                selected={preferredUnits === option}
                onPress={() => setPreferredUnits(option)}
              />
            )
          )}
        </View>
      </ScrollView>

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
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingBottom: 24,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 18,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});