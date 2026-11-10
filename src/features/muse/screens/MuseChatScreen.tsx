import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { authErrorMessage } from '@/features/auth/userProfile';
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
import { sendOutfitFeedback } from '@/features/muse/services/museApi';
import ShopProductIllustration from '@/features/shop/components/ShopProductIllustration';
import type { ShopProduct } from '@/features/shop/data/products';

type Message = {
  id: number;
  from: 'user' | 'muse';
  text: string;
  outfit?: ChatOutfitPayload;
  product?: ShopProduct;
};

const OCCASIONS: { label: string; value: ChatContext['occasion'] }[] = [
  { label: 'Casual', value: 'casual' },
  { label: 'Smart casual', value: 'smart-casual' },
  { label: 'Work', value: 'work' },
  { label: 'Formal', value: 'formal' },
];

const WEATHER_PRESETS: Array<{ label: string; weather: ChatContext['weather'] }> = [
  { label: '18° rain', weather: { temperature_c: 18, condition: 'rain' } },
  { label: '22° clear', weather: { temperature_c: 22, condition: 'clear' } },
  { label: '8° cold', weather: { temperature_c: 8, condition: 'cold' } },
  { label: '28° hot', weather: { temperature_c: 28, condition: 'hot' } },
];

const SCHEDULES = ['Anytime', 'Tonight', 'Sat · evening', 'Sun · daytime', 'Work week'];

function weatherLabel(weather: ChatContext['weather']) {
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

export default function MuseChatScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const listRef = useRef<ScrollView>(null);
  const nextMessageId = useRef(2);
  const autoStarted = useRef(false);

  const [wardrobe, setWardrobe] = useState<ClosetGarment[]>([]);
  const [context, setContext] = useState<ChatContext>(DEFAULT_CHAT_CONTEXT);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'muse',
      text: 'Hi — I’m building a first look from your closet. You can also tap a suggestion or type anything.',
    },
  ]);
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
        const reply = await replyToMuseChat({
          text: prompt,
          userId: user.id,
          wardrobe: closet,
          profile,
          context: contextRef.current,
        });
        setContext(reply.context);
        append([
          {
            id: nextMessageId.current++,
            from: 'muse',
            text: reply.text,
            outfit: reply.outfit,
            product: reply.product,
          },
        ]);
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
    [append, profile, user?.id, wardrobe],
  );

  useEffect(() => {
    let cancelled = false;
    autoStarted.current = false;

    async function loadCloset() {
      if (!user?.id) {
        if (cancelled) return;
        setWardrobe([]);
        setLoadingCloset(false);
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
        const rows = await fetchClosetGarments(user.id);
        if (cancelled) return;
        setWardrobe(rows);
        setMessages([
          {
            id: nextMessageId.current++,
            from: 'muse',
            text:
              rows.length === 0
                ? 'Your closet is empty. Add a few pieces, then I will style you from what you own.'
                : `I found ${rows.length} piece${rows.length === 1 ? '' : 's'} in your closet — pulling a first outfit now.`,
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
  }, [user?.id]);

  useEffect(() => {
    if (loadingCloset || autoStarted.current || !user?.id || wardrobe.length === 0) {
      return;
    }
    autoStarted.current = true;
    void askMuse(
      `Suggest an outfit for ${DEFAULT_CHAT_CONTEXT.occasionLabel.toLowerCase()} today`,
      { silentUser: true, wardrobeOverride: wardrobe },
    );
  }, [askMuse, loadingCloset, user?.id, wardrobe]);

  const sendMessage = (raw = draft) => {
    void askMuse(raw);
  };

  const resetChat = () => {
    Alert.alert('Start a new chat?', 'This will clear the current conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'New chat',
        style: 'destructive',
        onPress: () => {
          nextMessageId.current = 2;
          setContext(DEFAULT_CHAT_CONTEXT);
          setDraft('');
          setMessages([
            {
              id: 1,
              from: 'muse',
              text: 'Fresh start — suggesting another look from your closet.',
            },
          ]);
          if (wardrobe.length > 0 && user?.id) {
            autoStarted.current = true;
            void askMuse(
              `Suggest an outfit for ${DEFAULT_CHAT_CONTEXT.occasionLabel.toLowerCase()} today`,
              { silentUser: true },
            );
          } else {
            autoStarted.current = false;
          }
        },
      },
    ]);
  };

  const pickOccasion = () => {
    Alert.alert('Occasion', 'Choose an occasion for your outfit.', [
      ...OCCASIONS.map((entry) => ({
        text: entry.label,
        onPress: () =>
          setContext((current) => ({
            ...current,
            occasion: entry.value,
            occasionLabel: entry.label,
          })),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickSchedule = () => {
    Alert.alert('Schedule', 'Choose a day and time.', [
      ...SCHEDULES.map((label) => ({
        text: label,
        onPress: () => setContext((current) => ({ ...current, scheduleLabel: label })),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickWeather = () => {
    Alert.alert('Weather', 'Pick a weather context for Muse.', [
      ...WEATHER_PRESETS.map((entry) => ({
        text: entry.label,
        onPress: () =>
          setContext((current) => ({
            ...current,
            weather: entry.weather,
          })),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
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
    const pieces: Array<{ role: string; garment?: ClosetGarment }> = [];
    const seen = new Set<string>();
    for (const role of order) {
      const id = roles[role];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      pieces.push({ role, garment: garmentById.get(id) });
    }
    return pieces.slice(0, 3);
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
            <Text style={styles.subtitle}>Styling from your closet</Text>
          </View>
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
            <Text style={styles.contextText}>{weatherLabel(context.weather)}</Text>
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
                        {outfitPieces(message.outfit).map((piece, index) => (
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
                        ))}
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
                          `${message.product!.brand} · $${message.product!.price}`,
                        )
                      }>
                      <View style={styles.productImage}>
                        <View style={styles.productIllustration}>
                          <ShopProductIllustration item={message.product} />
                        </View>
                      </View>
                      <View style={styles.productInfo}>
                        <View style={styles.productNameRow}>
                          <Text style={styles.productName}>{message.product.name}</Text>
                          <Text style={styles.productPrice}>${message.product.price}</Text>
                        </View>
                        <View style={styles.productButtons}>
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
                <Text style={styles.assistantText}>Styling from your closet…</Text>
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
  itemTile: { height: 72, flex: 1, borderRadius: 23 },
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
    width: 86,
    height: 72,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.light.softBlue,
  },
  productIllustration: { transform: [{ scale: 0.72 }] },
  productInfo: { flex: 1, justifyContent: 'space-between' },
  productNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    color: Colors.light.primary,
    fontFamily: Typeface.bodyStrong,
    fontSize: 15,
  },
  productPrice: {
    color: Colors.light.primary,
    fontFamily: Typeface.body,
    fontSize: 15,
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
});
