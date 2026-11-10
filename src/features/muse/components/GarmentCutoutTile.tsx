import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';
import {
  garmentColorHex,
} from '@/features/closet/services/closetApi';
import type { ClosetGarment } from '@/features/closet/types';

type GarmentKind = 'shirt' | 'pants' | 'shoe';

type Props = {
  garment?: ClosetGarment;
  role?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

function roleToKind(role?: string): GarmentKind {
  if (role === 'bottom') return 'pants';
  if (role === 'footwear') return 'shoe';
  return 'shirt';
}

function Silhouette({ kind, color }: { kind: GarmentKind; color: string }) {
  if (kind === 'shirt') {
    return (
      <View style={styles.shirtWrap}>
        <View style={[styles.sleeve, styles.leftSleeve, { backgroundColor: color }]} />
        <View style={[styles.sleeve, styles.rightSleeve, { backgroundColor: color }]} />
        <View style={[styles.shirtBody, { backgroundColor: color }]}>
          <View style={styles.shirtNeck} />
        </View>
      </View>
    );
  }
  if (kind === 'pants') {
    return (
      <View style={styles.pants}>
        <View style={[styles.pantLeg, styles.leftPant, { backgroundColor: color }]} />
        <View style={[styles.pantLeg, styles.rightPant, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.shoe}>
      <View style={[styles.shoeTop, { backgroundColor: color }]} />
      <View style={styles.shoeSole} />
    </View>
  );
}

/** Soft matte + padded contain so cutouts read as product tiles, not raw crops. */
export function GarmentCutoutTile({
  garment,
  role,
  background = Colors.light.softBlue,
  style,
  compact = false,
}: Props) {
  const color = garment ? garmentColorHex(garment) : Colors.light.primary;
  const kind = roleToKind(role);

  return (
    <View style={[styles.tile, { backgroundColor: background }, style]}>
      <View style={[styles.matte, compact && styles.matteCompact]}>
        {garment?.cutout_url ? (
          <Image
            source={{ uri: garment.cutout_url }}
            style={styles.cutout}
            resizeMode="contain"
          />
        ) : (
          <Silhouette kind={kind} color={color} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  matte: {
    width: '86%',
    height: '86%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    padding: 8,
  },
  matteCompact: {
    width: '90%',
    height: '90%',
    padding: 4,
    borderRadius: 14,
  },
  cutout: {
    width: '100%',
    height: '100%',
  },
  shirtWrap: { width: 65, height: 60, alignItems: 'center', justifyContent: 'center' },
  sleeve: { position: 'absolute', top: 8, width: 22, height: 23, borderRadius: 4 },
  leftSleeve: { left: 1, transform: [{ rotate: '-28deg' }] },
  rightSleeve: { right: 1, transform: [{ rotate: '28deg' }] },
  shirtBody: {
    width: 38,
    height: 47,
    borderRadius: 4,
    marginTop: 13,
    alignItems: 'center',
  },
  shirtNeck: {
    width: 15,
    height: 8,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: Colors.light.softBlue,
  },
  pants: { width: 30, height: 44, flexDirection: 'row', gap: 2 },
  pantLeg: { width: 12, height: 42, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  leftPant: { transform: [{ rotate: '-2deg' }] },
  rightPant: { transform: [{ rotate: '2deg' }] },
  shoe: { width: 50, height: 23, justifyContent: 'flex-end' },
  shoeTop: {
    position: 'absolute',
    width: 41,
    height: 14,
    left: 3,
    bottom: 5,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 5,
    transform: [{ skewX: '-18deg' }],
  },
  shoeSole: {
    width: 49,
    height: 5,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
});
