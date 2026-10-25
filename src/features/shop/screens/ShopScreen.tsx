import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import ShopProductIllustration from '@/features/shop/components/ShopProductIllustration';
import { shopProducts, type ShopCategory, type ShopProduct } from '@/features/shop/data/products';

const categories: ShopCategory[] = ['Shoes', 'Tops', 'Bottoms', 'Bags'];
const categoryIcons = { Shoes: { ios: 'shoe', android: 'steps', web: 'steps' }, Tops: { ios: 'tshirt', android: 'checkroom', web: 'checkroom' }, Bottoms: { ios: 'figure.walk', android: 'apparel', web: 'apparel' }, Bags: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' } } as const;
const brands = [{ name: 'Orbit', mark: 'O' }, { name: 'Morrow', mark: 'M' }, { name: 'North', mark: 'N' }, { name: 'Line', mark: 'L' }];
function BrandMark({ mark, selected, small = false }: { mark: string; selected?: boolean; small?: boolean }) {
  return <View style={[styles.brandMark, small && styles.smallMark, selected && styles.selectedBrandMark]}><Text style={[styles.brandMarkText, selected && styles.selectedBrandText]}>{mark}</Text></View>;
}

export default function ShopScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<ShopCategory>('Shoes');
  const [brand, setBrand] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return shopProducts.filter((item) => {
      const matchesCategory = search ? true : item.category === category;
      const matchesSearch = !search || [item.name, item.brand, item.category].join(' ').toLowerCase().includes(search);
      return matchesCategory && matchesSearch && (!brand || item.brand === brand);
    });
  }, [category, brand, query]);
  const featured = shopProducts.find((item) => item.name === 'Cloud')!;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            {searchOpen ? <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Search shoes, tops, brands..." placeholderTextColor={Colors.light.textSecondary} style={styles.searchInput} /> : <Text style={styles.title}>{category}</Text>}
            <View style={styles.headerButtons}><Pressable accessibilityRole="button" accessibilityLabel="Filters" onPress={() => Alert.alert('Filters', 'More product filters are coming soon.')} style={styles.searchButton}><SymbolView name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }} tintColor={Colors.light.primary} size={22} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={searchOpen ? 'Close search' : 'Search products'} onPress={() => { setSearchOpen(!searchOpen); if (searchOpen) setQuery(''); }} style={styles.searchButton}><SymbolView name={{ ios: searchOpen ? 'xmark' : 'magnifyingglass', android: searchOpen ? 'close' : 'search', web: searchOpen ? 'close' : 'search' }} tintColor={Colors.light.primary} size={23} /></Pressable></View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {categories.map((item) => <Pressable key={item} onPress={() => { setCategory(item); setBrand(null); }} style={[styles.categoryChip, category === item && styles.activeCategory]}><SymbolView name={categoryIcons[item]} tintColor={category === item ? Colors.light.onPrimary : Colors.light.primary} size={16} /><Text style={[styles.categoryText, category === item && styles.activeCategoryText]}>{item}</Text></Pressable>)}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandList}>
            <Pressable onPress={() => setBrand(null)} style={[styles.allBrand, !brand && styles.selectedAll]}><Text style={[styles.allBrandText, !brand && styles.selectedAllText]}>All</Text></Pressable>
            {brands.map((item) => <Pressable key={item.name} accessibilityRole="button" accessibilityLabel={`Filter by ${item.name}`} onPress={() => setBrand(brand === item.name ? null : item.name)}><BrandMark mark={item.mark} selected={brand === item.name} /></Pressable>)}
          </ScrollView>

          <View style={styles.featuredBanner}>
            <View style={styles.bannerOrb} />
            <View style={styles.partnerRow}><BrandMark mark="O" small selected /><Text style={styles.partnerLabel}>PARTNER PICK</Text></View>
          <Text style={styles.featureName}>{featured.name}</Text>
            <View style={styles.featureActions}><Pressable style={styles.featureTry} onPress={() => router.push({ pathname: '/miroir', params: { product: featured.name, price: String(featured.price), category: featured.category, source: 'brand', returnTo: '/shop' } })}><Text style={styles.featureTryText}>Try on</Text></Pressable><Pressable style={styles.featureBuy} onPress={() => Alert.alert(featured.name, 'Partner checkout is coming soon.')}><Text style={styles.featureBuyText}>Buy</Text></Pressable></View>
            <View style={styles.bannerShoe}><ShopProductIllustration item={featured} large /></View>
          </View>

          <Text style={styles.sectionTitle}>{query.trim() ? 'Search results' : 'Featured from brands'}</Text>
          {visibleProducts.length ? <View style={styles.productGrid}>{visibleProducts.map((item) => <ProductCard key={item.name} item={item} />)}</View> : <View style={styles.empty}><Text style={styles.emptyText}>No items found. Try another search or brand.</Text></View>}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ProductCard({ item }: { item: ShopProduct }) {
  const router = useRouter();
  return <View style={styles.productCard}>
    <View style={[styles.productArt, { backgroundColor: item.tile }]}><View style={styles.productBadge}><BrandMark mark={item.mark} small /></View><ShopProductIllustration item={item} /></View>
    <View style={styles.productDetails}><Text numberOfLines={1} style={styles.productName}>{item.name}</Text><Text style={styles.productPrice}>${item.price}</Text></View>
    <Text style={styles.brandName}>{item.brand}</Text>
    <View style={styles.cardActions}>{(item.category === 'Shoes' || item.category === 'Bags') && <Pressable style={styles.trySmall} onPress={() => router.push({ pathname: '/miroir', params: { product: item.name, price: String(item.price), category: item.category, source: 'brand', returnTo: '/shop' } })}><Text style={styles.trySmallText}>Try on</Text></Pressable>}<Pressable style={[styles.buySmall, item.category !== 'Shoes' && item.category !== 'Bags' && styles.buyWide]} onPress={() => Alert.alert(item.name, 'Partner checkout is coming soon.')}><Text style={styles.buySmallText}>Buy</Text></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas }, screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas }, content: { paddingHorizontal: PageGutter, paddingTop: 20, paddingBottom: 125 }, topOrb: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: -40, top: -58, backgroundColor: Colors.light.warmOrb },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }, headerButtons: { flexDirection: 'row', gap: 8 }, title: { fontFamily: Typeface.display, fontSize: 34, lineHeight: 44, color: Colors.light.primary }, searchButton: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement }, searchInput: { flex: 1, height: 50, borderRadius: 25, paddingHorizontal: 17, backgroundColor: Colors.light.backgroundElement, fontFamily: Typeface.body, fontSize: 15, color: Colors.light.primary },
  categoryList: { gap: 8, paddingBottom: 12 }, categoryChip: { paddingHorizontal: 13, height: 38, flexDirection: 'row', gap: 6, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.light.outlineBlue, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement }, activeCategory: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, categoryText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 }, activeCategoryText: { color: Colors.light.onPrimary },
  brandList: { gap: 12, alignItems: 'center', paddingBottom: 15 }, allBrand: { width: 60, height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement }, selectedAll: { backgroundColor: Colors.light.primary }, allBrandText: { fontFamily: Typeface.body, color: Colors.light.primary }, selectedAllText: { color: Colors.light.onPrimary }, brandMark: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement, borderWidth: 2, borderColor: 'transparent' }, smallMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.light.backgroundElement }, selectedBrandMark: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, brandMarkText: { fontFamily: Typeface.display, color: Colors.light.primary, fontSize: 17 }, selectedBrandText: { color: Colors.light.onPrimary },
  featuredBanner: { height: 173, borderRadius: 30, overflow: 'hidden', padding: 21, backgroundColor: Colors.light.primary, justifyContent: 'center' }, bannerOrb: { position: 'absolute', width: 155, height: 155, right: -3, top: -5, borderRadius: 80, backgroundColor: Colors.light.bannerNavy }, partnerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }, partnerLabel: { color: Colors.light.sand, fontFamily: Typeface.bodyStrong, fontSize: 12 }, featureName: { color: Colors.light.onPrimary, fontFamily: Typeface.display, fontSize: 24, marginBottom: 8 }, featureActions: { flexDirection: 'row', gap: 8 }, featureTry: { width: 96, height: 39, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement }, featureTryText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 14 }, featureBuy: { width: 100, height: 39, borderRadius: 22, borderWidth: 2, borderColor: Colors.light.onPrimary, alignItems: 'center', justifyContent: 'center' }, featureBuyText: { color: Colors.light.onPrimary, fontFamily: Typeface.body, fontSize: 14 }, bannerShoe: { position: 'absolute', right: 11, top: 54 },
  sectionTitle: { color: Colors.light.primary, fontFamily: Typeface.display, fontSize: 19, marginTop: 18, marginBottom: 10 }, productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, productCard: { width: '48%', borderRadius: 26, backgroundColor: Colors.light.backgroundElement, padding: 12 }, productArt: { height: 103, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, productBadge: { position: 'absolute', left: 8, top: 8, zIndex: 1 }, productDetails: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, marginTop: 9 }, productName: { flex: 1, fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 }, productPrice: { fontFamily: Typeface.body, color: Colors.light.primary, fontSize: 15 }, brandName: { fontFamily: Typeface.body, color: Colors.light.textSecondary, fontSize: 12, marginTop: 1 }, cardActions: { flexDirection: 'row', gap: 6, marginTop: 8 }, trySmall: { flex: 1, height: 36, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary }, trySmallText: { color: Colors.light.onPrimary, fontFamily: Typeface.body, fontSize: 13 }, buySmall: { flex: 1, height: 36, borderRadius: 19, borderWidth: 2, borderColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' }, buyWide: { flex: 1 }, buySmallText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 },
  empty: { padding: 22, borderRadius: 24, backgroundColor: Colors.light.backgroundElement }, emptyText: { color: Colors.light.textSecondary, textAlign: 'center', fontFamily: Typeface.body },
});
