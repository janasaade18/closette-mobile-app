import { StyleSheet, View } from 'react-native';

import type { ShopProduct } from '@/features/shop/data/products';
import { Colors } from '@/constants/theme';

export default function ShopProductIllustration({ item, large = false }: { item: ShopProduct; large?: boolean }) {
  if (item.kind === 'shoe') return <View style={[styles.shoe, large && styles.largeShoe]}><View style={[styles.shoeUpper, { backgroundColor: item.tone }]} /><View style={styles.shoeSole} /></View>;
  if (item.kind === 'shirt') return <View style={[styles.shirt, { backgroundColor: item.tone }]}><View style={styles.shirtNeck} /></View>;
  if (item.kind === 'pants') return <View style={styles.pants}><View style={[styles.pantLeg, { backgroundColor: item.tone }]} /><View style={[styles.pantLeg, { backgroundColor: item.tone }]} /></View>;
  return <View style={[styles.bag, large && styles.largeBag, { backgroundColor: item.tone }]}><View style={styles.bagHandle} /></View>;
}

const styles = StyleSheet.create({
  shoe: { width: 105, height: 43, justifyContent: 'flex-end' }, largeShoe: { width: 145, height: 58 },
  shoeUpper: { position: 'absolute', bottom: 7, left: 8, width: '88%', height: 28, borderTopLeftRadius: 25, borderTopRightRadius: 13, transform: [{ skewX: '-17deg' }] },
  shoeSole: { width: '100%', height: 7, borderRadius: 5, backgroundColor: Colors.light.primary },
  shirt: { width: 44, height: 49, borderRadius: 5, alignItems: 'center' }, shirtNeck: { width: 16, height: 8, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, backgroundColor: Colors.light.backgroundElement },
  pants: { flexDirection: 'row', gap: 3, height: 49 }, pantLeg: { width: 18, height: 46, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  bag: { width: 42, height: 42, borderRadius: 8, marginTop: 7 }, largeBag: { width: 95, height: 78, borderRadius: 15 },
  bagHandle: { position: 'absolute', width: 22, height: 14, borderWidth: 3, borderColor: Colors.light.primary, borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignSelf: 'center', top: -10 },
});
