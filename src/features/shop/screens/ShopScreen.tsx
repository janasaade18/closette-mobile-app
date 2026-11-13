import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useCatalogResource } from '@/features/catalog/useCatalogResource';
import { fetchActiveBrands } from '@/features/catalog/api';
import { StatusBlock } from '@/features/brands/components/FormKit';

export default function ShopScreen() {
  const router = useRouter();
  const { data: brands, loading, error, reload } = useCatalogResource(fetchActiveBrands);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return brands.filter((brand) => {
      if (!search) return true;
      return [brand.name, brand.description ?? ''].join(' ').toLowerCase().includes(search);
    });
  }, [brands, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {searchOpen ? (
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search brands"
              placeholderTextColor={Colors.light.textSecondary}
              style={styles.searchInput}
            />
          ) : (
            <Text style={styles.title}>Shop</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={searchOpen ? 'Close search' : 'Search brands'}
            onPress={() => {
              setSearchOpen(!searchOpen);
              if (searchOpen) setQuery('');
            }}
            style={styles.icon}>
            <SymbolView
              name={{
                ios: searchOpen ? 'xmark' : 'magnifyingglass',
                android: searchOpen ? 'close' : 'search',
                web: searchOpen ? 'close' : 'search',
              }}
              tintColor={Colors.light.primary}
              size={22}
            />
          </Pressable>
        </View>

        {loading ? <StatusBlock title="Loading brands" /> : null}
        {!loading && error ? (
          <StatusBlock title="Could not load brands" body={error} actionLabel="Try again" onAction={() => void reload()} />
        ) : null}
        {!loading && !error && visible.length === 0 ? (
          <StatusBlock
            title="No products yet"
            body={query.trim() ? 'No brands match that search.' : 'Brand catalogs will show up here after they upload products.'}
          />
        ) : null}

        {visible.map((brand) => (
          <Pressable
            key={brand.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${brand.name}`}
            onPress={() => router.push({ pathname: '/brands/[brandId]', params: { brandId: brand.id } })}
            style={styles.card}>
            {brand.logoUrl ? (
              <Image source={{ uri: brand.logoUrl }} style={styles.logo} contentFit="cover" />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoLetter}>{brand.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.copy}>
              <Text style={styles.name}>{brand.name}</Text>
              {brand.description ? (
                <Text numberOfLines={2} style={styles.description}>
                  {brand.description}
                </Text>
              ) : null}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 20, paddingBottom: 125, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { fontFamily: Typeface.display, fontSize: 34, lineHeight: 44, color: Colors.light.primary },
  icon: {
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
  card: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    backgroundColor: Colors.light.backgroundElement,
  },
  logo: { width: 72, height: 72, borderRadius: 20 },
  logoFallback: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.softBlue,
  },
  logoLetter: { fontFamily: Typeface.display, fontSize: 26, color: Colors.light.primary },
  copy: { flex: 1, gap: 4 },
  name: { fontFamily: Typeface.bodyStrong, fontSize: 18, color: Colors.light.primary },
  description: { fontFamily: Typeface.body, fontSize: 13, lineHeight: 18, color: Colors.light.textSecondary },
});
