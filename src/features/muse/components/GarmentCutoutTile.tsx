import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';
import { garmentColorHex } from '@/features/closet/services/closetApi';
import type { ClosetGarment } from '@/features/closet/types';

type GarmentKind = 'shirt' | 'pants' | 'shoe' | 'outer' | 'accessory';

type Props = {
  garment?: ClosetGarment;
  /** Marketplace / remote photo when the piece is not in the closet. */
  imageUrl?: string | null;
  role?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

function roleToKind(role?: string): GarmentKind {
  if (role === 'bottom') return 'pants';
  if (role === 'footwear') return 'shoe';
  if (role === 'outerwear') return 'outer';
  if (role === 'accessory') return 'accessory';
  return 'shirt';
}

function Silhouette({ kind, color }: { kind: GarmentKind; color: string }) {
  if (kind === 'pants') {
    return (
      <View style={styles.pants}>
        <View style={[styles.pantLeg, styles.leftPant, { backgroundColor: color }]} />
        <View style={[styles.pantLeg, styles.rightPant, { backgroundColor: color }]} />
      </View>
    );
  }
  if (kind === 'shoe') {
    return (
      <View style={styles.shoe}>
        <View style={[styles.shoeTop, { backgroundColor: color }]} />
        <View style={styles.shoeSole} />
      </View>
    );
  }
  if (kind === 'outer') {
    return (
      <View style={[styles.outer, { backgroundColor: color }]}>
        <View style={styles.outerLapels} />
      </View>
    );
  }
  if (kind === 'accessory') {
    return <View style={[styles.accessory, { backgroundColor: color }]} />;
  }
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

/** Soft matte + padded contain so cutouts / shop photos read as product tiles. */
export function GarmentCutoutTile({
  garment,
  imageUrl,
  role,
  background = Colors.light.softBlue,
  style,
  compact = false,
}: Props) {
  const color = garment ? garmentColorHex(garment) : Colors.light.primary;
  const kind = roleToKind(role);
  const photo = imageUrl?.trim() || garment?.cutout_url || null;

  return (
    <View style={[styles.tile, { backgroundColor: background }, style]}>
      <View style={[styles.matte, compact && styles.matteCompact, photo ? styles.mattePhoto : null]}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.cutout}
            resizeMode={imageUrl && !garment?.cutout_url ? 'cover' : 'contain'}
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
  mattePhoto: {
    width: '100%',
    height: '100%',
    padding: 0,
    borderRadius: 25,
    backgroundColor: 'transparent',
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
  outer: {
    width: 48,
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    paddingTop: 8,
  },
  outerLapels: {
    width: 18,
    height: 22,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  accessory: {
    width: 34,
    height: 34,
    borderRadius: 10,
  },
});
