import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '@/constants/theme';
import OnboardingHeader from '@/onboarding/components/OnboardingHeader';
import PrimaryButton from '@/onboarding/components/PrimaryButton';
import { useOnboarding } from '@/onboarding/OnboardingContext';

interface AccentScreenProps {
  onContinue: () => void;
  onBack?: () => void;
}

const accents = [
  { id: 'navy', color: Colors.light.primary },
  { id: 'slate', color: Colors.light.slate },
  { id: 'sand', color: Colors.light.sand },
  { id: 'mist', color: Colors.light.bubble },
];

const extras = [
  Colors.light.accentCharcoal,
  Colors.light.accentForest,
  Colors.light.accentTerracotta,
  Colors.light.accentPlum,
  Colors.light.accentRose,
  Colors.light.accentAmber,
];

export default function AccentScreen({ onContinue, onBack }: AccentScreenProps) {
  const { preferences, updatePreferences } = useOnboarding();
  const [accentColor, setAccentColor] = useState(
    preferences.accentColor ?? Colors.light.primary,
  );
  const [showCustomColors, setShowCustomColors] = useState(false);

  const handleContinue = () => {
    updatePreferences({
      accentColor,
      preferredColors: [accentColor],
    });
    onContinue();
  };

  const greeting = preferences.name?.trim()
    ? `Good morning, ${preferences.name.trim()}`
    : 'Good morning';
  const lightAccent =
    accentColor === Colors.light.sand || accentColor === Colors.light.bubble;
  const previewText = lightAccent ? Colors.light.primary : Colors.light.onPrimary;
  const previewMuted = lightAccent
    ? Colors.light.textSecondary
    : Colors.light.onPrimaryMuted;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <OnboardingHeader
        step={5}
        title="Make it yours"
        subtitle="Choose an accent colour. You can change it anytime in settings."
        onBack={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.dots}>
          {accents.map((accent) => {
            const selected = accentColor === accent.color;
            return (
              <Pressable
                key={accent.id}
                onPress={() => setAccentColor(accent.color)}
                style={[styles.ring, selected && styles.ringSelected]}>
                <View style={[styles.dot, { backgroundColor: accent.color }]} />
              </Pressable>
            );
          })}
          {showCustomColors && extras.map((color) => {
            const selected = accentColor === color;
            return (
              <Pressable
                key={color}
                onPress={() => setAccentColor(color)}
                style={[styles.ring, selected && styles.ringSelected]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
              </Pressable>
            );
          })}
          <Pressable
            style={styles.add}
            onPress={() => setShowCustomColors(true)}>
            <Text style={styles.addText}>+</Text>
          </Pressable>
        </View>

        <View style={[styles.preview, { backgroundColor: accentColor }]}>
          <View
            style={[
              styles.previewMark,
              lightAccent && { backgroundColor: Colors.light.primary },
            ]}
          />
          <View>
            <Text style={[styles.previewTitle, { color: previewText }]}>
              {greeting}
            </Text>
            <Text style={[styles.previewBody, { color: previewMuted }]}>
              Your outfit for 18° and rainy weather
            </Text>
          </View>
        </View>

        <View style={styles.reminderRow}>
          <View style={styles.reminder}>
            <Text style={styles.reminderText}>Morning outfit reminder</Text>
          </View>
          <View style={styles.time}>
            <Text style={styles.timeText}>8:00 AM</Text>
          </View>
        </View>
      </ScrollView>

      <PrimaryButton title="Finish setup" onPress={handleContinue} />
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  ring: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ringSelected: {
    borderColor: Colors.light.primary,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  add: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.light.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 20,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
  },
  preview: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  previewMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.onPrimary,
  },
  previewTitle: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontFamily: Typeface.display,
    marginBottom: 4,
  },
  previewBody: {
    color: Colors.light.onPrimaryMuted,
    fontSize: 13,
    fontFamily: Typeface.body,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reminder: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reminderText: {
    color: Colors.light.text,
    fontSize: 14,
    fontFamily: Typeface.body,
  },
  time: {
    backgroundColor: Colors.light.bubble,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  timeText: {
    color: Colors.light.text,
    fontSize: 14,
    fontFamily: Typeface.bodyStrong,
  },
});
