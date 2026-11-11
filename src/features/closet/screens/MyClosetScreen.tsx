import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import {
  deleteClosetGarment,
  fetchClosetGarments,
  garmentCategoryLabel,
  garmentColorHex,
  garmentColorName,
  garmentDisplayName,
} from '@/features/closet/services/closetApi';
import type { ClosetGarment } from '@/features/closet/types';
import { authErrorMessage } from '@/features/auth/userProfile';

type GarmentCategory = 'Top' | 'Bottom' | 'Shoes' | 'Outer' | 'Other';

const categories: { label: string; value: GarmentCategory }[] = [
  { label: 'Tops', value: 'Top' },
  { label: 'Bottoms', value: 'Bottom' },
  { label: 'Shoes', value: 'Shoes' },
  { label: 'Outer', value: 'Outer' },
];

function mapCategory(raw: string | null): GarmentCategory {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('top') || value.includes('shirt') || value.includes('tee')) {
    return 'Top';
  }
  if (value.includes('bottom') || value.includes('pant') || value.includes('skirt')) {
    return 'Bottom';
  }
  if (value.includes('shoe') || value.includes('sneaker') || value.includes('boot')) {
    return 'Shoes';
  }
  if (value.includes('outer') || value.includes('coat') || value.includes('jacket')) {
    return 'Outer';
  }
  return 'Other';
}

export default function MyClosetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [garments, setGarments] = useState<ClosetGarment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadGarments = useCallback(async () => {
    if (!user?.id) {
      setGarments([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const rows = await fetchClosetGarments(user.id);
      setGarments(rows);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadGarments();
    }, [loadGarments]),
  );

  useEffect(() => {
    void loadGarments();
  }, [loadGarments]);

  const palette = useMemo(() => {
    const seen = new Map<string, string>();
    for (const garment of garments) {
      const name = garmentColorName(garment);
      const hex = garmentColorHex(garment);
      if (!seen.has(name)) {
        seen.set(name, hex);
      }
    }
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }));
  }, [garments]);

  const visiblePieces = useMemo(() => {
    return garments.filter((garment) => {
      const category = mapCategory(garment.category ?? garment.subcategory);
      const colorName = garmentColorName(garment);
      return (
        (!selectedCategory || category === selectedCategory) &&
        (!selectedColor || colorName === selectedColor)
      );
    });
  }, [garments, selectedCategory, selectedColor]);

  const confirmDelete = (garment: ClosetGarment) => {
    if (!user?.id) {
      return;
    }
    Alert.alert(
      'Delete piece?',
      `${garmentDisplayName(garment)} will be removed from your closet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeletingId(garment.id);
              try {
                await deleteClosetGarment(garment.id, user.id);
                setGarments((current) =>
                  current.filter((item) => item.id !== garment.id),
                );
              } catch (err) {
                Alert.alert('Could not delete', authErrorMessage(err));
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <View pointerEvents="none" style={styles.bottomOrb} />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadGarments();
              }}
              tintColor={Colors.light.primary}
            />
          }>
          <View style={styles.header}>
            <Text style={styles.title}>My closet</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter closet"
              onPress={() =>
                Alert.alert(
                  'Filter closet',
                  'Use the colour swatches and category chips below.',
                )
              }
              style={styles.filterButton}>
              <SymbolView
                name={{
                  ios: 'line.3.horizontal.decrease',
                  android: 'filter_list',
                  web: 'filter_list',
                }}
                tintColor={Colors.light.primary}
                size={23}
              />
            </Pressable>
          </View>

          <View style={styles.paletteHeader}>
            <Text style={styles.label}>Your palette</Text>
            <Text style={styles.label}>
              {palette.length} colour{palette.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.paletteBar}>
            {(palette.length ? palette : [{ name: 'Navy', color: Colors.light.navySwatch }]).map(
              (color, index) => (
                <View
                  key={`${color.name}-${index}`}
                  style={{
                    flex: index === 0 ? 1.65 : 1,
                    backgroundColor: color.color,
                  }}
                />
              ),
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swatches}>
            <Pressable
              onPress={() => setSelectedColor(null)}
              style={[styles.allSwatch, !selectedColor && styles.selectedAll]}>
              <Text style={[styles.allText, !selectedColor && styles.selectedAllText]}>
                All
              </Text>
            </Pressable>
            {palette.map((swatch) => (
              <Pressable
                key={swatch.name}
                accessibilityRole="button"
                accessibilityLabel={`${swatch.name} colour`}
                accessibilityState={{ selected: selectedColor === swatch.name }}
                onPress={() =>
                  setSelectedColor(selectedColor === swatch.name ? null : swatch.name)
                }
                style={[
                  styles.swatch,
                  { backgroundColor: swatch.color },
                  selectedColor === swatch.name && styles.selectedSwatch,
                  swatch.name.toLowerCase() === 'white' && styles.whiteSwatch,
                ]}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}>
            {categories.map((category) => (
              <Pressable
                key={category.value}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === category.value ? null : category.value,
                  )
                }
                style={[
                  styles.categoryChip,
                  selectedCategory === category.value && styles.selectedCategory,
                ]}>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.value && styles.selectedCategoryText,
                  ]}>
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.emptyBody}>Loading your closet…</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Could not load closet</Text>
              <Text style={styles.emptyBody}>{error}</Text>
            </View>
          ) : visiblePieces.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No pieces yet</Text>
              <Text style={styles.emptyBody}>
                Add a garment from Home → Add item, then confirm it for your closet.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {visiblePieces.map((garment) => {
                const hex = garmentColorHex(garment);
                const colorName = garmentColorName(garment);
                const deleting = deletingId === garment.id;
                return (
                  <View key={garment.id} style={styles.card}>
                    <View
                      style={[
                        styles.garmentTile,
                        { backgroundColor: Colors.light.softBlue },
                      ]}>
                      {garment.cutout_url ? (
                        <Image
                          source={{ uri: garment.cutout_url }}
                          style={styles.cutout}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={[styles.fallbackDot, { backgroundColor: hex }]} />
                      )}
                      <View style={[styles.colorDot, { backgroundColor: hex }]} />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${garmentDisplayName(garment)}`}
                        onPress={() => confirmDelete(garment)}
                        disabled={deleting}
                        style={styles.deleteButton}>
                        {deleting ? (
                          <ActivityIndicator color={Colors.light.onPrimary} size="small" />
                        ) : (
                          <Text style={styles.deleteText}>×</Text>
                        )}
                      </Pressable>
                    </View>
                    <Text style={styles.pieceName}>{garmentDisplayName(garment)}</Text>
                    <View style={styles.pieceDetails}>
                      <View style={[styles.detailDot, { backgroundColor: hex }]} />
                      <Text style={styles.detailText}>
                        {colorName} {'\u00B7'} {garmentCategoryLabel(garment)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add clothing item"
          onPress={() => router.push('/home')}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 148 },
  topOrb: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    right: -68,
    top: -92,
    backgroundColor: Colors.light.warmOrb,
  },
  bottomOrb: {
    position: 'absolute',
    width: 268,
    height: 268,
    borderRadius: 134,
    left: -112,
    top: 520,
    backgroundColor: Colors.light.coolOrb,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontFamily: Typeface.display,
    color: Colors.light.primary,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    fontFamily: Typeface.bodyStrong,
  },
  paletteBar: {
    height: 13,
    overflow: 'hidden',
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 15,
  },
  swatches: {
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
    marginBottom: 15,
  },
  allSwatch: {
    height: 44,
    minWidth: 62,
    borderWidth: 2,
    borderColor: Colors.light.softBlue,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 17,
  },
  selectedAll: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  allText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 15 },
  selectedAllText: { color: Colors.light.onPrimary },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: Colors.light.primary,
    transform: [{ scale: 1.12 }],
  },
  whiteSwatch: { borderColor: Colors.light.softBlue },
  categories: { gap: 9, paddingRight: 10, marginBottom: 15 },
  categoryChip: {
    height: 42,
    paddingHorizontal: 19,
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 2,
    borderColor: Colors.light.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategory: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 15,
  },
  selectedCategoryText: { color: Colors.light.onPrimary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  card: {
    width: '48.2%',
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 30,
    padding: 12,
    paddingBottom: 13,
  },
  garmentTile: {
    height: 108,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cutout: { width: '86%', height: '86%' },
  fallbackDot: { width: 48, height: 48, borderRadius: 24 },
  colorDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: Colors.light.onPrimary,
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.rust,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: Colors.light.onPrimary,
    fontSize: 18,
    lineHeight: 20,
    fontFamily: Typeface.display,
  },
  pieceName: {
    color: Colors.light.primary,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: Typeface.display,
  },
  pieceDetails: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailDot: { width: 11, height: 11, borderRadius: 6 },
  detailText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    fontFamily: Typeface.body,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: Colors.light.primary,
    fontFamily: Typeface.display,
    fontSize: 22,
  },
  emptyBody: {
    color: Colors.light.textSecondary,
    fontFamily: Typeface.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 18,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 104,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.light.sand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.shadow,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  addText: {
    color: Colors.light.primary,
    fontSize: 40,
    lineHeight: 44,
    fontFamily: Typeface.displayMedium,
  },
  pressed: { opacity: 0.8 },
});
