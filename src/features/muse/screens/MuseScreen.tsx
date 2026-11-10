import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { authErrorMessage } from '@/features/auth/userProfile';
import {
  fetchClosetGarments,
  garmentDisplayName,
} from '@/features/closet/services/closetApi';
import type { ClosetGarment } from '@/features/closet/types';
import { GarmentCutoutTile } from '@/features/muse/components/GarmentCutoutTile';
import {
  museBaseUrl,
  recommendOutfits,
  sendOutfitFeedback,
  type MuseFeedbackAction,
  type MuseOccasion,
  type MuseOutfit,
  type MuseRecommendResponse,
  type MuseWeather,
} from '@/features/muse/services/museApi';

const OCCASIONS: { label: string; value: MuseOccasion }[] = [
  { label: 'Casual', value: 'casual' },
  { label: 'Uni', value: 'smart-casual' },
  { label: 'Work', value: 'work' },
  { label: 'Formal', value: 'formal' },
];

const WEATHER_PRESETS: { label: string; weather: MuseWeather }[] = [
  { label: '18° rain', weather: { temperature_c: 18, condition: 'rain' } },
  { label: '22° clear', weather: { temperature_c: 22, condition: 'clear' } },
  { label: '8° cold', weather: { temperature_c: 8, condition: 'cold' } },
  { label: '28° hot', weather: { temperature_c: 28, condition: 'hot' } },
];

function scoreLabel(score: number) {
  return `${Math.round(score * 100)}%`;
}

function outfitTitle(outfit: MuseOutfit, occasionLabel: string) {
  const primary = outfit.reasons?.[0];
  if (primary) return primary.replace(/\.$/, '');
  return `${occasionLabel} look`;
}

function weatherChipLabel(weather: MuseWeather) {
  const match = WEATHER_PRESETS.find(
    (preset) =>
      preset.weather.temperature_c === weather.temperature_c &&
      preset.weather.condition === weather.condition,
  );
  if (match) return match.label;
  const temp =
    typeof weather.temperature_c === 'number' ? `${weather.temperature_c}°` : '';
  const condition = weather.condition ? ` ${weather.condition}` : '';
  return `${temp}${condition}`.trim() || 'Weather';
}

export default function MuseScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const [garments, setGarments] = useState<ClosetGarment[]>([]);
  const [result, setResult] = useState<MuseRecommendResponse | null>(null);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<MuseOccasion>('smart-casual');
  const [weather, setWeather] = useState<MuseWeather>(WEATHER_PRESETS[0].weather);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  const garmentById = useMemo(() => {
    const map = new Map<string, ClosetGarment>();
    for (const garment of garments) map.set(garment.id, garment);
    return map;
  }, [garments]);

  const occasionLabel =
    OCCASIONS.find((entry) => entry.value === occasion)?.label ?? 'Casual';

  const loadRecommendations = useCallback(async () => {
    if (!user?.id) {
      setGarments([]);
      setResult(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const rows = await fetchClosetGarments(user.id);
      setGarments(rows);

      if (rows.length === 0) {
        setResult({
          api_version: 'v1',
          model_version: 'muse-v1',
          status: 'empty_wardrobe',
          recommendation_id: '',
          recommendations: [],
          message: 'Add garments to your closet to get Muse outfits.',
        });
        setSelectedOutfitId(null);
        return;
      }

      const next = await recommendOutfits({
        userId: user.id,
        wardrobe: rows,
        occasion,
        weather,
        limit: 3,
        profile,
      });
      setResult(next);
      setSelectedOutfitId(next.recommendations[0]?.outfit_id ?? null);
      setIsSaved(false);
      setIsLiked(false);
    } catch (err) {
      setError(authErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, occasion, weather, profile]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadRecommendations();
    }, [loadRecommendations]),
  );

  const featured = useMemo(() => {
    if (!result?.recommendations?.length) return null;
    return (
      result.recommendations.find((outfit) => outfit.outfit_id === selectedOutfitId) ??
      result.recommendations[0]
    );
  }, [result, selectedOutfitId]);

  const moreOutfits = useMemo(() => {
    if (!result?.recommendations?.length || !featured) return [];
    return result.recommendations.filter(
      (outfit) => outfit.outfit_id !== featured.outfit_id,
    );
  }, [result, featured]);

  const featuredPieces = useMemo(() => {
    if (!featured) return [];
    const roles = featured.roles ?? {};
    const order = ['top', 'one_piece', 'bottom', 'outerwear', 'footwear', 'accessory'];
    const seen = new Set<string>();
    const pieces: Array<{ role: string; garment?: ClosetGarment }> = [];
    for (const role of order) {
      const id = roles[role];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      pieces.push({ role, garment: garmentById.get(id) });
    }
    for (const id of featured.items ?? []) {
      if (seen.has(id)) continue;
      seen.add(id);
      pieces.push({ role: 'top', garment: garmentById.get(id) });
    }
    return pieces;
  }, [featured, garmentById]);

  const pickOccasion = () => {
    Alert.alert(
      'Occasion',
      'Choose an occasion for your outfit.',
      [
        ...OCCASIONS.map((entry) => ({
          text: entry.label,
          onPress: () => setOccasion(entry.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  const pickWeather = () => {
    Alert.alert(
      'Weather',
      'Pick a weather context for Muse.',
      [
        ...WEATHER_PRESETS.map((entry) => ({
          text: entry.label,
          onPress: () => setWeather(entry.weather),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  const describePiece = (piece?: { role: string; garment?: ClosetGarment }) => {
    if (!piece?.garment) {
      Alert.alert('Muse', 'That piece is missing from your closet.');
      return;
    }
    Alert.alert(
      garmentDisplayName(piece.garment),
      `${piece.role.replace('_', ' ')} · from your closet`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'Open closet',
          onPress: () => router.push('/closet'),
        },
      ],
    );
  };

  const sendFeedback = async (action: MuseFeedbackAction) => {
    if (!featured || !result?.recommendation_id || !user?.id) return;
    setFeedbackBusy(true);
    try {
      await sendOutfitFeedback({
        recommendationId: result.recommendation_id,
        outfitId: featured.outfit_id,
        action,
        userId: user.id,
      });
      if (action === 'save') {
        setIsSaved(true);
        Alert.alert('Saved', 'Outfit saved for Muse to learn from.');
      }
      if (action === 'like') {
        setIsLiked(true);
        Alert.alert('Liked', 'Muse will prefer looks like this.');
      }
      if (action === 'dislike' || action === 'dismiss') {
        Alert.alert('Got it', 'Muse will weigh that next time.');
        const remaining = (result.recommendations ?? []).filter(
          (outfit) => outfit.outfit_id !== featured.outfit_id,
        );
        if (remaining.length) {
          setSelectedOutfitId(remaining[0].outfit_id);
          setIsSaved(false);
          setIsLiked(false);
        } else {
          setRefreshing(true);
          void loadRecommendations();
        }
      }
    } catch (err) {
      Alert.alert('Muse', authErrorMessage(err));
    } finally {
      setFeedbackBusy(false);
    }
  };

  const tryOn = () => {
    const footwear = featuredPieces.find((piece) => piece.role === 'footwear')?.garment;
    const product = footwear
      ? garmentDisplayName(footwear)
      : featuredPieces[0]?.garment
        ? garmentDisplayName(featuredPieces[0].garment)
        : 'Outfit';
    router.push({
      pathname: '/miroir',
      params: {
        product,
        category: footwear ? 'Shoes' : 'Closet',
        source: 'closet',
        returnTo: '/muse',
      },
    });
  };

  const statusMessage = (() => {
    if (error) return error;
    if (!user) return 'Sign in to get outfits from your closet.';
    if (loading) return null;
    if (result?.status === 'empty_wardrobe') {
      return 'Your closet is empty. Add a few pieces, then Muse can dress you.';
    }
    if (result?.status === 'insufficient_candidates') {
      return 'Need a top, bottom, and shoes (or a one-piece and shoes) in your closet.';
    }
    if (!featured) return 'No outfits yet.';
    return null;
  })();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View pointerEvents="none" style={styles.topOrb} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadRecommendations();
              }}
              tintColor={Colors.light.primary}
            />
          }>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Muse</Text>
              <Text style={styles.subtitle}>Outfits built from your closet</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chat with Muse"
              hitSlop={8}
              style={styles.chatButton}
              onPress={() => router.push('/muse-chat' as const)}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                tintColor={Colors.light.onPrimary}
                size={21}
              />
              <Text style={styles.chatButtonText}>Ask Muse</Text>
            </Pressable>
          </View>

          <View style={styles.filters}>
            <Pressable style={styles.darkChip} onPress={pickWeather}>
              <SymbolView
                name={{ ios: 'umbrella.fill', android: 'umbrella', web: 'umbrella' }}
                tintColor={Colors.light.onPrimary}
                size={14}
              />
              <Text style={styles.darkChipText}>{weatherChipLabel(weather)}</Text>
            </Pressable>
            <Pressable style={styles.darkChip} onPress={pickOccasion}>
              <Text style={styles.darkChipText}>{occasionLabel}</Text>
            </Pressable>
            <Pressable
              style={styles.editChip}
              onPress={() => {
                setRefreshing(true);
                void loadRecommendations();
              }}>
              <Text style={styles.editText}>Refresh</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.stateText}>Asking Muse…</Text>
            </View>
          ) : statusMessage ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateText}>{statusMessage}</Text>
              {error ? (
                <Text style={styles.hostHint}>Expected Muse at {museBaseUrl()}</Text>
              ) : null}
              {!user ? null : result?.status === 'empty_wardrobe' ? (
                <Pressable style={styles.tryButton} onPress={() => router.push('/closet')}>
                  <Text style={styles.tryText}>Open closet</Text>
                </Pressable>
              ) : null}
            </View>
          ) : featured ? (
            <>
              <View style={styles.featureCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.outfitTitle} numberOfLines={2}>
                    {outfitTitle(featured, occasionLabel)}
                  </Text>
                  <View style={styles.score}>
                    <Text style={styles.scoreText}>{scoreLabel(featured.score)}</Text>
                  </View>
                </View>

                <View style={styles.outfitGrid}>
                  <Pressable
                    style={styles.mainTilePress}
                    onPress={() => describePiece(featuredPieces[0])}>
                    <GarmentCutoutTile
                      garment={featuredPieces[0]?.garment}
                      role={featuredPieces[0]?.role ?? 'top'}
                      background={Colors.light.softBlue}
                      style={styles.mainTile}
                    />
                  </Pressable>
                  <View style={styles.sideTiles}>
                    <Pressable onPress={() => describePiece(featuredPieces[1])}>
                      <GarmentCutoutTile
                        garment={featuredPieces[1]?.garment}
                        role={featuredPieces[1]?.role ?? 'bottom'}
                        background={Colors.light.sand}
                        style={styles.sideTile}
                      />
                    </Pressable>
                    <Pressable onPress={() => describePiece(featuredPieces[2])}>
                      <GarmentCutoutTile
                        garment={featuredPieces[2]?.garment}
                        role={featuredPieces[2]?.role ?? 'footwear'}
                        background={Colors.light.softBlue}
                        style={styles.sideTile}
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.tags}>
                  {(featured.reasons?.length
                    ? featured.reasons.slice(0, 2)
                    : ['Built from your closet']
                  ).map((reason) => (
                    <View key={reason} style={styles.tag}>
                      <Text style={styles.tagText}>{reason}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.actions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Save outfit"
                    disabled={feedbackBusy}
                    onPress={() => void sendFeedback('save')}
                    style={styles.roundAction}>
                    <SymbolView
                      name={{
                        ios: isSaved ? 'bookmark.fill' : 'bookmark',
                        android: isSaved ? 'bookmark' : 'bookmark_border',
                        web: isSaved ? 'bookmark' : 'bookmark_border',
                      }}
                      tintColor={Colors.light.primary}
                      size={21}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Like outfit"
                    disabled={feedbackBusy}
                    onPress={() => void sendFeedback('like')}
                    style={styles.roundAction}>
                    <SymbolView
                      name={{
                        ios: isLiked ? 'heart.fill' : 'heart',
                        android: isLiked ? 'favorite' : 'favorite_border',
                        web: isLiked ? 'favorite' : 'favorite_border',
                      }}
                      tintColor={Colors.light.primary}
                      size={22}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss outfit"
                    disabled={feedbackBusy}
                    onPress={() => void sendFeedback('dismiss')}
                    style={styles.roundAction}>
                    <SymbolView
                      name={{ ios: 'xmark', android: 'close', web: 'close' }}
                      tintColor={Colors.light.primary}
                      size={20}
                    />
                  </Pressable>
                  <Pressable style={styles.tryButton} onPress={tryOn}>
                    <Text style={styles.tryText}>Try it on</Text>
                  </Pressable>
                </View>
              </View>

              {moreOutfits.length ? (
                <>
                  <Text style={styles.moreTitle}>More from Muse</Text>
                  <View style={styles.suggestions}>
                    {moreOutfits.map((outfit) => {
                      const firstId = outfit.items?.[0];
                      const first = firstId ? garmentById.get(firstId) : undefined;
                      return (
                        <Pressable
                          key={outfit.outfit_id}
                          style={styles.suggestion}
                          onPress={() => {
                            setSelectedOutfitId(outfit.outfit_id);
                            setIsSaved(false);
                            setIsLiked(false);
                          }}>
                          <GarmentCutoutTile
                            garment={first}
                            role="top"
                            background={Colors.light.canvas}
                            compact
                            style={styles.suggestionTile}
                          />
                          <Text style={styles.suggestionLabel}>
                            {scoreLabel(outfit.score)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  content: { paddingHorizontal: PageGutter, paddingTop: 25, paddingBottom: 130 },
  topOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -38,
    top: -58,
    backgroundColor: Colors.light.warmOrb,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatButton: {
    height: 48,
    borderRadius: 25,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.light.primary,
  },
  chatButtonText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 14,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontFamily: Typeface.display,
    color: Colors.light.primary,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 17,
  },
  darkChip: {
    minHeight: 43,
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
  },
  darkChipText: {
    fontFamily: Typeface.body,
    fontSize: 14,
    color: Colors.light.onPrimary,
  },
  editChip: {
    minHeight: 43,
    minWidth: 70,
    borderWidth: 2,
    borderColor: Colors.light.outlineBlue,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  editText: {
    fontFamily: Typeface.body,
    color: Colors.light.primary,
    fontSize: 14,
  },
  stateBlock: {
    padding: 24,
    borderRadius: 30,
    backgroundColor: Colors.light.backgroundElement,
    gap: 12,
    alignItems: 'flex-start',
  },
  stateText: {
    fontFamily: Typeface.body,
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  hostHint: {
    fontFamily: Typeface.body,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  featureCard: {
    padding: 21,
    borderRadius: 30,
    backgroundColor: Colors.light.backgroundElement,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 12,
  },
  outfitTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typeface.display,
    color: Colors.light.primary,
  },
  score: {
    minWidth: 60,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  scoreText: {
    color: Colors.light.onPrimary,
    fontSize: 14,
    fontFamily: Typeface.body,
  },
  outfitGrid: { flexDirection: 'row', gap: 10, height: 148 },
  mainTilePress: { flex: 1.05 },
  mainTile: { flex: 1, height: 148 },
  sideTiles: { flex: 1, gap: 10 },
  sideTile: { height: 69, borderRadius: 25 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13, marginBottom: 16 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.canvas,
  },
  tagText: { fontSize: 12, fontFamily: Typeface.body, color: Colors.light.primary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roundAction: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Colors.light.outlineBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  tryButton: {
    flex: 1,
    height: 56,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    alignSelf: 'stretch',
  },
  tryText: {
    color: Colors.light.onPrimary,
    fontSize: 16,
    fontFamily: Typeface.bodyStrong,
  },
  moreTitle: {
    marginTop: 19,
    marginBottom: 10,
    fontSize: 19,
    fontFamily: Typeface.display,
    color: Colors.light.primary,
  },
  suggestions: { flexDirection: 'row', gap: 12 },
  suggestion: {
    flex: 1,
    height: 128,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
    paddingTop: 10,
    gap: 4,
  },
  suggestionTile: { width: 72, height: 72 },
  suggestionLabel: {
    color: Colors.light.textSecondary,
    fontFamily: Typeface.body,
    fontSize: 13,
  },
});
