import { StyleSheet, Text, View } from 'react-native';

interface OnboardingHeaderProps {
  step: number;
  title: string;
}

export default function OnboardingHeader({
  step,
  title,
}: OnboardingHeaderProps) {
  const progress = `${step} / 4`;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>CLOSETTE</Text>

        <Text style={styles.progress}>
          {progress}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${(step / 4) * 100}%` },
          ]}
        />
      </View>

      <Text style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  brand: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#111111',
  },

  progress: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
    letterSpacing: 1,
  },

  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: '#EEEEEE',
    borderRadius: 2,
    marginBottom: 30,
  },

  progressFill: {
    height: 3,
    backgroundColor: '#111111',
    borderRadius: 2,
  },

  title: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 26,
  },
});