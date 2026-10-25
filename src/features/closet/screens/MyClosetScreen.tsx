import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, PageGutter, Typeface } from '@/constants/theme';

type GarmentCategory = 'Top' | 'Bottom' | 'Shoes' | 'Outer';
type GarmentKind = 'shirt' | 'pants' | 'shoe';
type ClosetPiece = { name: string; colorName: string; color: string; tile: string; category: GarmentCategory; kind: GarmentKind };

const palette = [
  { name: 'Navy', color: Colors.light.navySwatch },
  { name: 'Olive', color: Colors.light.olive },
  { name: 'Sand', color: Colors.light.sand },
  { name: 'Rust', color: Colors.light.rust },
  { name: 'Blue', color: Colors.light.bubble },
  { name: 'Rose', color: Colors.light.rose },
  { name: 'White', color: Colors.light.onPrimary },
];
const pieces: ClosetPiece[] = [
  { name: 'Linen tee', colorName: 'Navy', color: Colors.light.navySwatch, tile: Colors.light.softBlue, category: 'Top', kind: 'shirt' },
  { name: 'Wide trousers', colorName: 'Olive', color: Colors.light.olive, tile: Colors.light.oliveTile, category: 'Bottom', kind: 'pants' },
  { name: 'Sneakers', colorName: 'Sand', color: Colors.light.sand, tile: Colors.light.sandTile, category: 'Shoes', kind: 'shoe' },
  { name: 'Knit top', colorName: 'Rust', color: Colors.light.rust, tile: Colors.light.rustTile, category: 'Top', kind: 'shirt' },
];
const categories: { label: string; value: GarmentCategory }[] = [
  { label: 'Tops', value: 'Top' },
  { label: 'Bottoms', value: 'Bottom' },
  { label: 'Shoes', value: 'Shoes' },
  { label: 'Outer', value: 'Outer' },
];

function GarmentIllustration({ kind, color, background }: { kind: GarmentKind; color: string; background: string }) {
  if (kind === 'shirt') {
    return <View style={styles.shirt}>
      <View style={[styles.sleeve, styles.leftSleeve, { backgroundColor: color }]} />
      <View style={[styles.sleeve, styles.rightSleeve, { backgroundColor: color }]} />
      <View style={[styles.shirtBody, { backgroundColor: color }]}><View style={[styles.neck, { backgroundColor: background }]} /></View>
    </View>;
  }
  if (kind === 'pants') {
    return <View style={styles.pants}>
      <View style={[styles.waist, { backgroundColor: color }]} />
      <View style={[styles.leftLeg, { backgroundColor: color }]} />
      <View style={[styles.rightLeg, { backgroundColor: color }]} />
    </View>;
  }
  return <View style={styles.shoe}><View style={[styles.shoeUpper, { backgroundColor: color }]} /><View style={styles.shoeSole} /></View>;
}

export default function MyClosetScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const visiblePieces = useMemo(() => pieces.filter((piece) =>
    (!selectedCategory || piece.category === selectedCategory) && (!selectedColor || piece.colorName === selectedColor),
  ), [selectedCategory, selectedColor]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <View pointerEvents="none" style={styles.bottomOrb} />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>My closet</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Filter closet" onPress={() => Alert.alert('Filter closet', 'Choose a colour or category to filter your closet.')} style={styles.filterButton}>
              <SymbolView name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }} tintColor={Colors.light.primary} size={23} />
            </Pressable>
          </View>
          <View style={styles.paletteHeader}><Text style={styles.label}>Your palette</Text><Text style={styles.label}>6 colours</Text></View>
          <View style={styles.paletteBar}>{palette.slice(0, 6).map((color) => <View key={color.name} style={{ flex: color.name === 'Navy' ? 1.65 : 1, backgroundColor: color.color }} />)}</View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatches}>
            <Pressable onPress={() => setSelectedColor(null)} style={[styles.allSwatch, !selectedColor && styles.selectedAll]}><Text style={[styles.allText, !selectedColor && styles.selectedAllText]}>All</Text></Pressable>
            {palette.map((swatch) => <Pressable key={swatch.name} accessibilityRole="button" accessibilityLabel={`${swatch.name} colour`} accessibilityState={{ selected: selectedColor === swatch.name }} onPress={() => setSelectedColor(selectedColor === swatch.name ? null : swatch.name)} style={[styles.swatch, { backgroundColor: swatch.color }, selectedColor === swatch.name && styles.selectedSwatch, swatch.name === 'White' && styles.whiteSwatch]} />)}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {categories.map((category) => <Pressable key={category.value} onPress={() => setSelectedCategory(selectedCategory === category.value ? null : category.value)} style={[styles.categoryChip, selectedCategory === category.value && styles.selectedCategory]}><Text style={[styles.categoryText, selectedCategory === category.value && styles.selectedCategoryText]}>{category.label}</Text></Pressable>)}
          </ScrollView>
          <View style={styles.grid}>
            {visiblePieces.map((piece) => <View key={piece.name} style={styles.card}>
              <View style={[styles.garmentTile, { backgroundColor: piece.tile }]}>
                <GarmentIllustration kind={piece.kind} color={piece.color} background={piece.tile} />
                <View style={[styles.colorDot, { backgroundColor: piece.color }]} />
              </View>
              <Text style={styles.pieceName}>{piece.name}</Text>
              <View style={styles.pieceDetails}><View style={[styles.detailDot, { backgroundColor: piece.color }]} /><Text style={styles.detailText}>{piece.colorName} {'\u00B7'} {piece.category}</Text></View>
            </View>)}
          </View>
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel="Add clothing item" onPress={() => Alert.alert('Add item', 'Use Add item on the Home screen to add a piece.')} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Text style={styles.addText}>+</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas }, screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  scrollView: { flex: 1 }, content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 148 },
  topOrb: { position: 'absolute', width: 152, height: 152, borderRadius: 76, right: -68, top: -92, backgroundColor: Colors.light.warmOrb },
  bottomOrb: { position: 'absolute', width: 268, height: 268, borderRadius: 134, left: -112, top: 520, backgroundColor: Colors.light.coolOrb },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 17 },
  title: { fontSize: 34, lineHeight: 42, fontFamily: Typeface.display, color: Colors.light.primary },
  filterButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.light.backgroundElement, alignItems: 'center', justifyContent: 'center' },
  paletteHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: Colors.light.textSecondary, fontSize: 13, fontFamily: Typeface.bodyStrong },
  paletteBar: { height: 13, overflow: 'hidden', flexDirection: 'row', borderRadius: 8, marginBottom: 15 },
  swatches: { alignItems: 'center', gap: 10, paddingRight: 8, marginBottom: 15 },
  allSwatch: { height: 44, minWidth: 62, borderWidth: 2, borderColor: Colors.light.softBlue, borderRadius: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 17 },
  selectedAll: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, allText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 15 }, selectedAllText: { color: Colors.light.onPrimary },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' }, selectedSwatch: { borderColor: Colors.light.primary, transform: [{ scale: 1.12 }] }, whiteSwatch: { borderColor: Colors.light.softBlue },
  categories: { gap: 9, paddingRight: 10, marginBottom: 15 },
  categoryChip: { height: 42, paddingHorizontal: 19, borderRadius: 22, backgroundColor: Colors.light.backgroundElement, borderWidth: 2, borderColor: Colors.light.softBlue, alignItems: 'center', justifyContent: 'center' },
  selectedCategory: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, categoryText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 15 }, selectedCategoryText: { color: Colors.light.onPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  card: { width: '48.2%', backgroundColor: Colors.light.backgroundElement, borderRadius: 30, padding: 12, paddingBottom: 13 },
  garmentTile: { height: 108, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  colorDot: { position: 'absolute', top: 6, right: 6, width: 27, height: 27, borderRadius: 14, borderWidth: 3, borderColor: Colors.light.onPrimary },
  pieceName: { color: Colors.light.primary, fontSize: 16, lineHeight: 21, fontFamily: Typeface.display },
  pieceDetails: { flexDirection: 'row', alignItems: 'center', gap: 5 }, detailDot: { width: 11, height: 11, borderRadius: 6 }, detailText: { color: Colors.light.textSecondary, fontSize: 13, fontFamily: Typeface.body },
  shirt: { width: 60, height: 58, alignItems: 'center', justifyContent: 'center' }, shirtBody: { position: 'absolute', width: 39, height: 47, borderRadius: 3, top: 8 }, neck: { position: 'absolute', top: -1, alignSelf: 'center', width: 16, height: 9, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 }, sleeve: { position: 'absolute', width: 19, height: 22, top: 5, borderRadius: 4 }, leftSleeve: { left: 1, transform: [{ rotate: '32deg' }] }, rightSleeve: { right: 1, transform: [{ rotate: '-32deg' }] },
  pants: { width: 46, height: 66 }, waist: { height: 10, width: 38, alignSelf: 'center', borderTopLeftRadius: 4, borderTopRightRadius: 4 }, leftLeg: { position: 'absolute', top: 8, left: 3, height: 57, width: 18, borderBottomLeftRadius: 4, transform: [{ skewY: '-4deg' }] }, rightLeg: { position: 'absolute', top: 8, right: 3, height: 57, width: 18, borderBottomRightRadius: 4, transform: [{ skewY: '4deg' }] },
  shoe: { width: 64, height: 40, justifyContent: 'flex-end', alignItems: 'center' }, shoeUpper: { width: 60, height: 20, borderTopLeftRadius: 15, borderTopRightRadius: 5, borderBottomLeftRadius: 4, transform: [{ skewX: '-13deg' }], marginBottom: 2 }, shoeSole: { width: 64, height: 6, backgroundColor: Colors.light.shoeSole, borderRadius: 5 },
  addButton: { position: 'absolute', right: 24, bottom: 104, width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.light.sand, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.light.shadow, shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 7 },
  addText: { color: Colors.light.primary, fontSize: 40, lineHeight: 44, fontFamily: Typeface.displayMedium }, pressed: { opacity: 0.8 },
});
