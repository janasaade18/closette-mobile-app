import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '../constants/theme';
import PrimaryButton from '../onboarding/components/PrimaryButton';
import { useOnboarding } from '../onboarding/OnboardingContext';

interface ClosetHomeScreenProps {
  onAddPiece: () => void;
}

export default function ClosetHomeScreen({ onAddPiece }: ClosetHomeScreenProps) {
  const { preferences } = useOnboarding();
  const name = preferences.name?.trim();

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>closette</Text>
      <Text style={styles.title}>{name ? `Hi, ${name}` : 'Your closet'}</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nothing here yet</Text>
        <Text style={styles.cardBody}>
          Add your first piece and Closette will start styling around
          {preferences.location ? ` ${preferences.location}` : ' your week'}.
        </Text>
        <PrimaryButton title="Add a piece" onPress={onAddPiece} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a piece"
        onPress={onAddPiece}
        style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvas,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  kicker: {
    fontSize: 16,
    fontFamily: Typeface.display,
    color: Colors.light.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 20,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Typeface.display,
    color: Colors.light.text,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    marginBottom: 18,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.light.onPrimary,
    fontSize: 36,
    lineHeight: 40,
    fontFamily: Typeface.display,
  },
});
