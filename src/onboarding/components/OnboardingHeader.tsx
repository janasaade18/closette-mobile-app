import { StyleSheet, Text, View } from 'react-native';

interface OnboardingHeaderProps {
  step: string;
  title: string;
  subtitle: string;
}

export default function OnboardingHeader({
  step,
  title,
  subtitle,
}: OnboardingHeaderProps) {
  return (
    <View>
      <Text style={styles.step}>{step}</Text>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  step: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666666',
    marginBottom: 24,
  },
});