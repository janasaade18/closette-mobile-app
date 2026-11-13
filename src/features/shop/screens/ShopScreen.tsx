import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import {
  shopBrands,
  shopCatalog,
  shopCategories,
  type ShopCategory,
  type ShopProduct,
} from '@/features/shop/data/catalog';

const categoryIcons: Record<
  ShopCategory,
  { ios: string; android: string; web: string }
> = {
  Shoes: { ios: 'shoe', android: 'steps', web: 'steps' },
  Tops: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' },
  Bottoms: { ios: 'figure.walk', android: 'apparel', web: 'apparel' },
  Outerwear: { ios: 'jacket', android: 'checkroom', web: 'checkroom' },
  Dresses: { ios: 'dress', android: 'checkroom', web: 'checkroom' },
  Bags: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  Accessories: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
};

function BrandMark({
  mark,
  selected,
  small = false,
}: {
  mark: string;
  selected?: boolean;
  small?: boolean;
}) {
  return (
    <View
      style={[
        styles.brandMark,
        small && styles.smallMark,
        selected && styles.selectedBrandMark,
      ]}>
      <Text style={[styles.brandMarkText, selected && styles.selectedBrandText]}>
        {mark}
      </Text>
    </View>
  );
}

function canTryOn(item: ShopProduct) {
  return item.category === 'Shoes' || item.category === 'Bags';
}

export default function ShopScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<ShopCategory>('Shoes');
  const [brand, setBrand] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return shopCatalog.filter((item) => {
      if (!item.in_stock) return false;
      const matchesCategory = search ? true : item.category === category;
      const haystack = [item.name, item.brand, item.category, item.subcategory]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesCategory && matchesSearch && (!brand || item.brand === brand);
    });
  }, [category, brand, query]);

  const featured =
    shopCatalog.find((item) => item.id === 'mkt-sneaker-01') ??
    shopCatalog.find((item) => item.in_stock)!;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={styles.header}>
            {searchOpen ? (
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search shoes, scarves, coats..."
                placeholderTextColor={Colors.light.textSecondary}
                style={styles.searchInput}
              />
            ) : (
              <Text style={styles.title}>{category}</Text>
            )}
            <View style={styles.headerButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filters"
                onPress={() =>
                  Alert.alert(
                    'Marketplace',
                    `${shopCatalog.filter((p) => p.in_stock).length} partner pieces. Muse can mix these into outfits when Market is on.`,
                  )
                }
                style={styles.searchButton}>
                <SymbolView
                  name={{
                    ios: 'line.3.horizontal.decrease',
                    android: 'filter_list',
                    web: 'filter_list',
                  }}
                  tintColor={Colors.light.primary}
                  size={22}
                />
              </Pressable>
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
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}>
            {shopCategories.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setCategory(item);
                  setBrand(null);
                }}
                style={[styles.categoryChip, category === item && styles.activeCategory]}>
                <SymbolView
                  name={categoryIcons[item]}
                  tintColor={
                    category === item ? Colors.light.onPrimary : Colors.light.primary
                  }
                  size={16}
                />
                <Text
                  style={[
                    styles.categoryText,
                    category === item && styles.activeCategoryText,
                  ]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandList}>
            <Pressable
              onPress={() => setBrand(null)}
              style={[styles.allBrand, !brand && styles.selectedAll]}>
              <Text style={[styles.allBrandText, !brand && styles.selectedAllText]}>
                All
              </Text>
            </Pressable>
            {shopBrands.map((item) => (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.name}`}
                onPress={() => setBrand(brand === item.name ? null : item.name)}>
                <BrandMark mark={item.mark} selected={brand === item.name} />
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.featuredBanner}>
            <Image
              source={{ uri: featured.image_url }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            <View style={styles.featuredScrim} />
            <View style={styles.featuredCopy}>
              <View style={styles.partnerRow}>
                <BrandMark mark={featured.mark} small selected />
                <Text style={styles.partnerLabel}>PARTNER PICK</Text>
              </View>
              <Text style={styles.featureName} numberOfLines={1}>
                {featured.name}
              </Text>
              <Text style={styles.featureMeta}>
                {featured.brand} · ${featured.price}
              </Text>
              <View style={styles.featureActions}>
                {canTryOn(featured) ? (
                  <Pressable
                    style={styles.featureTry}
                    onPress={() =>
                      router.push({
                        pathname: '/miroir',
                        params: {
                          product: featured.name,
                          price: String(featured.price),
                          category: featured.category,
                          source: 'brand',
                          returnTo: '/shop',
                        },
                      })
                    }>
                    <Text style={styles.featureTryText}>Try on</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.featureBuy}
                  onPress={() =>
                    Alert.alert(
                      featured.name,
                      `${featured.brand} · $${featured.price}\nPartner checkout is coming soon. Muse can already suggest this piece.`,
                    )
                  }>
                  <Text style={styles.featureBuyText}>Buy</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            {query.trim() ? 'Search results' : `Shop ${category.toLowerCase()}`}
          </Text>
          {visibleProducts.length ? (
            <View style={styles.productGrid}>
              {visibleProducts.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No items found. Try another search or brand.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ProductCard({ item }: { item: ShopProduct }) {
  const router = useRouter();
  return (
    <View style={styles.productCard}>
      <View style={styles.productArt}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productBadge}>
          <BrandMark mark={item.mark} small />
        </View>
      </View>
      <View style={styles.productDetails}>
        <Text numberOfLines={1} style={styles.productName}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>${item.price}</Text>
      </View>
      <Text style={styles.brandName}>{item.brand}</Text>
      <View style={styles.cardActions}>
        {canTryOn(item) ? (
          <Pressable
            style={styles.trySmall}
            onPress={() =>
              router.push({
                pathname: '/miroir',
                params: {
                  product: item.name,
                  price: String(item.price),
                  category: item.category,
                  source: 'brand',
                  returnTo: '/shop',
                },
              })
            }>
            <Text style={styles.trySmallText}>Try on</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.buySmall, !canTryOn(item) && styles.buyWide]}
          onPress={() =>
            Alert.alert(
              item.name,
              `${item.brand} · $${item.price}\n${item.subcategory}\nPartner checkout coming soon.`,
            )
          }>
          <Text style={styles.buySmallText}>Buy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  content: {
    paddingHorizontal: PageGutter,
    paddingTop: 20,
    paddingBottom: 125,
  },
  topOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -40,
    top: -58,
    backgroundColor: Colors.light.warmOrb,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerButtons: { flexDirection: 'row', gap: 8 },
  title: {
    fontFamily: Typeface.display,
    fontSize: 34,
    lineHeight: 44,
    color: Colors.light.primary,
  },
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
  activeCategory: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 13,
  },
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
  smallMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.backgroundElement,
  },
  selectedBrandMark: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  brandMarkText: {
    fontFamily: Typeface.display,
    color: Colors.light.primary,
    fontSize: 17,
  },
  selectedBrandText: { color: Colors.light.onPrimary },
  featuredBanner: {
    height: 200,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: Colors.light.primary,
    justifyContent: 'flex-end',
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  featuredScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 38, 63, 0.42)',
  },
  featuredCopy: {
    padding: 20,
    zIndex: 1,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  partnerLabel: {
    color: Colors.light.sand,
    fontFamily: Typeface.bodyStrong,
    fontSize: 12,
  },
  featureName: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.display,
    fontSize: 24,
    marginBottom: 2,
  },
  featureMeta: {
    color: Colors.light.onPrimaryMuted,
    fontFamily: Typeface.body,
    fontSize: 13,
    marginBottom: 10,
  },
  featureActions: { flexDirection: 'row', gap: 8 },
  featureTry: {
    width: 96,
    height: 39,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  featureTryText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 14,
  },
  featureBuy: {
    width: 100,
    height: 39,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.light.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBuyText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.body,
    fontSize: 14,
  },
  sectionTitle: {
    color: Colors.light.primary,
    fontFamily: Typeface.display,
    fontSize: 19,
    marginTop: 18,
    marginBottom: 10,
  },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: {
    width: '48%',
    borderRadius: 26,
    backgroundColor: Colors.light.backgroundElement,
    padding: 12,
  },
  productArt: {
    height: 148,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: Colors.light.softBlue,
  },
  productImage: { width: '100%', height: '100%' },
  productBadge: { position: 'absolute', left: 8, top: 8, zIndex: 1 },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    marginTop: 9,
  },
  productName: {
    flex: 1,
    fontFamily: Typeface.bodyStrong,
    color: Colors.light.primary,
    fontSize: 14,
  },
  productPrice: {
    fontFamily: Typeface.body,
    color: Colors.light.primary,
    fontSize: 14,
  },
  brandName: {
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  trySmall: {
    flex: 1,
    height: 36,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  trySmallText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.body,
    fontSize: 13,
  },
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
  buySmallText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 13,
  },
  empty: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
  },
  emptyText: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
    fontFamily: Typeface.body,
  },
});
