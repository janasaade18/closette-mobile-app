import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';

import { Colors, Typeface } from '@/constants/theme';
import AccessoriesIcon from '@/components/AccessoriesIcon';
import ShopProductIllustration from '@/features/shop/components/ShopProductIllustration';
import { shopProducts, type ShopProduct } from '@/features/shop/data/products';

type TryOnCategory = 'Shoes' | 'Accessories';
type TryOnSource = 'closet' | 'brand';
type TryOnKind = 'shoe' | 'bag';
type TryOnItem = { id: string; name: string; price?: string; brand?: string; category: TryOnCategory; kind: TryOnKind; colors: string[]; mark: string; catalogProduct?: ShopProduct };

const closetItems: TryOnItem[] = [
  { id: 'closet-sneakers', name: 'Sneakers', category: 'Shoes', kind: 'shoe', colors: [Colors.light.navySwatch, Colors.light.sand, Colors.light.blueSlate], mark: 'C' },
];
const palette = [Colors.light.navySwatch, Colors.light.sand, Colors.light.blueSlate, Colors.light.background];
const brandItems: TryOnItem[] = shopProducts
  .filter((product) => product.category === 'Shoes' || product.category === 'Bags')
  .map((product) => ({
    id: `brand-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: product.name,
    price: String(product.price),
    brand: product.brand,
    category: product.category === 'Bags' ? 'Accessories' : 'Shoes',
    kind: product.kind === 'bag' ? 'bag' : 'shoe',
    colors: [product.tone, ...palette.filter((color) => color !== product.tone)],
    mark: product.mark,
    catalogProduct: product,
  }));
function getDirectItem(name: string, category: string, price: string, source: string): TryOnItem | null {
  const allItems = [...closetItems, ...brandItems];
  const found = allItems.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (found) return { ...found, price: source === 'brand' ? price || found.price : undefined, brand: source === 'brand' ? found.brand : undefined };
  if (source === 'brand') return null;
  const isAccessory = category === 'Bags' || category === 'Accessories' || /bag|tote/i.test(name);
  if (!isAccessory && category !== 'Shoes' && !/shoe|sneaker/i.test(name)) return null;
  return { id: `selected-${name}`, name, category: isAccessory ? 'Accessories' : 'Shoes', kind: isAccessory ? 'bag' : 'shoe', colors: palette, mark: 'C' };
}

export default function MiroirScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ product?: string; price?: string; category?: string; returnTo?: string; mode?: string; source?: string }>();
  const pathname = usePathname();
  const isFocused = pathname.endsWith('/miroir');
  const isBrowseFlow = params.mode === 'browse';
  const initialSource: TryOnSource = params.source === 'brand' ? 'brand' : 'closet';
  const initialCategory: TryOnCategory = params.category === 'Bags' || params.category === 'Accessories' ? 'Accessories' : 'Shoes';
  const directItem = isBrowseFlow ? null : getDirectItem(params.product || 'Cloud', params.category || 'Shoes', params.price || '89', params.source || (params.price ? 'brand' : 'closet'));
  const [source, setSource] = useState<TryOnSource>(initialSource);
  const [category, setCategory] = useState<TryOnCategory>(initialCategory);
  const [selectedItem, setSelectedItem] = useState<TryOnItem | null>(directItem);
  const [selectedColor, setSelectedColor] = useState(selectedItem?.colors[0] || palette[0]);
  const [position, setPosition] = useState<'back' | 'front'>('back');
  const [isFavorite, setIsFavorite] = useState(false);
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(position);
  const photoOutput = usePhotoOutput({ quality: 0.9 });

  useEffect(() => {
    if (!hasPermission && canRequestPermission) void requestPermission();
  }, [canRequestPermission, hasPermission, requestPermission]);
  const returnTo = typeof params.returnTo === 'string' ? params.returnTo : '/shop';
  const close = () => {
    switch (returnTo) {
      case '/home': router.replace('/home'); break;
      case '/muse': router.replace('/muse'); break;
      case '/muse-chat': router.replace('/muse-chat'); break;
      default: router.replace('/shop');
    }
  };
  const availableItems = (source === 'closet' ? closetItems : brandItems).filter((item) => item.category === category);
  const isBrandItem = selectedItem ? Boolean(selectedItem.price || selectedItem.brand) : source === 'brand';
  const guideText = !selectedItem ? `Choose ${category === 'Shoes' ? 'shoes' : 'an accessory'} to try on` : selectedItem.kind === 'shoe' ? 'Align your feet in the frame' : 'Position the bag in the frame';

  const chooseItem = (item: TryOnItem) => {
    setSelectedItem(item);
    setSelectedColor(item.colors[0]);
    setIsFavorite(false);
  };
  const capturePreview = async () => {
    try {
      const photo = await photoOutput.capturePhoto({ enableShutterSound: false }, {});
      const path = await photo.saveToTemporaryFileAsync();
      photo.dispose();
      Alert.alert('Preview captured', `Your try-on photo was saved temporarily at ${path}.`);
    } catch {
      Alert.alert('Could not capture photo', 'Check that the camera is ready and try again.');
    }
  };

  if (!hasPermission) {
    return <SafeAreaView style={styles.permissionScreen}>
      <Pressable onPress={close} style={styles.permissionClose}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={Colors.light.onPrimary} size={22} /></Pressable>
      <View style={styles.permissionMessage}><Text style={styles.permissionTitle}>Camera access needed</Text><Text style={styles.permissionText}>Allow camera access to preview shoes and accessories in Miroir.</Text><Pressable style={styles.permissionButton} onPress={() => canRequestPermission ? void requestPermission() : void Linking.openSettings()}><Text style={styles.permissionButtonText}>{canRequestPermission ? 'Allow camera' : 'Open settings'}</Text></Pressable></View>
    </SafeAreaView>;
  }
  if (device == null) return <SafeAreaView style={styles.permissionScreen}><Text style={styles.permissionText}>Loading camera...</Text></SafeAreaView>;

  return <View style={styles.container}>
    <Camera style={StyleSheet.absoluteFill} device={device} isActive={isFocused} outputs={[photoOutput]} />
    <View pointerEvents="none" style={styles.cameraTint} />
    <SafeAreaView style={styles.safeOverlay} edges={['top', 'bottom']}>
      <View style={styles.topControls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close try-on" onPress={close} style={styles.iconButton}><SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} tintColor={Colors.light.onPrimary} size={22} /></Pressable>
        <Pressable onPress={() => isBrowseFlow && selectedItem ? setSelectedItem(null) : null} style={styles.productPill}><View style={styles.brandDot}>{selectedItem?.kind === 'bag' || (!selectedItem && category === 'Accessories') ? <AccessoriesIcon size={18} color={Colors.light.primary} /> : <SymbolView name={{ ios: 'shoe', android: 'steps', web: 'steps' }} tintColor={Colors.light.primary} size={16} />}</View><Text numberOfLines={1} style={styles.productPillText}>{selectedItem ? selectedItem.name : `Try on · ${category}`}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Switch camera" onPress={() => setPosition((current) => current === 'back' ? 'front' : 'back')} style={styles.iconButton}><SymbolView name={{ ios: 'camera.rotate', android: 'flip_camera_android', web: 'flip_camera_android' }} tintColor={Colors.light.onPrimary} size={22} /></Pressable>
      </View>
      <View style={styles.statusPill}><SymbolView name={{ ios: 'viewfinder', android: 'center_focus_strong', web: 'center_focus_strong' }} tintColor={Colors.light.primary} size={15} /><Text style={styles.statusText}>{guideText}</Text></View>
      <View style={styles.scanArea}>
        <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
        {selectedItem && <TryOnOverlay item={selectedItem} color={selectedColor} />}
        <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
      </View>
      {selectedItem ? <View style={styles.bottomPanel}>
        {isBrowseFlow && <Pressable onPress={() => setSelectedItem(null)} style={styles.backToItems}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={Colors.light.primary} size={15} /><Text style={styles.backToItemsText}>Back to {source === 'closet' ? 'my closet' : 'brand pieces'}</Text></Pressable>}
        <View style={styles.productTitleRow}><View style={styles.productText}><Text numberOfLines={1} style={styles.productName}>{selectedItem.name}</Text>{selectedItem.brand && <Text style={styles.brandName}>{selectedItem.brand}</Text>}</View>{selectedItem.price && <Text style={styles.price}>${selectedItem.price}</Text>}</View>
        <View style={styles.swatches}>{selectedItem.colors.map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Select color ${color}`} onPress={() => setSelectedColor(color)} style={[styles.swatchOuter, selectedColor === color && styles.selectedSwatch]}><View style={[styles.swatch, { backgroundColor: color }]} /></Pressable>)}</View>
        <View style={styles.bottomActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => setIsFavorite(!isFavorite)} style={styles.favoriteButton}><SymbolView name={{ ios: isFavorite ? 'heart.fill' : 'heart', android: isFavorite ? 'favorite' : 'favorite_border', web: isFavorite ? 'favorite' : 'favorite_border' }} tintColor={Colors.light.primary} size={22} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Capture try-on preview" onPress={() => void capturePreview()} style={styles.captureButton}><View style={styles.captureInner} /></Pressable>
          <Pressable style={styles.buyButton} onPress={() => isBrandItem ? Alert.alert(selectedItem.name, 'Partner checkout is coming soon.') : Alert.alert('Added to outfit', `${selectedItem.name} is ready to add to your outfit.`)}><Text style={styles.buyText}>{isBrandItem ? 'Buy now' : 'Add to outfit'}</Text>{isBrandItem && <SymbolView name={{ ios: 'arrow.up.right', android: 'north_east', web: 'north_east' }} tintColor={Colors.light.onPrimary} size={15} />}</Pressable>
        </View>
      </View> : <View style={styles.pickerPanel}>
        <View style={styles.sourceToggle}><Pressable onPress={() => { setSource('closet'); setCategory('Shoes'); }} style={[styles.sourceButton, source === 'closet' && styles.sourceActive]}><Text style={[styles.sourceText, source === 'closet' && styles.sourceActiveText]}>My closet</Text></Pressable><Pressable onPress={() => { setSource('brand'); setCategory('Shoes'); }} style={[styles.sourceButton, source === 'brand' && styles.sourceActive]}><Text style={[styles.sourceText, source === 'brand' && styles.sourceActiveText]}>Brand pieces</Text></Pressable></View>
        <View style={styles.categoryToggle}><Pressable onPress={() => setCategory('Shoes')} style={[styles.categoryButton, category === 'Shoes' && styles.categoryActive]}><SymbolView name={{ ios: 'shoe', android: 'steps', web: 'steps' }} tintColor={category === 'Shoes' ? Colors.light.onPrimary : Colors.light.primary} size={16} /><Text style={[styles.categoryText, category === 'Shoes' && styles.categoryActiveText]}>Shoes</Text></Pressable><Pressable onPress={() => setCategory('Accessories')} style={[styles.categoryButton, category === 'Accessories' && styles.categoryActive]}><AccessoriesIcon size={16} color={category === 'Accessories' ? Colors.light.onPrimary : Colors.light.primary} /><Text style={[styles.categoryText, category === 'Accessories' && styles.categoryActiveText]}>Accessories</Text></Pressable></View>
        {availableItems.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productList}>{availableItems.map((item) => <Pressable key={item.id} onPress={() => chooseItem(item)} style={styles.pickCard}><View style={[styles.pickImage, { backgroundColor: item.catalogProduct?.tile || Colors.light.softBlue }]}><BrandDot mark={item.mark} accessory={item.category === 'Accessories'} />{item.catalogProduct ? <ShopProductIllustration item={{ ...item.catalogProduct, tone: item.colors[0] }} /> : <TryOnOverlay item={item} color={item.colors[0]} compact />}</View><Text numberOfLines={1} style={styles.pickName}>{item.name}</Text>{item.price ? <Text style={styles.pickPrice}>${item.price}</Text> : <Text style={styles.pickPrice}>Your closet</Text>}</Pressable>)}</ScrollView> : <View style={styles.emptyPicker}><Text style={styles.emptyText}>No {category.toLowerCase()} are in {source === 'closet' ? 'your closet' : 'the brand collection'} yet.</Text></View>}
        <Text style={styles.pickerHint}>Choose a piece to see its try-on controls.</Text>
      </View>}
    </SafeAreaView>
  </View>;
}

function BrandDot({ mark, accessory = false }: { mark: string; accessory?: boolean }) {
  return <View style={styles.brandBadge}>{accessory ? <AccessoriesIcon size={14} color={Colors.light.primary} /> : <Text style={styles.brandBadgeText}>{mark}</Text>}</View>;
}

function TryOnOverlay({ item, color, compact = false }: { item: TryOnItem; color: string; compact?: boolean }) {
  if (item.catalogProduct) return <ShopProductIllustration item={{ ...item.catalogProduct, tone: color }} large={!compact} />;
  return <View pointerEvents="none" style={[styles.overlayShoe, compact && styles.compactShoe]}><View style={[styles.shoeUpper, { backgroundColor: color }, compact && styles.compactShoeUpper]} /><View style={[styles.shoeSole, compact && styles.compactSole]} /><View style={styles.shoeLace} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12213F' }, cameraTint: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(18, 33, 63, 0.48)' }, safeOverlay: { flex: 1, justifyContent: 'space-between' },
  topControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10 }, iconButton: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' }, productPill: { height: 48, maxWidth: '62%', borderRadius: 25, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)' }, brandDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FB' }, productPillText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  statusPill: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, height: 36, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#E7D5B8' }, statusText: { color: '#12263F', fontSize: 12, fontWeight: '700' }, scanArea: { flex: 1, marginHorizontal: 32, marginTop: 20, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 43, height: 43, borderColor: '#F5F7FB' }, topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 }, topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 }, bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 }, bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  overlayShoe: { width: 250, height: 120, justifyContent: 'flex-end', alignItems: 'center', marginTop: 70 }, compactShoe: { width: 86, height: 48, marginTop: 5 }, shoeUpper: { position: 'absolute', width: 225, height: 55, left: 14, bottom: 17, borderTopLeftRadius: 47, borderTopRightRadius: 28, transform: [{ skewX: '-18deg' }], opacity: 0.94 }, compactShoeUpper: { width: 74, height: 22, left: 6, bottom: 5, borderTopLeftRadius: 17 }, shoeSole: { width: 245, height: 14, borderRadius: 10, backgroundColor: '#F5F7FB' }, compactSole: { width: 84, height: 5 }, shoeLace: { position: 'absolute', width: 25, height: 6, borderRadius: 4, backgroundColor: '#F5F7FB', left: 118, bottom: 76, transform: [{ rotate: '30deg' }] },
  overlayBag: { width: 200, height: 170, alignItems: 'center', justifyContent: 'center', marginTop: 70 }, compactAccessory: { width: 65, height: 55, marginTop: 0 }, bagBody: { width: 142, height: 112, borderRadius: 22, alignItems: 'center', marginTop: 25 }, bagHandle: { position: 'absolute', top: -29, width: 72, height: 48, borderWidth: 10, borderColor: '#F5F7FB', borderBottomWidth: 0, borderTopLeftRadius: 36, borderTopRightRadius: 36 }, overlayGlasses: { width: 200, height: 84, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 65 }, compactGlasses: { width: 75, height: 35, marginTop: 0 }, glassLens: { width: 71, height: 54, borderWidth: 8, borderColor: '#F5F7FB', borderRadius: 18 }, glassBridge: { width: 22, height: 7, borderRadius: 4, backgroundColor: '#F5F7FB' }, overlayWatch: { width: 78, height: 150, alignItems: 'center', justifyContent: 'center', marginTop: 65 }, watchStrap: { position: 'absolute', width: 26, height: 140, borderRadius: 13, backgroundColor: '#E7D5B8' }, watchFace: { width: 60, height: 60, borderRadius: 18, borderWidth: 7, borderColor: '#F5F7FB', backgroundColor: '#5D7195' },
  bottomPanel: { paddingHorizontal: 22, paddingTop: 15, paddingBottom: 18, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#F5F7FB' }, backToItems: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }, backToItemsText: { color: '#12263F', fontSize: 12, fontWeight: '600' }, productTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, productText: { flex: 1 }, productName: { color: '#12263F', fontFamily: Typeface.display, fontSize: 20 }, brandName: { color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 12 }, price: { color: '#12263F', fontSize: 19, fontWeight: '700' }, swatches: { flexDirection: 'row', gap: 9, marginTop: 10 }, swatchOuter: { width: 42, height: 42, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' }, selectedSwatch: { borderColor: '#12263F' }, swatch: { width: 34, height: 34, borderRadius: 18, borderWidth: 1, borderColor: '#D8DFEB' }, bottomActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }, favoriteButton: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: '#DCE4F1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, captureButton: { width: 62, height: 62, borderRadius: 31, borderWidth: 5, borderColor: '#12263F', alignItems: 'center', justifyContent: 'center' }, captureInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F7FB' }, buyButton: { flex: 1, height: 56, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#12263F' }, buyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  pickerPanel: { minHeight: 278, paddingTop: 16, paddingBottom: 17, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: '#F5F7FB' }, sourceToggle: { flexDirection: 'row', gap: 8, paddingHorizontal: 22 }, sourceButton: { height: 42, borderRadius: 22, paddingHorizontal: 16, borderWidth: 2, borderColor: '#DCE4F1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, sourceActive: { backgroundColor: '#12263F', borderColor: '#12263F' }, sourceText: { color: '#12263F', fontFamily: Typeface.body, fontSize: 13 }, sourceActiveText: { color: '#FFFFFF' }, categoryToggle: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, marginTop: 10 }, categoryButton: { height: 32, borderRadius: 17, paddingHorizontal: 12, borderWidth: 1, borderColor: '#DCE4F1', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFFFF' }, categoryActive: { backgroundColor: '#12263F', borderColor: '#12263F' }, categoryText: { color: '#12263F', fontFamily: Typeface.body, fontSize: 12 }, categoryActiveText: { color: '#FFFFFF' }, productList: { gap: 10, paddingHorizontal: 22, paddingTop: 10 }, pickCard: { width: 112, minHeight: 110, padding: 8, borderRadius: 21, backgroundColor: '#FFFFFF' }, pickImage: { height: 68, borderRadius: 17, backgroundColor: '#DDE5F2', alignItems: 'center', justifyContent: 'center' }, brandBadge: { position: 'absolute', top: 5, left: 5, zIndex: 1, width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }, brandBadgeText: { color: '#12263F', fontSize: 11, fontWeight: '700' }, pickName: { marginTop: 5, color: '#12263F', fontFamily: Typeface.body, fontSize: 12 }, pickPrice: { marginTop: 0, color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 11 }, emptyPicker: { paddingHorizontal: 22, paddingTop: 18 }, emptyText: { color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 13 }, pickerHint: { paddingHorizontal: 22, marginTop: 8, color: Colors.light.textSecondary, fontFamily: Typeface.body, fontSize: 11 },
  permissionScreen: { flex: 1, backgroundColor: '#12213F', justifyContent: 'center', alignItems: 'center', padding: 26 }, permissionClose: { position: 'absolute', top: 60, left: 24, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' }, permissionMessage: { alignItems: 'center', gap: 12 }, permissionTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' }, permissionText: { color: '#E1E7F0', fontSize: 16, lineHeight: 23, textAlign: 'center' }, permissionButton: { marginTop: 8, paddingHorizontal: 23, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7D5B8' }, permissionButtonText: { color: '#12263F', fontSize: 15, fontWeight: '700' },
});
