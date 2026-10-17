import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, PageGutter, Typeface } from '@/constants/theme';
import ShopProductIllustration from '@/features/shop/components/ShopProductIllustration';
import { shopProducts } from '@/features/shop/data/products';

type Message = { id: number; from: 'user' | 'muse'; text: string; card?: boolean; product?: boolean };
const recommendedShopProduct = shopProducts.find((product) => product.name === 'Cloud')!;
const initialMessages: Message[] = [
  { id: 1, from: 'user', text: "I'm going to a friend's engagement party on Saturday evening. I want an elegant look that isn't too dressy." },
  { id: 2, from: 'muse', text: 'Lovely! Saturday evening will be around 22\u00B0 and clear. Here is an outfit from your closet:', card: true },
  { id: 3, from: 'muse', text: 'You are missing a polished shoe for this look. A partner brand has one:', product: true },
];

export default function MuseChatScreen() {
  const router = useRouter();
  const listRef = useRef<ScrollView>(null);
  const nextMessageId = useRef(4);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const sendMessage = (message = draft) => {
    const text = message.trim();
    if (!text) return;
    const messageId = nextMessageId.current;
    nextMessageId.current += 2;
    const userMessage: Message = { id: messageId, from: 'user', text };
    const answer: Message = { id: messageId + 1, from: 'muse', text: text.toLowerCase().includes('shoe') ? 'I swapped in a polished loafer that works with this outfit. Would you like to try it?' : 'Got it! I will adjust the outfit using pieces from your closet and keep the occasion and weather in mind.' };
    setMessages((current) => [...current, userMessage, answer]);
    setDraft('');
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View pointerEvents="none" style={styles.topOrb} />
        <View pointerEvents="none" style={styles.bottomOrb} />
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Muse outfits" onPress={() => router.replace('/muse')} style={styles.roundButton}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={Colors.light.primary} size={22} /></Pressable>
          <View style={styles.sparkle}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={Colors.light.onPrimary} size={21} /></View>
          <View style={styles.heading}><Text style={styles.title}>Muse</Text><Text style={styles.subtitle}>Styling from your closet</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Start a new conversation" onPress={() => Alert.alert('Start a new chat?', 'This will clear the current conversation.', [{ text: 'Cancel', style: 'cancel' }, { text: 'New chat', style: 'destructive', onPress: () => setMessages([]) }])} style={styles.roundButton}><SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={Colors.light.primary} size={23} /></Pressable>
        </View>

        <View style={styles.contextRow}>
          <Pressable style={styles.contextDark} onPress={() => Alert.alert('Occasion', 'Choose an occasion for your outfit.')}><Text style={styles.contextLightText}>Engagement party</Text></Pressable>
          <Pressable style={styles.contextLight} onPress={() => Alert.alert('Schedule', 'Choose a day and time.')}><Text style={styles.contextText}>Sat {'\u00B7'} 7 PM</Text></Pressable>
          <View style={styles.contextLight}><Text style={styles.contextText}>22{'\u00B0'} clear</Text></View>
        </View>

        <ScrollView ref={listRef} style={styles.messages} contentContainerStyle={styles.messageList} showsVerticalScrollIndicator={false} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}>
          {messages.map((message) => message.from === 'user' ? (
            <View key={message.id} style={styles.userBubble}><Text style={styles.userText}>{message.text}</Text></View>
          ) : (
            <View key={message.id} style={styles.assistantRow}>
              <View style={styles.miniSparkle}><SymbolView name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} tintColor={Colors.light.onPrimary} size={14} /></View>
              <View style={styles.assistantContent}>
                <View style={styles.assistantBubble}><Text style={styles.assistantText}>{message.text}</Text></View>
                {message.card && <View style={styles.outfitCard}>
                  <View style={styles.cardHeader}><Text style={styles.cardTitle}>Soft evening glow</Text><View style={styles.match}><Text style={styles.matchText}>Match 94%</Text></View></View>
                  <View style={styles.outfitRow}><View style={[styles.itemTile, { backgroundColor: Colors.light.cream }]}><View style={[styles.tinyShirt, { backgroundColor: Colors.light.sand }]} /></View><View style={[styles.itemTile, { backgroundColor: Colors.light.softBlue }]}><View style={styles.tinyPants}><View /><View /></View></View><View style={[styles.itemTile, { backgroundColor: Colors.light.sand }]}><View style={styles.tinyShoe} /></View></View>
                  <Pressable style={styles.tryButton} onPress={() => router.push({ pathname: '/miroir', params: { product: 'Sneakers', category: 'Shoes', source: 'closet', returnTo: '/muse-chat' } })}><Text style={styles.tryText}>Try on</Text></Pressable>
                </View>}
                {message.product && <Pressable style={styles.productCard} onPress={() => Alert.alert(recommendedShopProduct.name, 'Partner product details are coming soon.')}><View style={styles.productImage}><View style={styles.productIllustration}><ShopProductIllustration item={recommendedShopProduct} /></View></View><View style={styles.productInfo}><View style={styles.productNameRow}><Text style={styles.productName}>{recommendedShopProduct.name}</Text><Text style={styles.productPrice}>${recommendedShopProduct.price}</Text></View><View style={styles.productButtons}><Pressable style={styles.productTry} onPress={() => router.push({ pathname: '/miroir', params: { product: recommendedShopProduct.name, price: String(recommendedShopProduct.price), category: recommendedShopProduct.category, source: 'brand', returnTo: '/muse-chat' } })}><Text style={styles.tryText}>Try on</Text></Pressable><Pressable style={styles.buyButton} onPress={() => Alert.alert(recommendedShopProduct.name, 'Partner checkout is coming soon.')}><Text style={styles.buyText}>Buy</Text></Pressable></View></View></Pressable>}
              </View>
            </View>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionStrip} contentContainerStyle={styles.suggestions}>
          {['Make it dressier', 'Swap the shoes', 'Add a jacket'].map((prompt) => <Pressable key={prompt} onPress={() => sendMessage(prompt)} style={styles.suggestion}><Text style={styles.suggestionText}>{prompt}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.composerRow}>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={() => sendMessage()} returnKeyType="send" placeholder="Ask Muse about an event or vibe..." placeholderTextColor={Colors.light.textSecondary} style={styles.input} />
          <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={() => sendMessage()} style={styles.sendButton}><SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} tintColor={Colors.light.onPrimary} size={24} /></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.canvas }, screen: { flex: 1, overflow: 'hidden', backgroundColor: Colors.light.canvas },
  topOrb: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: -38, top: -58, backgroundColor: Colors.light.warmOrb }, bottomOrb: { position: 'absolute', width: 250, height: 250, borderRadius: 125, left: -120, top: '55%', backgroundColor: Colors.light.coolOrb },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: PageGutter, paddingTop: 12, paddingBottom: 11 }, roundButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement }, sparkle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary }, heading: { flex: 1 }, title: { fontFamily: Typeface.display, fontSize: 23, lineHeight: 26, color: Colors.light.primary }, subtitle: { fontFamily: Typeface.body, color: Colors.light.textSecondary, fontSize: 13 },
  contextRow: { flexDirection: 'row', gap: 8, paddingHorizontal: PageGutter, paddingBottom: 10 }, contextDark: { paddingHorizontal: 15, height: 40, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary }, contextLight: { paddingHorizontal: 14, height: 40, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.backgroundElement, borderWidth: 2, borderColor: Colors.light.outlineBlue }, contextText: { fontFamily: Typeface.body, fontSize: 13, color: Colors.light.primary }, contextLightText: { fontFamily: Typeface.bodyStrong, fontSize: 13, color: Colors.light.onPrimary },
  messages: { flex: 1 }, messageList: { paddingHorizontal: PageGutter, paddingTop: 1, paddingBottom: 12, gap: 11 }, userBubble: { alignSelf: 'flex-end', maxWidth: '85%', paddingHorizontal: 19, paddingVertical: 13, borderRadius: 26, borderBottomRightRadius: 7, backgroundColor: Colors.light.primary }, userText: { fontFamily: Typeface.body, color: Colors.light.onPrimary, fontSize: 15, lineHeight: 22 }, assistantRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, miniSparkle: { width: 33, height: 33, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary, marginBottom: 4 }, assistantContent: { flex: 1, gap: 10 }, assistantBubble: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 25, borderBottomLeftRadius: 7, backgroundColor: Colors.light.backgroundElement }, assistantText: { fontFamily: Typeface.body, fontSize: 15, lineHeight: 21, color: Colors.light.primary },
  outfitCard: { padding: 16, borderRadius: 27, backgroundColor: Colors.light.backgroundElement }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, cardTitle: { color: Colors.light.primary, fontFamily: Typeface.display, fontSize: 18 }, match: { borderRadius: 18, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: Colors.light.softBlueAlt }, matchText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 12 }, outfitRow: { flexDirection: 'row', gap: 8, marginBottom: 10 }, itemTile: { height: 63, flex: 1, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }, tinyShirt: { width: 28, height: 35, borderRadius: 3 }, tinyShoe: { width: 48, height: 13, borderRadius: 10, borderBottomWidth: 4, borderBottomColor: Colors.light.primary, backgroundColor: Colors.light.background }, tinyPants: { flexDirection: 'row', gap: 2 }, tryButton: { height: 43, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary }, tryText: { color: Colors.light.onPrimary, fontFamily: Typeface.bodyStrong, fontSize: 14 },
  productCard: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 27, backgroundColor: Colors.light.backgroundElement }, productImage: { width: 86, height: 72, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: Colors.light.softBlue }, productIllustration: { transform: [{ scale: 0.72 }] }, productInfo: { flex: 1, justifyContent: 'space-between' }, productNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, productName: { color: Colors.light.primary, fontFamily: Typeface.bodyStrong, fontSize: 15 }, productPrice: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 15 }, productButtons: { flexDirection: 'row', gap: 7 }, productTry: { flex: 1, height: 37, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary }, buyButton: { flex: 1, height: 37, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.light.primary }, buyText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 14 },
  suggestionStrip: { flexGrow: 0, flexShrink: 0, height: 39, marginBottom: 2 }, suggestions: { paddingHorizontal: PageGutter, paddingVertical: 0, gap: 8 }, suggestion: { paddingHorizontal: 15, height: 39, borderRadius: 22, justifyContent: 'center', backgroundColor: Colors.light.backgroundElement, borderWidth: 2, borderColor: Colors.light.outlineBlue }, suggestionText: { color: Colors.light.primary, fontFamily: Typeface.body, fontSize: 13 }, composerRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: PageGutter, paddingTop: 0, paddingBottom: 10 }, input: { flex: 1, height: 58, borderWidth: 2, borderColor: Colors.light.outlineBlue, borderRadius: 30, paddingHorizontal: 22, backgroundColor: Colors.light.backgroundElement, fontFamily: Typeface.body, fontSize: 15, color: Colors.light.primary }, sendButton: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.primary },
});
