import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthContext';
import {
  authErrorMessage,
  saveUserHomeLocation,
} from '@/features/auth/userProfile';
import {
  fetchClosetGarments,
  garmentDisplayName,
} from '@/features/closet/services/closetApi';
import type { ClosetGarment } from '@/features/closet/types';
import { GarmentCutoutTile } from '@/features/muse/components/GarmentCutoutTile';
import {
  DEFAULT_CHAT_CONTEXT,
  MUSE_CHAT_STARTERS,
  replyToMuseChat,
  type ChatContext,
  type ChatOutfitPayload,
} from '@/features/muse/services/museChat';
import {
  appendMuseMessage,
  createMuseThread,
  deleteMuseThread,
  listMuseThreads,
  loadMuseMemory,
  loadMuseMessages,
  saveMuseMemory,
  titleFromMessage,
  touchMuseThread,
  type MuseChatThread,
  type MuseUserMemory,
} from '@/features/muse/services/museChatStore';
import { PlacesManagerModal } from '@/features/muse/components/PlacesManagerModal';
import { resolveAutoPlace } from '@/features/muse/services/autoLocation';
import { resolveLiveWeather } from '@/features/muse/services/liveWeather';
import {
  ensureDetectedPlace,
  getActivePlace,
  placeChipLabel,
  upsertUserPlace,
  type UserPlace,
} from '@/features/muse/services/userPlaces';
import { sendOutfitFeedback } from '@/features/muse/services/museApi';
import { catalogProductById } from '@/features/catalog/api';
import { formatPrice, type CatalogProduct } from '@/features/catalog/types';

type Message = {
  id: string | number;
  from: 'user' | 'muse';
  text: string;
  outfit?: ChatOutfitPayload;
  product?: CatalogProduct;
};

const OCCASIONS: { label: string; value: ChatContext['occasion'] }[] = [
  { label: 'Casual', value: 'casual' },
  { label: 'Smart casual', value: 'smart-casual' },
  { label: 'Formal', value: 'formal' },
];

const SCHEDULES = ['Anytime', 'Tonight', 'Sat · evening', 'Sun · daytime'];

function weatherLabel(
  weather: ChatContext['weather'],
  place?: string | null,
) {
  const temp =
    typeof weather.temperature_c === 'number' ? `${weather.temperature_c}°` : '';
  const condition = weather.condition ? ` ${weather.condition}` : '';
  const base = `${temp}${condition}`.trim();
  if (place) {
    const short = place.split(',')[0]?.trim() || place;
    return base ? `${base} · ${short}` : short;
  }
  return base || 'Live weather';
}

export default function MuseChatScreen() {
  const router = useRouter();
  const { user, profile, setProfile, refreshProfile } = useAuth();
  const listRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const nextMessageId = useRef(2);
  const autoStarted = useRef(false);
  const threadIdRef = useRef<string | null>(null);
  const memoryRef = useRef<MuseUserMemory>({ summary: '', facts: [] });

  const [wardrobe, setWardrobe] = useState<ClosetGarment[]>([]);
  const [context, setContext] = useState<ChatContext>(DEFAULT_CHAT_CONTEXT);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'muse',
      text: 'Hi — I’m building a first look from your closet. You can also tap a suggestion or type anything.',
    },
  ]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<MuseChatThread[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [memory, setMemory] = useState<MuseUserMemory>({ summary: '', facts: [] });
  const [activePlace, setActivePlaceState] = useState<UserPlace | null>(null);
  const [placesManagerOpen, setPlacesManagerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingCloset, setLoadingCloset] = useState(true);

  const garmentById = useMemo(() => {
    const map = new Map<string, ClosetGarment>();
    for (const garment of wardrobe) map.set(garment.id, garment);
    return map;
  }, [wardrobe]);

  const append = useCallback((entries: Message[]) => {
    setMessages((current) => [...current, ...entries]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const busyRef = useRef(false);
  const contextRef = useRef(context);
  contextRef.current = context;
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  threadIdRef.current = threadId;
  memoryRef.current = memory;

  const ensureThread = useCallback(async () => {
    if (!user?.id) return null;
    if (threadIdRef.current) return threadIdRef.current;
    const created = await createMuseThread(user.id, {
      title: 'Muse chat',
      context: contextRef.current,
    });
    threadIdRef.current = created.id;
    setThreadId(created.id);
    return created.id;
  }, [user?.id]);

  const askMuse = useCallback(
    async (
      text: string,
      options?: { silentUser?: boolean; wardrobeOverride?: ClosetGarment[] },
    ) => {
      const prompt = text.trim();
      if (!prompt || busyRef.current) return;
      if (!user?.id) {
        Alert.alert('Sign in', 'Sign in to chat with Muse about your closet.');
        return;
      }

      const closet = options?.wardrobeOverride ?? wardrobe;
      if (!options?.silentUser) {
        append([
          {
            id: nextMessageId.current++,
            from: 'user',
            text: prompt,
          },
        ]);
        setDraft('');
      }

      busyRef.current = true;
      setBusy(true);
      try {
        const activeThreadId = await ensureThread();
        if (activeThreadId && !options?.silentUser) {
          void appendMuseMessage({
            threadId: activeThreadId,
            userId: user.id,
            role: 'user',
            content: prompt,
          }).catch(() => undefined);
          void touchMuseThread(activeThreadId, {
            title: titleFromMessage(prompt),
            context: contextRef.current,
          }).catch(() => undefined);
        }

        const history = messagesRef.current
          .filter((entry) => entry.text.trim())
          .slice(-20)
          .map((entry) => ({
            role: entry.from === 'user' ? ('user' as const) : ('assistant' as const),
            content: entry.text,
          }));
        const reply = await replyToMuseChat({
          text: prompt,
          userId: user.id,
          wardrobe: closet,
          profile,
          context: contextRef.current,
          history,
          memorySummary: memoryRef.current.summary,
          memoryFacts: memoryRef.current.facts,
        });
        setContext(reply.context);
        contextRef.current = reply.context;
        if (reply.memory) {
          setMemory(reply.memory);
          memoryRef.current = reply.memory;
          void saveMuseMemory(user.id, reply.memory).catch(() => undefined);
        }
        if (reply.homeLocation) {
          const city = reply.homeLocation;
          setContext((current) => {
            const next = {
              ...current,
              ...reply.context,
              location: city,
            };
            contextRef.current = next;
            return next;
          });
          void upsertUserPlace({
            userId: user.id,
            name: city,
            makeActive: true,
          })
            .then((place) => {
              setActivePlaceState(place);
              void refreshProfile();
            })
            .catch(() => {
              void saveUserHomeLocation(user.id, city)
                .then((nextProfile) => setProfile(nextProfile))
                .catch(() => refreshProfile());
            });
        }
        append([
          {
            id: nextMessageId.current++,
            from: 'muse',
            text: reply.text,
            outfit: reply.outfit,
            product: reply.product,
          },
        ]);
        if (activeThreadId) {
          void appendMuseMessage({
            threadId: activeThreadId,
            userId: user.id,
            role: 'muse',
            content: reply.text,
            payload: {
              outfit: reply.outfit,
              product: reply.product,
            },
          }).catch(() => undefined);
          void touchMuseThread(activeThreadId, {
            context: reply.context,
          }).catch(() => undefined);
        }
      } catch (error) {
        append([
          {
            id: nextMessageId.current++,
            from: 'muse',
            text: authErrorMessage(error),
          },
        ]);
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [append, ensureThread, profile, refreshProfile, setProfile, user?.id, wardrobe],
  );

  useEffect(() => {
    let cancelled = false;
    autoStarted.current = false;

    async function loadCloset() {
      if (!user?.id) {
        if (cancelled) return;
        setWardrobe([]);
        setLoadingCloset(false);
        setThreadId(null);
        threadIdRef.current = null;
        setMessages([
          {
            id: 1,
            from: 'muse',
            text: 'Sign in so I can style outfits from your closet.',
          },
        ]);
        return;
      }

      setLoadingCloset(true);
      try {
        // Active place (home/work/uni) with coords → live weather.
        let placeRow =
          (await getActivePlace(user.id).catch(() => null)) ?? null;
        let autoSource: 'profile' | 'device' | 'ip' | 'saved' | null = placeRow
          ? 'saved'
          : null;

        if (!placeRow) {
          const auto = await resolveAutoPlace(profile?.location).catch(
            () => null,
          );
          if (auto?.label && auto.latitude && auto.longitude) {
            placeRow = await ensureDetectedPlace({
              userId: user.id,
              label: auto.label,
              latitude: auto.latitude,
              longitude: auto.longitude,
            }).catch(() => null);
            autoSource = auto.source;
          } else if (auto?.label) {
            placeRow = await upsertUserPlace({
              userId: user.id,
              name: auto.label,
              makeActive: true,
            }).catch(() => null);
            autoSource = auto.source;
          }
        }

        if (cancelled) return;
        setActivePlaceState(placeRow);

        const location =
          placeRow?.query_name ||
          placeRow?.label ||
          profile?.location?.trim() ||
          null;
        const coords =
          placeRow?.latitude != null && placeRow?.longitude != null
            ? {
                latitude: placeRow.latitude,
                longitude: placeRow.longitude,
                label: placeRow.label,
              }
            : null;

        const [rows, live, storedMemory, existingThreads] = await Promise.all([
          fetchClosetGarments(user.id),
          location || coords
            ? resolveLiveWeather(location, coords)
            : Promise.resolve(null),
          loadMuseMemory(user.id).catch(() => ({
            summary: '',
            facts: [] as string[],
          })),
          listMuseThreads(user.id).catch(() => [] as MuseChatThread[]),
        ]);
        if (cancelled) return;

        setMemory(storedMemory);
        memoryRef.current = storedMemory;
        setThreads(existingThreads);

        const weatherBase = {
          ...DEFAULT_CHAT_CONTEXT,
          weather:
            live?.source === 'live' && live.weather ? live.weather : {},
          location:
            (placeRow ? placeChipLabel(placeRow) : undefined) ??
            (live?.source === 'live' ? live.label : undefined) ??
            location ??
            undefined,
          locationQuery: placeRow?.query_name || location || undefined,
          latitude:
            placeRow?.latitude ??
            (live?.source === 'live' ? live.latitude : undefined),
          longitude:
            placeRow?.longitude ??
            (live?.source === 'live' ? live.longitude : undefined),
        };

        const latest = existingThreads[0] ?? null;
        if (latest) {
          const stored = await loadMuseMessages(latest.id).catch(() => []);
          if (cancelled) return;
          // Always prefer fresh live weather over a stale saved "rain" chip.
          const restoredContext = {
            ...weatherBase,
            ...(latest.context as Partial<ChatContext>),
            weather: weatherBase.weather,
            location: weatherBase.location,
          };
          setContext(restoredContext);
          contextRef.current = restoredContext;
          setThreadId(latest.id);
          threadIdRef.current = latest.id;
          setWardrobe(rows);

          if (stored.length > 0) {
            nextMessageId.current = stored.length + 2;
            setMessages(
              stored.map((row, index) => ({
                id: row.id || index + 1,
                from: row.role === 'user' ? ('user' as const) : ('muse' as const),
                text: row.content,
                outfit: row.payload?.outfit,
                product: row.payload?.product,
              })),
            );
            autoStarted.current = true;
          } else {
            const placeName = live?.source === 'live' ? live.label : location;
            const weatherHint = !location
              ? ' Allow location (or set your city in profile) so I can use live weather.'
              : live?.source === 'live'
                ? ` Live weather near ${placeName}${autoSource && autoSource !== 'profile' ? ' (detected automatically)' : ''}.`
                : live?.source === 'unavailable'
                  ? ` ${live.reason}`
                  : '';
            setMessages([
              {
                id: 1,
                from: 'muse',
                text:
                  rows.length === 0
                    ? 'Your closet is empty. Add a few pieces, then I will style you from what you own.'
                    : `Welcome back — I still remember your style notes. ${rows.length} piece${rows.length === 1 ? '' : 's'} in your closet.${weatherHint}`,
              },
            ]);
          }
          return;
        }

        setContext(weatherBase);
        contextRef.current = weatherBase;
        setWardrobe(rows);
        const created = await createMuseThread(user.id, {
          title: 'Muse chat',
          context: weatherBase,
        });
        if (cancelled) return;
        setThreadId(created.id);
        threadIdRef.current = created.id;
        const placeName = live?.source === 'live' ? live.label : location;
        const weatherHint = !location
          ? ' Allow location (or set your city in profile) so I can use live weather.'
          : live?.source === 'live'
            ? ` Live weather near ${placeName}${autoSource && autoSource !== 'profile' ? ' (detected automatically)' : ''}.`
            : live?.source === 'unavailable'
              ? ` ${live.reason}`
              : '';
        setMessages([
          {
            id: 1,
            from: 'muse',
            text:
              rows.length === 0
                ? 'Your closet is empty. Add a few pieces, then I will style you from what you own.'
                : `I found ${rows.length} piece${rows.length === 1 ? '' : 's'} in your closet — ask me anything.${weatherHint}`,
          },
        ]);
      } catch (error) {
        if (cancelled) return;
        setMessages([
          {
            id: nextMessageId.current++,
            from: 'muse',
            text: `I could not load your closet. ${authErrorMessage(error)}`,
          },
        ]);
      } finally {
        if (!cancelled) setLoadingCloset(false);
      }
    }

    void loadCloset();
    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.location, profile?.weather_aware, setProfile]);

  useEffect(() => {
    if (loadingCloset || autoStarted.current || !user?.id) {
      return;
    }
    autoStarted.current = true;
    append([
      {
        id: nextMessageId.current++,
        from: 'muse',
        text:
          wardrobe.length === 0
            ? 'Add a few closet pieces, then ask me anything about outfits, weather, trips, or shopping for your wardrobe.'
            : 'Hi — I am Muse, your Closette stylist. I remember your preferences across chats. Ask about outfits, weather, travel, or shopping.',
      },
    ]);
  }, [append, loadingCloset, user?.id, wardrobe.length]);

  const sendMessage = (raw = draft) => {
    void askMuse(raw);
  };

  const openHistory = () => {
    if (!user?.id) {
      Alert.alert('Sign in', 'Sign in to see your Muse chat history.');
      return;
    }
    void (async () => {
      try {
        const rows = await listMuseThreads(user.id);
        setThreads(rows);
        setHistoryOpen(true);
      } catch (error) {
        Alert.alert('History', authErrorMessage(error));
      }
    })();
  };

  const openThread = async (thread: MuseChatThread) => {
    try {
      const stored = await loadMuseMessages(thread.id);
      setThreadId(thread.id);
      threadIdRef.current = thread.id;
      const nextContext = {
        ...DEFAULT_CHAT_CONTEXT,
        ...(thread.context as Partial<ChatContext>),
      };
      setContext(nextContext);
      contextRef.current = nextContext;
      nextMessageId.current = stored.length + 2;
      setMessages(
        stored.length
          ? stored.map((row, index) => ({
              id: row.id || index + 1,
              from: row.role === 'user' ? ('user' as const) : ('muse' as const),
              text: row.content,
              outfit: row.payload?.outfit,
              product: row.payload?.product,
            }))
          : [
              {
                id: 1,
                from: 'muse' as const,
                text: 'This chat is empty — ask me for an outfit anytime.',
              },
            ],
      );
      autoStarted.current = true;
      setHistoryOpen(false);
    } catch (error) {
      Alert.alert('History', authErrorMessage(error));
    }
  };

  const resetChat = () => {
    Alert.alert('Start a new chat?', 'Your past chats stay in History. Memory about you is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New chat',
        onPress: () => {
          void (async () => {
            if (!user?.id) return;
            const created = await createMuseThread(user.id, {
              title: 'Muse chat',
              context: contextRef.current,
            });
            setThreadId(created.id);
            threadIdRef.current = created.id;
            nextMessageId.current = 2;
            setDraft('');
            setMessages([
              {
                id: 1,
                from: 'muse',
                text: 'Fresh chat — I still remember your style. What are we dressing for?',
              },
            ]);
            autoStarted.current = true;
            const rows = await listMuseThreads(user.id).catch(() => []);
            setThreads(rows);
          })().catch((error) => Alert.alert('Chat', authErrorMessage(error)));
        },
      },
    ]);
  };

  const applyContextAndRefresh = (
    patch: Partial<ChatContext>,
    prompt: string,
  ) => {
    setContext((current) => {
      const next = { ...current, ...patch };
      contextRef.current = next;
      return next;
    });
    void askMuse(prompt, { silentUser: true });
  };

  const pickOccasion = () => {
    Alert.alert('Occasion', 'Choose an occasion for your outfit.', [
      ...OCCASIONS.map((entry) => ({
        text: entry.label,
        onPress: () =>
          applyContextAndRefresh(
            { occasion: entry.value, occasionLabel: entry.label },
            `Suggest an outfit for ${entry.label.toLowerCase()} with this weather`,
          ),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickSchedule = () => {
    Alert.alert('Schedule', 'Choose a day and time.', [
      ...SCHEDULES.map((label) => ({
        text: label,
        onPress: () =>
          applyContextAndRefresh(
            { scheduleLabel: label },
            `Suggest an outfit for ${label.toLowerCase()}`,
          ),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const applyPlaceWeather = (place: UserPlace) => {
    setActivePlaceState(place);
    setPlacesManagerOpen(false);
    const coords =
      place.latitude != null && place.longitude != null
        ? {
            latitude: place.latitude,
            longitude: place.longitude,
            label: place.label,
          }
        : null;
    void resolveLiveWeather(place.query_name || place.label, coords).then(
      (live) => {
        if (live.source !== 'live' || !live.weather) {
          Alert.alert(
            'Weather',
            live.source === 'unavailable'
              ? live.reason
              : 'Live weather unavailable.',
          );
          return;
        }
        const when = place.for_date
          ? ` for ${placeChipLabel(place)}`
          : ` at ${placeChipLabel(place)}`;
        applyContextAndRefresh(
          {
            weather: live.weather,
            location: placeChipLabel(place),
            locationQuery: place.query_name || place.label,
            latitude: place.latitude ?? undefined,
            longitude: place.longitude ?? undefined,
          },
          `Dress me for the weather${when}`,
        );
      },
    );
  };

  const pickWeather = () => {
    if (!user?.id) {
      Alert.alert('Sign in', 'Sign in to manage your places.');
      return;
    }
    setPlacesManagerOpen(true);
  };

  const tryOutfit = (payload: ChatOutfitPayload) => {
    const footwearId = payload.outfit.roles?.footwear;
    const footwear = footwearId ? garmentById.get(footwearId) : undefined;
    const first = payload.outfit.items
      .map((id) => garmentById.get(id))
      .find(Boolean);
    router.push({
      pathname: '/miroir',
      params: {
        product: footwear
          ? garmentDisplayName(footwear)
          : first
            ? garmentDisplayName(first)
            : payload.title,
        category: footwear ? 'Shoes' : 'Closet',
        source: 'closet',
        returnTo: '/muse-chat',
      },
    });
  };

  const feedback = async (
    payload: ChatOutfitPayload,
    action: 'like' | 'save' | 'dismiss',
  ) => {
    if (!user?.id) return;
    try {
      await sendOutfitFeedback({
        recommendationId: payload.recommendationId,
        outfitId: payload.outfit.outfit_id,
        action,
        userId: user.id,
      });
      Alert.alert(
        action === 'like' ? 'Liked' : action === 'save' ? 'Saved' : 'Dismissed',
        'Muse will use that signal when ranking later looks.',
      );
    } catch (error) {
      Alert.alert('Muse', authErrorMessage(error));
    }
  };

  const outfitPieces = (payload: ChatOutfitPayload) => {
    const roles = payload.outfit.roles ?? {};
    const order = ['top', 'one_piece', 'bottom', 'outerwear', 'footwear', 'accessory'];
    const pieces: Array<{
      role: string;
      garment?: ClosetGarment;
      market?: CatalogProduct;
    }> = [];
    const seen = new Set<string>();
    for (const role of order) {
      const id = roles[role];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const garment = garmentById.get(id);
      const market = !garment ? catalogProductById(id) : undefined;
      pieces.push({ role, garment, market });
    }
    for (const item of payload.outfit.marketplace_items ?? []) {
      if (seen.has(item.product_id)) continue;
      const market = catalogProductById(item.product_id);
      if (!market) continue;
      seen.add(item.product_id);
      pieces.push({ role: item.role ?? 'accessory', market });
    }
    return pieces.slice(0, 4);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View pointerEvents="none" style={styles.topOrb} />
        <View pointerEvents="none" style={styles.bottomOrb} />
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Muse outfits"
            onPress={() => router.replace('/muse')}
            style={styles.roundButton}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={Colors.light.primary}
              size={22}
            />
          </Pressable>
          <View style={styles.sparkle}>
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              tintColor={Colors.light.onPrimary}
              size={21}
            />
          </View>
          <View style={styles.heading}>
            <Text style={styles.title}>Muse</Text>
            <Text style={styles.subtitle}>
              {memory.facts.length
                ? `Remembers ${memory.facts.length} note${memory.facts.length === 1 ? '' : 's'}`
                : 'Closet + marketplace'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Chat history"
            onPress={openHistory}
            style={styles.roundButton}>
            <SymbolView
              name={{
                ios: 'clock.arrow.circlepath',
                android: 'history',
                web: 'history',
              }}
              tintColor={Colors.light.primary}
              size={20}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start a new conversation"
            onPress={resetChat}
            style={styles.roundButton}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              tintColor={Colors.light.primary}
              size={23}
            />
          </Pressable>
        </View>

        <View style={styles.contextRow}>
          <Pressable style={styles.contextDark} onPress={pickOccasion}>
            <Text style={styles.contextLightText}>{context.occasionLabel}</Text>
          </Pressable>
          <Pressable style={styles.contextLight} onPress={pickSchedule}>
            <Text style={styles.contextText}>{context.scheduleLabel}</Text>
          </Pressable>
          <Pressable style={styles.contextLight} onPress={pickWeather}>
            <Text style={styles.contextText}>
              {weatherLabel(context.weather, context.location)}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={listRef}
          style={styles.messages}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}>
          {loadingCloset ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.light.primary} />
              <Text style={styles.loadingText}>Loading your closet…</Text>
            </View>
          ) : null}

          {messages.map((message) =>
            message.from === 'user' ? (
              <View key={message.id} style={styles.userBubble}>
                <Text style={styles.userText}>{message.text}</Text>
              </View>
            ) : (
              <View key={message.id} style={styles.assistantRow}>
                <View style={styles.miniSparkle}>
                  <SymbolView
                    name={{
                      ios: 'sparkles',
                      android: 'auto_awesome',
                      web: 'auto_awesome',
                    }}
                    tintColor={Colors.light.onPrimary}
                    size={14}
                  />
                </View>
                <View style={styles.assistantContent}>
                  <View style={styles.assistantBubble}>
                    <Text style={styles.assistantText}>{message.text}</Text>
                  </View>

                  {message.outfit ? (
                    <View style={styles.outfitCard}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {message.outfit.title}
                        </Text>
                        <View style={styles.match}>
                          <Text style={styles.matchText}>
                            Match {Math.round(message.outfit.score * 100)}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.outfitRow}>
                        {outfitPieces(message.outfit).map((piece, index) =>
                          piece.market?.imageUrl && !piece.garment ? (
                            <View
                              key={`${message.outfit!.outfit.outfit_id}-${piece.role}-${index}`}
                              style={[
                                styles.itemTile,
                                styles.marketTile,
                                {
                                  backgroundColor:
                                    index % 2 === 0
                                      ? Colors.light.softBlue
                                      : Colors.light.sand,
                                },
                              ]}>
                              <Image
                                source={{ uri: piece.market.imageUrl ?? undefined }}
                                style={styles.marketTileImage}
                                resizeMode="cover"
                              />
                              <View style={styles.marketBadge}>
                                <Text style={styles.marketBadgeText}>Shop</Text>
                              </View>
                            </View>
                          ) : (
                            <GarmentCutoutTile
                              key={`${message.outfit!.outfit.outfit_id}-${piece.role}-${index}`}
                              garment={piece.garment}
                              role={piece.role}
                              background={
                                index % 2 === 0
                                  ? Colors.light.softBlue
                                  : Colors.light.sand
                              }
                              compact
                              style={styles.itemTile}
                            />
                          ),
                        )}
                      </View>
                      <View style={styles.cardActions}>
                        <Pressable
                          style={styles.secondaryAction}
                          onPress={() => void feedback(message.outfit!, 'save')}>
                          <Text style={styles.secondaryActionText}>Save</Text>
                        </Pressable>
                        <Pressable
                          style={styles.secondaryAction}
                          onPress={() => void feedback(message.outfit!, 'like')}>
                          <Text style={styles.secondaryActionText}>Like</Text>
                        </Pressable>
                        <Pressable
                          style={styles.tryButton}
                          onPress={() => tryOutfit(message.outfit!)}>
                          <Text style={styles.tryText}>Try on</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {message.product ? (
                    <Pressable
                      style={styles.productCard}
                      onPress={() =>
                        Alert.alert(
                          message.product!.name,
                          `${message.product!.brandName} · ${formatPrice(message.product!.price) || 'Price on request'}\nSuggested to complete this Muse look.`,
                        )
                      }>
                      <View style={styles.productImage}>
                        {message.product.imageUrl ? (
                          <Image
                            source={{ uri: message.product.imageUrl }}
                            style={styles.productPhoto}
                            resizeMode="cover"
                          />
                        ) : null}
                        <View style={styles.shopTag}>
                          <Text style={styles.shopTagText}>Marketplace</Text>
                        </View>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productEyebrow}>Pairs with this outfit</Text>
                        <View style={styles.productNameRow}>
                          <Text style={styles.productName} numberOfLines={2}>
                            {message.product.name}
                          </Text>
                          <Text style={styles.productPrice}>{formatPrice(message.product.price)}</Text>
                        </View>
                        <Text style={styles.productBrand}>{message.product.brandName}</Text>
                        <View style={styles.productButtons}>
                          {(message.product.category === 'Shoes' ||
                            message.product.category === 'Bags') && (
                            <Pressable
                              style={styles.productTry}
                              onPress={() =>
                                router.push({
                                  pathname: '/miroir',
                                  params: {
                                    product: message.product!.name,
                                    price: String(message.product!.price),
                                    category: message.product!.category,
                                    source: 'brand',
                                    returnTo: '/muse-chat',
                                  },
                                })
                              }>
                              <Text style={styles.tryText}>Try on</Text>
                            </Pressable>
                          )}
                          <Pressable
                            style={styles.buyButton}
                            onPress={() =>
                              Alert.alert(
                                message.product!.name,
                                'Partner checkout opens here when shop is live.',
                              )
                            }>
                            <Text style={styles.buyText}>Buy</Text>
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ),
          )}

          {busy ? (
            <View style={styles.assistantRow}>
              <View style={styles.miniSparkle}>
                <ActivityIndicator color={Colors.light.onPrimary} size="small" />
              </View>
              <View style={styles.assistantBubble}>
                <Text style={styles.assistantText}>Styling from closet + shop…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionStrip}
          contentContainerStyle={styles.suggestions}>
          {MUSE_CHAT_STARTERS.map((prompt) => (
            <Pressable
              key={prompt}
              disabled={busy}
              onPress={() => void sendMessage(prompt)}
              style={styles.suggestion}>
              <Text style={styles.suggestionText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void sendMessage()}
            returnKeyType="send"
            editable={!busy}
            placeholder="Ask Muse about an event or vibe..."
            placeholderTextColor={Colors.light.textSecondary}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={busy || !draft.trim()}
            onPress={() => void sendMessage()}
            style={[styles.sendButton, (!draft.trim() || busy) && styles.sendDisabled]}>
            <SymbolView
              name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
              tintColor={Colors.light.onPrimary}
              size={24}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {user?.id ? (
        <PlacesManagerModal
          visible={placesManagerOpen}
          userId={user.id}
          onClose={() => setPlacesManagerOpen(false)}
          onActivePlace={applyPlaceWeather}
        />
      ) : null}

      <Modal
        visible={historyOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryOpen(false)}>
        <View style={styles.historyBackdrop}>
          <View style={styles.historySheet}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Chat history</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setHistoryOpen(false)}
                style={styles.roundButton}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  tintColor={Colors.light.primary}
                  size={18}
                />
              </Pressable>
            </View>
            {memory.summary || memory.facts.length ? (
              <View style={styles.memoryCard}>
                <Text style={styles.memoryLabel}>What Muse remembers</Text>
                {memory.summary ? (
                  <Text style={styles.memorySummary}>{memory.summary}</Text>
                ) : null}
                {memory.facts.slice(-6).map((fact) => (
                  <Text key={fact} style={styles.memoryFact}>
                    • {fact}
                  </Text>
                ))}
              </View>
            ) : null}
            <ScrollView style={styles.historyList}>
              {threads.length === 0 ? (
                <Text style={styles.historyEmpty}>No saved chats yet.</Text>
              ) : (
                threads.map((thread) => (
                  <View key={thread.id} style={styles.historyRow}>
                    <Pressable
                      style={styles.historyMain}
                      onPress={() => void openThread(thread)}>
                      <Text style={styles.historyRowTitle} numberOfLines={1}>
                        {thread.title || 'Muse chat'}
                      </Text>
                      <Text style={styles.historyRowMeta}>
                        {new Date(thread.updated_at).toLocaleString()}
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Delete chat"
                      onPress={() => {
                        Alert.alert('Delete chat?', 'This removes the conversation only.', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              void deleteMuseThread(thread.id)
                                .then(async () => {
                                  if (!user?.id) return;
                                  const rows = await listMuseThreads(user.id);
                                  setThreads(rows);
                                  if (threadId !== thread.id) return;
                                  const created = await createMuseThread(user.id, {
                                    title: 'Muse chat',
                                    context: contextRef.current,
                                  });
                                  setThreadId(created.id);
                                  threadIdRef.current = created.id;
                                  setMessages([
                                    {
                                      id: 1,
                                      from: 'muse',
                                      text: 'That chat was deleted. Ask me for a new look anytime.',
                                    },
                                  ]);
                                })
                                .catch((error) =>
                                  Alert.alert('History', authErrorMessage(error)),
                                );
                            },
                          },
                        ]);
                      }}
                      style={styles.historyDelete}>
                      <Text style={styles.historyDeleteText}>Delete</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas },
  screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  topOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    right: -38,
    top: -58,
    backgroundColor: Colors.light.warmOrb,
  },
  bottomOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    left: -120,
    top: '55%',
    backgroundColor: Colors.light.coolOrb,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: PageGutter,
    paddingTop: 12,
    paddingBottom: 11,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
  },
  sparkle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  heading: { flex: 1 },
  title: {
    fontFamily: Typeface.display,
    fontSize: 23,
    lineHeight: 26,
    color: Colors.light.primary,
  },
  subtitle: {
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: PageGutter,
    paddingBottom: 10,
  },
  contextDark: {
    paddingHorizontal: 15,
    height: 40,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  contextLight: {
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 2,
    borderColor: Colors.light.outlineBlue,
  },
  contextText: {
    fontFamily: Typeface.body,
    fontSize: 13,
    color: Colors.light.primary,
  },
  contextLightText: {
    fontFamily: Typeface.bodyStrong,
    fontSize: 13,
    color: Colors.light.onPrimary,
  },
  messages: { flex: 1 },
  messageList: {
    paddingHorizontal: PageGutter,
    paddingTop: 1,
    paddingBottom: 12,
    gap: 11,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  loadingText: {
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    paddingHorizontal: 19,
    paddingVertical: 13,
    borderRadius: 26,
    borderBottomRightRadius: 7,
    backgroundColor: Colors.light.primary,
  },
  userText: {
    fontFamily: Typeface.body,
    color: Colors.light.onPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  miniSparkle: {
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    marginBottom: 4,
  },
  assistantContent: { flex: 1, gap: 10 },
  assistantBubble: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 25,
    borderBottomLeftRadius: 7,
    backgroundColor: Colors.light.backgroundElement,
  },
  assistantText: {
    fontFamily: Typeface.body,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.light.primary,
  },
  outfitCard: {
    padding: 16,
    borderRadius: 27,
    backgroundColor: Colors.light.backgroundElement,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: Colors.light.primary,
    fontFamily: Typeface.display,
    fontSize: 18,
  },
  match: {
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: Colors.light.softBlueAlt,
  },
  matchText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 12,
  },
  outfitRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  itemTile: { height: 72, flex: 1, borderRadius: 23, overflow: 'hidden' },
  marketTile: { position: 'relative' },
  marketTileImage: { width: '100%', height: '100%' },
  marketBadge: {
    position: 'absolute',
    left: 6,
    top: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  marketBadgeText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 10,
  },
  cardActions: { flexDirection: 'row', gap: 8 },
  secondaryAction: {
    height: 43,
    paddingHorizontal: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.outlineBlue,
    backgroundColor: Colors.light.backgroundElement,
  },
  secondaryActionText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 13,
  },
  tryButton: {
    flex: 1,
    height: 43,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  tryText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 14,
  },
  productCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 27,
    backgroundColor: Colors.light.backgroundElement,
  },
  productImage: {
    width: 96,
    height: 108,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: Colors.light.softBlue,
  },
  productPhoto: { width: '100%', height: '100%' },
  shopTag: {
    position: 'absolute',
    left: 7,
    top: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  shopTagText: {
    color: Colors.light.onPrimary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 10,
  },
  productInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
  productEyebrow: {
    color: Colors.light.textSecondary,
    fontFamily: Typeface.body,
    fontSize: 11,
    marginBottom: 2,
  },
  productNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  productName: {
    flex: 1,
    color: Colors.light.primary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 15,
  },
  productPrice: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 15,
  },
  productBrand: {
    color: Colors.light.textSecondary,
    fontFamily: Typeface.body,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
  },
  productButtons: { flexDirection: 'row', gap: 7 },
  productTry: {
    flex: 1,
    height: 37,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  buyButton: {
    flex: 1,
    height: 37,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  buyText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 14,
  },
  suggestionStrip: { flexGrow: 0, flexShrink: 0, height: 39, marginBottom: 2 },
  suggestions: { paddingHorizontal: PageGutter, paddingVertical: 0, gap: 8 },
  suggestion: {
    paddingHorizontal: 15,
    height: 39,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 2,
    borderColor: Colors.light.outlineBlue,
  },
  suggestionText: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 13,
  },
  composerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: PageGutter,
    paddingTop: 0,
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    height: 58,
    borderWidth: 2,
    borderColor: Colors.light.outlineBlue,
    borderRadius: 30,
    paddingHorizontal: 22,
    backgroundColor: Colors.light.backgroundElement,
    fontFamily: Typeface.body,
    fontSize: 15,
    color: Colors.light.primary,
  },
  sendButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  sendDisabled: { opacity: 0.45 },
  historyBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 38, 63, 0.35)',
  },
  historySheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Colors.light.canvas,
    paddingBottom: 28,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PageGutter,
    paddingTop: 16,
    paddingBottom: 8,
  },
  historyTitle: {
    fontFamily: Typeface.display,
    fontSize: 22,
    color: Colors.light.primary,
  },
  memoryCard: {
    marginHorizontal: PageGutter,
    marginBottom: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
  },
  memoryLabel: {
    fontFamily: Typeface.bodyStrong,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  memorySummary: {
    fontFamily: Typeface.body,
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 6,
  },
  memoryFact: {
    fontFamily: Typeface.body,
    fontSize: 13,
    color: Colors.light.primary,
    marginTop: 2,
  },
  historyList: { paddingHorizontal: PageGutter },
  historyEmpty: {
    fontFamily: Typeface.body,
    color: Colors.light.textSecondary,
    paddingVertical: 24,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.outlineBlue,
  },
  historyMain: { flex: 1 },
  historyRowTitle: {
    fontFamily: Typeface.bodyStrong,
    fontSize: 15,
    color: Colors.light.primary,
  },
  historyRowMeta: {
    fontFamily: Typeface.body,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  historyDelete: { paddingHorizontal: 8, paddingVertical: 6 },
  historyDeleteText: {
    fontFamily: Typeface.body,
    fontSize: 13,
    color: Colors.light.primary,
  },
});
