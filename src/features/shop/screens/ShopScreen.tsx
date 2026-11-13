import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { fetchActiveBrands, fetchActiveCatalog } from '@/features/catalog/api';
import { useCatalogResource } from '@/features/catalog/useCatalogResource';
import { formatPrice, type CatalogProduct } from '@/features/catalog/types';
import ShopProductIllustration, { type ShopIllustration } from '@/features/shop/components/ShopProductIllustration';

const baseCategories = ['Shoes', 'Tops', 'Bottoms', 'Bags'] as const;
const extraCategories = ['Outerwear', 'Dresses', 'Accessories'] as const;
type ShopCategory = (typeof baseCategories)[number] | (typeof extraCategories)[number];

const categoryIcons = {
  Shoes: { ios: 'shoe', android: 'steps', web: 'steps' },
  Tops: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  Bottoms: { ios: 'figure.walk', android: 'apparel', web: 'apparel' },
  Bags: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  Outerwear: { ios: 'cloud', android: 'checkroom', web: 'checkroom' },
  Dresses: { ios: 'tshirt', android: 'apparel', web: 'apparel' },
  Accessories: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
} as const;

const looks = [
  { tone: Colors.light.sand, tile: Colors.light.softBlue },
  { tone: Colors.light.blueSlate, tile: Colors.light.sandTile },
  { tone: Colors.light.background, tile: Colors.light.softBlue },
  { tone: Colors.light.navySwatch, tile: Colors.light.sandTile },
];

type ShopItem = ShopIllustration & {
  id: string;
  name: string;
  price: number | null;
  brand: string;
  mark: string;
  category: string;
  tile: string;
};

function kindFor(category: string | null): ShopIllustration['kind'] {
  if (category === 'Tops' || category === 'Outerwear' || category === 'Dresses') return 'shirt';
  if (category === 'Bottoms') return 'pants';
  if (category === 'Bags' || category === 'Accessories') return 'bag';
  return 'shoe';
}

function toShopItem(item: CatalogProduct, index: number): ShopItem {
  const look = looks[index % looks.length];
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    brand: item.brandName,
    mark: item.brandName.trim().slice(0, 1).toUpperCase() || '•',
    category: item.category ?? 'Shoes',
    tone: look.tone,
    tile: look.tile,
    kind: kindFor(item.category),
  };
}

function canTryOn(category: string) {
  return category === 'Shoes' || category === 'Bags';
}

function BrandMark({ mark, selected, small = false }: { mark: string; selected?: boolean; small?: boolean }) {
  return (
    <View style={[styles.brandMark, small && styles.smallMark, selected && styles.selectedBrandMark]}>
      <Text style={[styles.brandMarkText, small && styles.smallMarkText, selected && styles.selectedBrandText]}>{mark}</Text>
    </View>
  );
}

export default function ShopScreen() {
  const router = useRouter();
  const catalog = useCatalogResource(fetchActiveCatalog);
  const brandList = useCatalogResource(fetchActiveBrands);
  const [pickedCategory, setPickedCategory] = useState<ShopCategory | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const products = useMemo(
    () => catalog.data.map((item, index) => toShopItem(item, index)),
    [catalog.data],
  );

  const categories = useMemo(() => {
    const used = new Set(products.map((item) => item.category));
    return [...baseCategories, ...extraCategories.filter((item) => used.has(item))];
  }, [products]);

  const category =
    pickedCategory ??
    categories.find((item) => products.some((product) => product.category === item)) ??
    'Shoes';

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((item) => {
      const matchesCategory = search ? true : item.category === category;
      const matchesSearch =
        !search || [item.name, item.brand, item.category].join(' ').toLowerCase().includes(search);
      return matchesCategory && matchesSearch && (!brand || item.brand === brand);
    });
  }, [products, category, brand, query]);

  const featured = products.find((item) => item.category === category) ?? null;

  const openTryOn = (item: ShopItem) => {
    router.push({
      pathname: '/miroir',
      params: {
        product: item.name,
        price: item.price == null ? '' : String(item.price),
        category: item.category,
        source: 'brand',
        returnTo: '/shop',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            {searchOpen ? (
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search shoes, tops, brands..."
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.searchInput}
              />
            ) : (
              <Text style={styles.title}>{category}</Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={searchOpen ? 'Close search' : 'Search products'}
              onPress={() => {
                setSearchOpen(!searchOpen);
                if (searchOpen) setQuery('');
              }}
              style={styles.searchButton}>
              <SymbolView
                name={{
                  ios: searchOpen ? 'xmark' : 'magnifyingglass',
                  android: searchOpen ? 'close' : 'search',
                  web: searchOpen ? 'close' : 'search',
                }}
                tintColor={Colors.light.primary}
                size={23}
              />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setPickedCategory(item);
                  setBrand(null);
                }}
                style={[styles.categoryChip, category === item && styles.activeCategory]}>
                <SymbolView
                  name={categoryIcons[item]}
                  tintColor={category === item ? Colors.light.onPrimary : Colors.light.primary}
                  size={16}
                />
                <Text style={[styles.categoryText, category === item && styles.activeCategoryText]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandList}>
            <Pressable onPress={() => setBrand(null)} style={[styles.allBrand, !brand && styles.selectedAll]}>
              <Text style={[styles.allBrandText, !brand && styles.selectedAllText]}>All</Text>
            </Pressable>
            {brandList.data.map((item) => {
              const mark = item.name.trim().slice(0, 1).toUpperCase() || '•';
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${item.name}`}
                  onPress={() => setBrand(brand === item.name ? null : item.name)}>
                  <BrandMark mark={mark} selected={brand === item.name} />
                </Pressable>
              );
            })}
          </ScrollView>

          {featured ? (
            <View style={styles.featuredBanner}>
              <View style={styles.bannerOrb} />
              <View style={styles.partnerRow}>
                <BrandMark mark={featured.mark} small />
                <Text style={styles.partnerLabel}>PARTNER PICK</Text>
              </View>
              <Text style={styles.featureName} numberOfLines={1}>{featured.name}</Text>
              <View style={styles.featureActions}>
                {canTryOn(featured.category) ? (
                  <Pressable style={styles.featureTry} onPress={() => openTryOn(featured)}>
                    <Text style={styles.featureTryText}>Try on</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.featureBuy} onPress={() => Alert.alert(featured.name, 'Partner checkout is coming soon.')}>
                  <Text style={styles.featureBuyText}>Buy</Text>
                </Pressable>
              </View>
              <View style={styles.bannerShoe}>
                <ShopProductIllustration item={featured} large />
              </View>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>{query.trim() ? 'Search results' : 'Featured from brands'}</Text>
          {visibleProducts.length ? (
            <View style={styles.productGrid}>
              {visibleProducts.map((item) => (
                <ProductCard key={item.id} item={item} onTryOn={() => openTryOn(item)} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {catalog.loading ? 'Loading products' : 'No items found. Try another search or brand.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ProductCard({ item, onTryOn }: { item: ShopItem; onTryOn: () => void }) {
  const tryOn = canTryOn(item.category);
  return (
    <View style={styles.productCard}>
      <View style={[styles.productArt, { backgroundColor: item.tile }]}>
        <View style={styles.productBadge}>
          <BrandMark mark={item.mark} small />
        </View>
        <ShopProductIllustration item={item} />
      </View>
      <View style={styles.productDetails}>
        <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
      </View>
      <Text style={styles.brandName}>{item.brand}</Text>
      <View style={styles.cardActions}>
        {tryOn ? (
          <Pressable style={styles.trySmall} onPress={onTryOn}>
            <Text style={styles.trySmallText}>Try on</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.buySmall, !tryOn && styles.buyWide]}
          onPress={() => Alert.alert(item.name, 'Partner checkout is coming soon.')}>
          <Text style={styles.buySmallText}>Buy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 20, paddingBottom: 125 },
  topOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -40,
    top: -58,
    backgroundColor: Colors.light.warmOrb,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  title: { fontFamily: Typeface.display, fontSize: 34, lineHeight: 44, color: Colors.light.primary },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 17,
    backgroundColor: Colors.light.backgroundElement,
    fontFamily: Typeface.body,
    fontSize: 15,
    color: Colors.light.primary,
  },
  categoryList: { gap: 8, paddingBottom: 12 },
  categoryChip: {
    paddingHorizontal: 13,
    height: 38,
    flexDirection: 'row',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.light.outlineBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  activeCategory: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  categoryText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 },
  activeCategoryText: { color: Colors.light.onPrimary },
  brandList: { gap: 12, alignItems: 'center', paddingBottom: 15 },
  allBrand: {
    width: 60,
    height: 54,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  selectedAll: { backgroundColor: Colors.light.primary },
  allBrandText: { fontFamily: Typeface.body, color: Colors.light.primary },
  selectedAllText: { color: Colors.light.onPrimary },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  smallMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light.backgroundElement },
  selectedBrandMark: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  brandMarkText: { fontFamily: Typeface.display, color: Colors.light.primary, fontSize: 17 },
  smallMarkText: { fontSize: 13 },
  selectedBrandText: { color: Colors.light.onPrimary },
  featuredBanner: {
    height: 173,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 21,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
  },
  bannerOrb: {
    position: 'absolute',
    width: 155,
    height: 155,
    right: -3,
    top: -5,
    borderRadius: 80,
    backgroundColor: Colors.light.bannerNavy,
  },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  partnerLabel: { color: Colors.light.sand, fontFamily: Typeface.bodyStrong, fontSize: 12 },
  featureName: { color: Colors.light.onPrimary, fontFamily: Typeface.display, fontSize: 24, marginBottom: 8 },
  featureActions: { flexDirection: 'row', gap: 8 },
  featureTry: {
    width: 96,
    height: 39,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  featureTryText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 14 },
  featureBuy: {
    width: 100,
    height: 39,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.light.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBuyText: { color: Colors.light.onPrimary, fontFamily: Typeface.body, fontSize: 14 },
  bannerShoe: { position: 'absolute', right: 11, top: 54 },
  sectionTitle: { color: Colors.light.primary, fontFamily: Typeface.display, fontSize: 19, marginTop: 18, marginBottom: 10 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: '48%', borderRadius: 26, backgroundColor: Colors.light.backgroundElement, padding: 12 },
  productArt: { height: 103, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productBadge: { position: 'absolute', left: 8, top: 8, zIndex: 1 },
  productDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, marginTop: 9 },
  productName: { flex: 1, fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 },
  productPrice: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 },
  brandName: { fontFamily: Typeface.body, color: Colors.light.textSecondary, fontSize: 12, marginTop: 1 },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  trySmall: {
    flex: 1,
    height: 36,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  trySmallText: { color: Colors.light.onPrimary, fontFamily: Typeface.body, fontSize: 13 },
  buySmall: {
    flex: 1,
    height: 36,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyWide: { flex: 1 },
  buySmallText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 },
  empty: { padding: 22, borderRadius: 24, backgroundColor: Colors.light.backgroundElement },
  emptyText: { color: Colors.light.textSecondary, textAlign: 'center', fontFamily: Typeface.body },
});
