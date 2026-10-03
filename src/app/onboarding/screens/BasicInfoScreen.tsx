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
      <OnboardingHeader
        step={1}
        title="Tell us a little about you"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>
          Name or nickname
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor="#A0A0A0"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>
          Age range
        </Text>

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

        <Text style={styles.label}>
          Gender
        </Text>

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

        <Text style={styles.label}>
          Country / location
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. Lebanon"
          placeholderTextColor="#A0A0A0"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>
          Measuring units
        </Text>

        <View style={styles.options}>
          {[
            'Metric (cm / kg)',
            'Imperial (in / lb)',
          ].map((option) => (
            <PreferenceChip
              key={option}
              label={option}
              selected={preferredUnits === option}
              onPress={() => setPreferredUnits(option)}
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

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 10,
    marginTop: 24,
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FAFAFA',
  },

  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  bottom: {
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
});