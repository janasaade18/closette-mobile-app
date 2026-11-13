import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { PasswordChangeForm } from '@/features/auth/components/PasswordChangeForm';
import { authErrorMessage } from '@/features/auth/userProfile';
import { Field, PrimaryButton, ProgressLabel, StatusBlock } from '@/features/brands/components/FormKit';
import {
  optionalEmail,
  optionalInstagram,
  optionalPhone,
  optionalPlace,
  optionalUrl,
} from '@/features/brands/profileFields';
import {
  fetchBrand,
  fetchBrandStats,
  pickCatalogImage,
  updateBrandProfile,
} from '@/features/catalog/api';
import { BRAND_CATEGORIES, type CatalogBrand } from '@/features/catalog/types';

export default function BrandProfileScreen() {
  const router = useRouter();
  const { brandId, brandActive, profile, signOut } = useAuth();
  const [brand, setBrand] = useState<CatalogBrand | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const loaded = useRef(false);

  const applyBrand = (next: CatalogBrand) => {
    setBrand(next);
    setName(next.name);
    setDescription(next.description ?? '');
    setCategory(next.category);
    setWebsite(next.website ?? '');
    setInstagram(next.instagram ?? '');
    setContactEmail(next.contactEmail ?? '');
    setPhone(next.phone ?? '');
    setCity(next.city ?? '');
    setCountry(next.country ?? '');
    setLogoUri(null);
    setCoverUri(null);
    setRemoveLogo(false);
    setRemoveCover(false);
  };

  const load = useCallback(async () => {
    if (!brandId || loaded.current) return;
    try {
      setError(null);
      const next = await fetchBrand(brandId);
      if (!next) {
        setBrand(null);
        return;
      }
      applyBrand(next);
      setStats(await fetchBrandStats(brandId));
      loaded.current = true;
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    if (!brandId || !name.trim()) {
      setError('Enter a brand name.');
      return;
    }
    const websiteResult = optionalUrl(website, 'website');
    const instagramResult = optionalInstagram(instagram);
    const emailResult = optionalEmail(contactEmail);
    const phoneResult = optionalPhone(phone);
    const cityResult = optionalPlace(city, 'City');
    const countryResult = optionalPlace(country, 'Country');
    const fieldError =
      websiteResult.error ||
      instagramResult.error ||
      emailResult.error ||
      phoneResult.error ||
      cityResult.error ||
      countryResult.error;
    if (fieldError) {
      setError(fieldError);
      return;
    }

    setBusy(true);
    setError(null);
    setSaved(null);
    setProgress(0);
    try {
      const next = await updateBrandProfile({
        brandId,
        name: name.trim(),
        description: description.trim() || null,
        category,
        website: websiteResult.value,
        instagram: instagramResult.value,
        contactEmail: emailResult.value,
        phone: phoneResult.value,
        city: cityResult.value,
        country: countryResult.value,
        logoUri,
        coverUri,
        removeLogo,
        removeCover,
        onProgress: setProgress,
      });
      applyBrand(next);
      setSaved('Profile saved.');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    Alert.alert('Log out?', 'You can sign in again whenever you want.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/sign-in'));
        },
      },
    ]);
  };

  const logoPreview = removeLogo ? null : logoUri || brand?.logoUrl;
  const coverPreview = removeCover ? null : coverUri || brand?.coverUrl;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Brand profile</Text>
        {loading ? <StatusBlock title="Loading profile" /> : null}
        {!loading && error && !brand ? (
          <StatusBlock title="Could not load profile" body={error} actionLabel="Try again" onAction={() => void load()} />
        ) : null}
        {!brandActive ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>This brand is inactive. Shoppers cannot see the catalog.</Text>
          </View>
        ) : null}

        {brand ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void pickCatalogImage([16, 9]).then((uri) => {
                  if (!uri) return;
                  setCoverUri(uri);
                  setRemoveCover(false);
                });
              }}>
              {coverPreview ? (
                <Image source={{ uri: coverPreview }} style={styles.cover} />
              ) : (
                <View style={styles.cover}>
                  <Text style={styles.hint}>Add a cover</Text>
                </View>
              )}
            </Pressable>
            {coverPreview ? (
              <Pressable accessibilityRole="button" onPress={() => { setCoverUri(null); setRemoveCover(true); }}>
                <Text style={styles.link}>Remove cover</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void pickCatalogImage([1, 1]).then((uri) => {
                  if (!uri) return;
                  setLogoUri(uri);
                  setRemoveLogo(false);
                });
              }}>
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={styles.logo} />
              ) : (
                <View style={styles.logo}>
                  <Text style={styles.letter}>{name.slice(0, 1).toUpperCase() || 'B'}</Text>
                </View>
              )}
            </Pressable>
            {logoPreview ? (
              <Pressable accessibilityRole="button" onPress={() => { setLogoUri(null); setRemoveLogo(true); }}>
                <Text style={styles.link}>Remove logo</Text>
              </Pressable>
            ) : null}

            <Text style={styles.stats}>{stats.total} products · {stats.active} active</Text>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field label="Description" value={description} onChangeText={setDescription} multiline />
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {BRAND_CATEGORIES.map((item) => (
                <Pressable key={item} onPress={() => setCategory(category === item ? null : item)} style={[styles.chip, category === item && styles.chipOn]}>
                  <Text style={[styles.chipText, category === item && styles.chipTextOn]}>{item}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" autoCorrect={false} />
            <Field label="Instagram" value={instagram} onChangeText={setInstagram} autoCapitalize="none" autoCorrect={false} />
            <Field label="Contact email" value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="City" value={city} onChangeText={setCity} />
            <Field label="Country" value={country} onChangeText={setCountry} />
            {busy ? <ProgressLabel value={progress} /> : null}
            {saved ? <Text style={styles.saved}>{saved}</Text> : null}
            {error && brand ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Save profile" onPress={() => void save()} busy={busy} />
            <PrimaryButton label="Preview as users see it" onPress={() => router.push({ pathname: '/brand/preview', params: { brandId } })} />

            <Text style={styles.section}>Account</Text>
            <Text style={styles.email}>{profile?.email}</Text>
            <PasswordChangeForm />
            <PrimaryButton label="Log out" onPress={logout} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 20, paddingBottom: 120, gap: 12 },
  title: { fontFamily: Typeface.display, fontSize: 32, color: Colors.light.primary },
  banner: { padding: 12, borderRadius: 16, backgroundColor: Colors.light.sandTile },
  bannerText: { fontFamily: Typeface.body, color: Colors.light.primary, lineHeight: 20 },
  cover: { height: 140, borderRadius: 22, backgroundColor: Colors.light.softBlue, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: Typeface.body, color: Colors.light.textSecondary },
  logo: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.softBlue, overflow: 'hidden' },
  letter: { fontFamily: Typeface.display, fontSize: 28, color: Colors.light.primary },
  link: { fontFamily: Typeface.bodyStrong, color: Colors.light.primary },
  stats: { fontFamily: Typeface.body, color: Colors.light.textSecondary },
  label: { color: Colors.light.primary, fontFamily: Typeface.bodyStrong, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement, borderWidth: 1, borderColor: Colors.light.border },
  chipOn: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontFamily: Typeface.body, color: Colors.light.primary },
  chipTextOn: { color: Colors.light.onPrimary },
  saved: { fontFamily: Typeface.body, color: Colors.light.primary },
  error: { color: Colors.light.rust, fontFamily: Typeface.body },
  section: { fontFamily: Typeface.display, fontSize: 24, color: Colors.light.primary, marginTop: 8 },
  email: { fontFamily: Typeface.body, color: Colors.light.textSecondary },
});
