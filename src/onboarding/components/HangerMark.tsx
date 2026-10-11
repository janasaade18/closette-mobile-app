import { StyleSheet, View } from 'react-native';

import { Colors } from '../../constants/theme';

export default function HangerMark({
  color = Colors.light.primary,
  size = 72,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <View style={[styles.wrap, { width: size, height: size * 0.72 }]}>
      <View
        style={[
          styles.hook,
          {
            borderColor: color,
            width: size * 0.16,
            height: size * 0.16,
          },
        ]}
      />
      <View
        style={[
          styles.neck,
          { backgroundColor: color, height: size * 0.12 },
        ]}
      />
      <View style={styles.arms}>
        <View
          style={[
            styles.arm,
            {
              backgroundColor: color,
              width: size * 0.42,
              transform: [{ rotate: '-18deg' }],
            },
          ]}
        />
        <View
          style={[
            styles.arm,
            {
              backgroundColor: color,
              width: size * 0.42,
              transform: [{ rotate: '18deg' }],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  hook: {
    borderWidth: 2.5,
    borderRadius: 99,
    borderBottomWidth: 0,
  },
  neck: {
    width: 2.5,
  },
  arms: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -2,
  },
  arm: {
    height: 2.5,
    borderRadius: 2,
  },
});
