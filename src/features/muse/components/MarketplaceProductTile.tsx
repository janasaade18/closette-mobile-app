import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Typeface } from '@/constants/theme';
import type { MarketplaceProduct } from '@/features/muse/data/marketplaceCatalog';

type Props = {
  product: MarketplaceProduct;
  badge?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function MarketplaceProductTile({
  product,
  badge,
  onPress,
  style,
  compact = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.tile, compact && styles.tileCompact, style]}>
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        {!product.in_stock ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.brand} numberOfLines={1}>
        {product.brand}
      </Text>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.price}>${product.price}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 148,
  },
  tileCompact: {
    width: 118,
  },
  imageWrap: {
    height: 168,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Colors.light.softBlue,
  },
  imageWrapCompact: {
    height: 132,
    borderRadius: 18,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    left: 10,
    top: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  badgeText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 11,
  },
  soldOut: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(18, 38, 63, 0.45)',
  },
  soldOutText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 13,
  },
  brand: {
    marginTop: 8,
    fontFamily: Typeface.body,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  name: {
    marginTop: 2,
    fontFamily: Typeface.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.light.primary,
  },
  price: {
    marginTop: 4,
    fontFamily: Typeface.body,
    fontSize: 14,
    color: Colors.light.primary,
  },
});
