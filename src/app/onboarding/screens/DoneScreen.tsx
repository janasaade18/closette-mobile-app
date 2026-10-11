import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typeface } from '../../../constants/theme';
import PrimaryButton from '../../../onboarding/components/PrimaryButton';

interface DoneScreenProps {
  onOpenCloset: () => void;
}

export default function DoneScreen({ onOpenCloset }: DoneScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobRight]} />
      <View style={[styles.blob, styles.blobLeft]} />

      <View style={styles.hero}>
        <View style={styles.check}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.title}>You're all set</Text>
        <Text style={styles.body}>
          Add your first piece and let{'\n'}Closette start styling.
        </Text>
      </View>

      <PrimaryButton title="Open my closet" onPress={onOpenCloset} tone="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.light.navySoft,
  },
  blobTop: {
    width: 160,
    height: 160,
    top: -30,
    left: -20,
  },
  blobRight: {
    width: 120,
    height: 120,
    top: '28%',
    right: -30,
  },
  blobLeft: {
    width: 28,
    height: 28,
    backgroundColor: Colors.light.bubble,
    opacity: 0.4,
    bottom: '32%',
    left: 48,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  checkMark: {
    fontSize: 48,
    color: Colors.light.primary,
    fontFamily: Typeface.display,
  },
  title: {
    fontSize: 32,
    fontFamily: Typeface.display,
    color: Colors.light.onPrimary,
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Typeface.body,
    color: Colors.light.onPrimaryMuted,
    textAlign: 'center',
  },
});
