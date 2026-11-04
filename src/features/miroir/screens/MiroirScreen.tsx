import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Colors, Typeface } from '@/constants/theme';
import AccessoriesIcon from '@/components/AccessoriesIcon';
import ShopProductIllustration from '@/features/shop/components/ShopProductIllustration';
import { shopProducts, type ShopProduct } from '@/features/shop/data/products';

type Category = 'Shoes' | 'Accessories';
type Source = 'closet' | 'brand';
const closetShoe: ShopProduct = { name: 'Sneakers', price: 0, brand: '', mark: 'C', category: 'Shoes', tone: '#E7D5B8', tile: '#F0E8DA', kind: 'shoe' };
const brandItems = shopProducts.filter((item) => item.category === 'Shoes' || item.category === 'Bags');
const colors = ['#14213F', '#E7D5B8', '#5D7195', '#F5F7FB', '#BE5538'];

export default function MiroirScreenWeb() {
  const router = useRouter();
  const params = useLocalSearchParams<{ product?: string; price?: string; category?: string; returnTo?: string; mode?: string; source?: string }>();
  const browse = params.mode === 'browse';
  const sourceAtStart: Source = params.source === 'brand' ? 'brand' : 'closet';
  const categoryAtStart: Category = params.category === 'Bags' || params.category === 'Accessories' ? 'Accessories' : 'Shoes';
  const directProduct = params.product ? brandItems.find((item) => item.name.toLowerCase() === params.product?.toLowerCase()) : undefined;
  const [source, setSource] = useState<Source>(sourceAtStart);
  const [category, setCategory] = useState<Category>(categoryAtStart);
  const [item, setItem] = useState<ShopProduct | null>(browse ? null : directProduct || (params.source === 'brand' ? null : closetShoe));
  const [color, setColor] = useState(item?.tone || '#14213F');
  const [favorite, setFavorite] = useState(false);
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : '/shop';
  const close = () => router.replace(returnTo as '/home' | '/muse' | '/muse-chat' | '/shop');
  const items = (source === 'closet' ? [closetShoe] : brandItems).filter((product) => (category === 'Accessories' ? product.category === 'Bags' : product.category === 'Shoes'));

  const choose = (product: ShopProduct) => {
    setItem(product);
    setColor(product.tone);
    setFavorite(false);
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <View style={styles.cameraArea}>
      <View pointerEvents="none" style={styles.cameraGlow} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close try-on" onPress={close} style={styles.roundButton}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor="#FFFFFF" size={21} /></Pressable>
        <View style={styles.productPill}>{item?.kind === 'bag' || (!item && category === 'Accessories') ? <AccessoriesIcon size={18} color="#12263F" /> : <SymbolView name={{ ios: 'shoe', android: 'steps', web: 'steps' }} tintColor="#12263F" size={17} />}<Text numberOfLines={1} style={styles.productPillText}>{item?.name || `Try on · ${category}`}</Text></View>
        <View style={styles.roundButton}><SymbolView name={{ ios: 'viewfinder', android: 'center_focus_strong', web: 'center_focus_strong' }} tintColor="#FFFFFF" size={21} /></View>
      </View>
      <View style={styles.cameraStatus}><Text style={styles.cameraStatusText}>Camera try-on is available on your phone</Text></View>
      <View style={styles.preview}>{item ? <View style={[styles.productPreview, { backgroundColor: item.tile }]}><ShopProductIllustration item={{ ...item, tone: color }} large /></View> : <View style={styles.previewHint}>{category === 'Accessories' ? <AccessoriesIcon size={42} color="#FFFFFF" /> : <SymbolView name={{ ios: 'shoe', android: 'steps', web: 'steps' }} tintColor="#FFFFFF" size={40} />}<Text style={styles.previewHintText}>Choose {category.toLowerCase()} to preview</Text></View>}</View>
    </View>
    {item ? <View style={styles.detailPanel}>
      {browse && <Pressable onPress={() => setItem(null)} style={styles.backButton}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={Colors.light.primary} size={16} /><Text style={styles.backText}>Back to {source === 'closet' ? 'my closet' : 'brand pieces'}</Text></Pressable>}
      <View style={styles.productTitleRow}><View><Text style={styles.productName}>{item.name}</Text>{item.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}</View>{item.price > 0 && <Text style={styles.price}>${item.price}</Text>}</View>
      <View style={styles.swatches}>{(item.kind === 'bag' ? [item.tone, '#E7D5B8', '#14213F'] : colors.slice(0, 4)).map((swatch) => <Pressable key={swatch} accessibilityRole="button" accessibilityLabel={`Select color ${swatch}`} onPress={() => setColor(swatch)} style={[styles.swatchOuter, color === swatch && styles.selectedSwatch]}><View style={[styles.swatch, { backgroundColor: swatch }]} /></Pressable>)}</View>
      <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => setFavorite(!favorite)} style={styles.favoriteButton}><SymbolView name={{ ios: favorite ? 'heart.fill' : 'heart', android: favorite ? 'favorite' : 'favorite_border', web: favorite ? 'favorite' : 'favorite_border' }} tintColor={Colors.light.primary} size={22} /></Pressable><Pressable style={styles.primaryButton} onPress={() => Alert.alert(item.name, item.brand ? 'Partner checkout is coming soon.' : 'Added to your outfit.')}><Text style={styles.primaryText}>{item.brand ? 'Buy now' : 'Add to outfit'}</Text></Pressable></View>
    </View> : <View style={styles.pickerPanel}>
      <View style={styles.pickerHeading}><Text style={styles.pickerTitle}>Choose a piece</Text><Text style={styles.pickerCaption}>Shoes and accessories from your closet and Shop</Text></View>
      <View style={styles.sourceRow}><Pressable onPress={() => setSource('closet')} style={[styles.sourceButton, source === 'closet' && styles.activeButton]}><Text style={[styles.sourceText, source === 'closet' && styles.activeText]}>My closet</Text></Pressable><Pressable onPress={() => setSource('brand')} style={[styles.sourceButton, source === 'brand' && styles.activeButton]}><Text style={[styles.sourceText, source === 'brand' && styles.activeText]}>Brand pieces</Text></Pressable></View>
      <View style={styles.categoryRow}><Pressable onPress={() => setCategory('Shoes')} style={[styles.categoryButton, category === 'Shoes' && styles.activeButton]}><SymbolView name={{ ios: 'shoe', android: 'steps', web: 'steps' }} tintColor={category === 'Shoes' ? '#FFFFFF' : Colors.light.primary} size={17} /><Text style={[styles.sourceText, category === 'Shoes' && styles.activeText]}>Shoes</Text></Pressable><Pressable onPress={() => setCategory('Accessories')} style={[styles.categoryButton, category === 'Accessories' && styles.activeButton]}><AccessoriesIcon size={17} color={category === 'Accessories' ? '#FFFFFF' : Colors.light.primary} /><Text style={[styles.sourceText, category === 'Accessories' && styles.activeText]}>Accessories</Text></Pressable></View>
      {items.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemList}>{items.map((product) => <Pressable key={product.name} onPress={() => choose(product)} style={styles.itemCard}><View style={[styles.itemArt, { backgroundColor: product.tile }]}><View style={styles.categoryIcon}>{product.kind === 'bag' ? <AccessoriesIcon size={14} color={Colors.light.primary} /> : <SymbolView name={{ ios: 'shoe', android: 'steps', web: 'steps' }} tintColor={Colors.light.primary} size={14} />}</View><ShopProductIllustration item={product} /></View><Text numberOfLines={1} style={styles.itemName}>{product.name}</Text><Text style={styles.itemPrice}>{source === 'brand' ? `$${product.price}` : 'Your closet'}</Text></Pressable>)}</ScrollView> : <Text style={styles.emptyText}>No {category.toLowerCase()} in {source === 'closet' ? 'your closet' : 'Shop'} yet.</Text>}
    </View>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.canvas },
  cameraArea: { flex: 1, minHeight: 380, backgroundColor: '#12213F', overflow: 'hidden' }, cameraGlow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, alignSelf: 'center', top: '20%', backgroundColor: '#1C3558' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10 }, roundButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }, productPill: { maxWidth: '62%', height: 46, paddingHorizontal: 14, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.16)' }, productPillText: { color: '#FFFFFF', fontFamily: Typeface.bodyStrong, fontSize: 14 }, cameraStatus: { alignSelf: 'center', marginTop: 15, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.light.sand }, cameraStatusText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 12 }, preview: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, productPreview: { width: 300, height: 210, borderRadius: 34, alignItems: 'center', justifyContent: 'center' }, previewHint: { alignItems: 'center', gap: 12 }, previewHintText: { color: '#FFFFFF', fontFamily: Typeface.body, fontSize: 15 },
  detailPanel: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: Colors.light.canvas }, backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 9 }, backText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 }, productTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, productName: { color: Colors.light.primary, fontFamily: Typeface.display, fontSize: 21 }, brand: { color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 13 }, price: { color: Colors.light.primary, fontFamily: Typeface.bodyStrong, fontSize: 19 }, swatches: { flexDirection: 'row', gap: 9, marginTop: 11 }, swatchOuter: { width: 42, height: 42, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' }, selectedSwatch: { borderColor: Colors.light.primary }, swatch: { width: 33, height: 33, borderRadius: 17, borderWidth: 1, borderColor: Colors.light.border }, actions: { flexDirection: 'row', gap: 11, alignItems: 'center', marginTop: 12 }, favoriteButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, primaryButton: { flex: 1, height: 54, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary }, primaryText: { color: '#FFFFFF', fontFamily: Typeface.bodyStrong, fontSize: 15 },
  pickerPanel: { paddingTop: 18, paddingBottom: 22, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: Colors.light.canvas }, pickerHeading: { paddingHorizontal: 22, marginBottom: 12 }, pickerTitle: { color: Colors.light.primary, fontFamily: Typeface.display, fontSize: 21 }, pickerCaption: { color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 12 }, sourceRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 22 }, sourceButton: { height: 40, paddingHorizontal: 16, borderRadius: 22, borderWidth: 2, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, sourceText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 }, activeButton: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, activeText: { color: '#FFFFFF' }, categoryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, marginTop: 10 }, categoryButton: { height: 36, flexDirection: 'row', gap: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.light.border, alignItems: 'center', backgroundColor: '#FFFFFF' }, itemList: { gap: 10, paddingHorizontal: 22, paddingTop: 12 }, itemCard: { width: 128, padding: 9, borderRadius: 21, backgroundColor: '#FFFFFF' }, itemArt: { height: 83, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, categoryIcon: { position: 'absolute', left: 6, top: 6, zIndex: 1, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, itemName: { marginTop: 6, color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 }, itemPrice: { color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 12 }, emptyText: { marginHorizontal: 22, marginTop: 16, color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 13 },
});
