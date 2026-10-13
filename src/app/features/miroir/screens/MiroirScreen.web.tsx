import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

export default function MiroirScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Miroir</Text>
      <Text style={styles.body}>
        Foot capture uses the phone camera. Open this screen on a device build.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
