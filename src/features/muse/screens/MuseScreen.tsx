import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';

type GarmentKind = 'shirt' | 'pants' | 'shoe';

function Garment({ kind, color }: { kind: GarmentKind; color: string }) {
  if (kind === 'shirt') {
    return <View style={styles.shirtWrap}>
      <View style={[styles.sleeve, styles.leftSleeve, { backgroundColor: color }]} />
      <View style={[styles.sleeve, styles.rightSleeve, { backgroundColor: color }]} />
      <View style={[styles.shirtBody, { backgroundColor: color }]}><View style={styles.shirtNeck} /></View>
    </View>;
  }
  if (kind === 'pants') return <View style={styles.pants}><View style={[styles.pantLeg, styles.leftPant, { backgroundColor: color }]} /><View style={[styles.pantLeg, styles.rightPant, { backgroundColor: color }]} /></View>;
  return <View style={styles.shoe}><View style={[styles.shoeTop, { backgroundColor: color }]} /><View style={styles.shoeSole} /></View>;
}

function OutfitTile({ kind, color, background, style }: { kind: GarmentKind; color: string; background: string; style?: object }) {
  return <View style={[styles.outfitTile, { backgroundColor: background }, style]}><Garment kind={kind} color={color} /></View>;
}

export default function MuseScreen() {
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.titleRow}><View><Text style={styles.title}>Muse</Text><Text style={styles.subtitle}>Outfits built from your closet</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Chat with Muse" hitSlop={8} style={styles.chatButton} onPress={() => router.push('/muse-chat')}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={Colors.light.onPrimary} size={21} /><Text style={styles.chatButtonText}>Ask Muse</Text></Pressable></View>
          <View style={styles.filters}>
            <View style={styles.darkChip}><SymbolView name={{ ios: 'umbrella.fill', android: 'umbrella', web: 'umbrella' }} tintColor={Colors.light.onPrimary} size={14} /><Text style={styles.darkChipText}>{'18\u00B0 rain'}</Text></View>
            <Pressable style={styles.darkChip} onPress={() => Alert.alert('Occasion', 'Choose an occasion for your outfit.')}><Text style={styles.darkChipText}>Uni</Text></Pressable>
            <Pressable style={styles.editChip} onPress={() => Alert.alert('Edit outfit', 'Outfit editing is coming soon.')}><Text style={styles.editText}>Edit</Text></Pressable>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.cardHeader}><Text style={styles.outfitTitle}>Rainy-day calm</Text><View style={styles.score}><Text style={styles.scoreText}>92%</Text></View></View>
            <View style={styles.outfitGrid}>
              <OutfitTile kind="shirt" color={Colors.light.primary} background={Colors.light.softBlue} style={styles.mainTile} />
              <View style={styles.sideTiles}>
                <OutfitTile kind="pants" color={Colors.light.blueSlate} background={Colors.light.sand} style={styles.sideTile} />
                <OutfitTile kind="shoe" color={Colors.light.primary} background={Colors.light.softBlue} style={styles.sideTile} />
              </View>
            </View>
            <View style={styles.tags}><View style={styles.tag}><Text style={styles.tagText}>Rain-ready layers</Text></View><View style={styles.tag}><Text style={styles.tagText}>Navy + sand harmony</Text></View></View>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Save outfit" onPress={() => setIsSaved(!isSaved)} style={styles.roundAction}><SymbolView name={{ ios: isSaved ? 'bookmark.fill' : 'bookmark', android: isSaved ? 'bookmark' : 'bookmark_border', web: isSaved ? 'bookmark' : 'bookmark_border' }} tintColor={Colors.light.primary} size={21} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Like outfit" onPress={() => Alert.alert('Muse', 'Outfit added to your favorites.')} style={styles.roundAction}><SymbolView name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} tintColor={Colors.light.primary} size={22} /></Pressable>
              <Pressable style={styles.tryButton} onPress={() => router.push({ pathname: '/miroir', params: { product: 'Sneakers', category: 'Shoes', source: 'closet', returnTo: '/muse' } })}><Text style={styles.tryText}>Try it on</Text></Pressable>
            </View>
          </View>

          <Text style={styles.moreTitle}>More from Muse</Text>
          <View style={styles.suggestions}>
            <Suggestion label="Calm 88%" kind="shirt" color={Colors.light.blueSlate} />
            <Suggestion label="Soft 85%" kind="shirt" color={Colors.light.sand} />
            <Suggestion label="Sharp 81%" kind="shirt" color={Colors.light.primary} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Suggestion({ label, kind, color }: { label: string; kind: GarmentKind; color: string }) {
  return <Pressable style={styles.suggestion} onPress={() => Alert.alert(label, 'This outfit has been selected.')}><View style={styles.suggestionGarment}><Garment kind={kind} color={color} /></View><Text style={styles.suggestionLabel}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 25, paddingBottom: 130 },
  topOrb: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: -38, top: -58, backgroundColor: Colors.light.warmOrb },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatButton: { height: 48, borderRadius: 25, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: Colors.light.primary },
  chatButtonText: { color: Colors.light.onPrimary, fontFamily: Typeface.bodyStrong, fontSize: 14 },
  title: { fontSize: 34, lineHeight: 42, fontFamily: Typeface.display, color: Colors.light.primary },
  subtitle: { fontSize: 16, fontFamily: Typeface.body, color: Colors.light.textSecondary, marginTop: 1 },
  filters: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 17 },
  darkChip: { minHeight: 43, borderRadius: 24, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.light.primary },
  darkChipText: { fontFamily: Typeface.body, fontSize: 14, color: Colors.light.onPrimary },
  editChip: { minHeight: 43, minWidth: 70, borderWidth: 2, borderColor: Colors.light.outlineBlue, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement },
  editText: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 14 },
  featureCard: { padding: 21, borderRadius: 30, backgroundColor: Colors.light.backgroundElement },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  outfitTitle: { fontSize: 20, fontFamily: Typeface.display, color: Colors.light.primary },
  score: { minWidth: 60, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.light.primary, alignItems: 'center' },
  scoreText: { color: Colors.light.onPrimary, fontSize: 14, fontFamily: Typeface.body },
  outfitGrid: { flexDirection: 'row', gap: 10, height: 130 },
  outfitTile: { borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  mainTile: { flex: 1.05 },
  sideTiles: { flex: 1, gap: 10 },
  sideTile: { flex: 1, borderRadius: 25 },
  shirtWrap: { width: 65, height: 60, alignItems: 'center', justifyContent: 'center' },
  sleeve: { position: 'absolute', top: 8, width: 22, height: 23, borderRadius: 4 },
  leftSleeve: { left: 1, transform: [{ rotate: '-28deg' }] },
  rightSleeve: { right: 1, transform: [{ rotate: '28deg' }] },
  shirtBody: { width: 38, height: 47, borderRadius: 4, marginTop: 13, alignItems: 'center' },
  shirtNeck: { width: 15, height: 8, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, backgroundColor: Colors.light.softBlue },
  pants: { width: 30, height: 44, flexDirection: 'row', gap: 2 },
  pantLeg: { width: 12, height: 42, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  leftPant: { transform: [{ rotate: '-2deg' }] },
  rightPant: { transform: [{ rotate: '2deg' }] },
  shoe: { width: 50, height: 23, justifyContent: 'flex-end' },
  shoeTop: { position: 'absolute', width: 41, height: 14, left: 3, bottom: 5, borderTopLeftRadius: 14, borderTopRightRadius: 5, transform: [{ skewX: '-18deg' }] },
  shoeSole: { width: 49, height: 5, borderRadius: 4, backgroundColor: Colors.light.primary },
  tags: { flexDirection: 'row', gap: 7, marginTop: 13, marginBottom: 16 },
  tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.light.canvas },
  tagText: { fontSize: 12, fontFamily: Typeface.body, color: Colors.light.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roundAction: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.light.outlineBlue, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement },
  tryButton: { flex: 1, height: 56, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary },
  tryText: { color: Colors.light.onPrimary, fontSize: 16, fontFamily: Typeface.bodyStrong },
  moreTitle: { marginTop: 19, marginBottom: 10, fontSize: 19, fontFamily: Typeface.display, color: Colors.light.primary },
  suggestions: { flexDirection: 'row', gap: 12 },
  suggestion: { flex: 1, height: 120, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement },
  suggestionGarment: { height: 55, justifyContent: 'center' },
  suggestionLabel: { marginTop: 4, color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 13 },
});
