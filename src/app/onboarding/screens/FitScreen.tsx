import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Typeface } from '../../../constants/theme';
import OnboardingHeader from '../../../onboarding/components/OnboardingHeader';
import PreferenceChip from '../../../onboarding/components/PreferenceChip';
import PrimaryButton from '../../../onboarding/components/PrimaryButton';
import { useOnboarding } from '../../../onboarding/OnboardingContext';

interface FitScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

const sizes = ['XS', 'S', 'M', 'L', 'XL'];

export default function FitScreen({ onContinue, onBack }: FitScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();
  const [heightCm, setHeightCm] = useState(preferences.heightCm ?? '');
  const [topSize, setTopSize] = useState(preferences.topSize ?? '');
  const [bottomSize, setBottomSize] = useState(preferences.bottomSize ?? '');

  const handleContinue = () => {
    updatePreferences({ heightCm, topSize, bottomSize });
    onContinue();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingHeader
        step={3}
        title="Your fit"
        subtitle="This sizes your AR try-on so clothes sit on you the way they would in real life."
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="170"
          placeholderTextColor={Colors.light.textSecondary}
          keyboardType="number-pad"
          value={heightCm}
          onChangeText={setHeightCm}
        />

        <Text style={styles.label}>Top size</Text>
        <View style={styles.row}>
          {sizes.map((size) => (
            <PreferenceChip
              key={`top-${size}`}
              label={size}
              shape="circle"
              selected={topSize === size}
              onPress={() => setTopSize(size)}
            />
          ))}
        </View>

        <Text style={styles.label}>Bottom size</Text>
        <View style={styles.row}>
          {sizes.map((size) => (
            <PreferenceChip
              key={`bottom-${size}`}
              label={size}
              shape="circle"
              selected={bottomSize === size}
              onPress={() => setBottomSize(size)}
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
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    marginBottom: 10,
    marginTop: 18,
  },
  input: {
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: Typeface.body,
    color: Colors.light.text,
    backgroundColor: Colors.light.backgroundElement,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
