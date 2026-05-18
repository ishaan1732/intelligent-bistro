import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import axios from 'axios';
import type { CartAction, MenuItem } from '@/types';
import useCartStore from '@/store/cartStore';
import { API_BASE_URL } from '@/constants/config';

const C = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  accent: '#F4A825',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  border: '#2A2A2A',
  success: '#4CAF50',
};

const MOODS = [
  { mood: 'joyful', emoji: '🎉', label: 'Joyful' },
  { mood: 'comfort', emoji: '🤗', label: 'Comfort' },
  { mood: 'stressed', emoji: '😤', label: 'Stressed' },
  { mood: 'heartbroken', emoji: '💔', label: 'Heartbroken' },
  { mood: 'adventurous', emoji: '🌍', label: 'Adventurous' },
  { mood: 'tired', emoji: '😴', label: 'Tired' },
  { mood: 'romantic', emoji: '🌹', label: 'Romantic' },
];

const YES_INTENTS = ['yes', 'yeah', 'sure', 'add all', 'yes please', 'add them', 'all of them'];

interface MoodResponse {
  mood: string;
  moodLabel: string;
  openingMessage: string;
  recommendedItemIds: string[];
  cartActions: CartAction[];
}

type TextMessage = { type: 'text'; role: 'user' | 'assistant'; content: string };
type RecommendationMessage = { type: 'recommendations'; items: MenuItem[] };
type LocalMessage = TextMessage | RecommendationMessage;

// Single recommendation card
function RecommendationCard({ item }: { item: MenuItem }) {
  const { addItem, updateQty, removeItem, cart } = useCartStore();
  const cartItem = cart.find((c) => c.itemId === item.id);
  const qty = cartItem?.qty || 0;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.recCard, { opacity }]}>

      {/* Top section — always takes available space pushing button down */}
      <View style={{ flex: 1 }}>
        <Text style={styles.recName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.recPrice}>${item.price.toFixed(2)}</Text>
      </View>

      {/* Bottom section — quantity controls or add button */}
      {qty === 0 ? (
        <TouchableOpacity
          style={styles.recAddBtn}
          onPress={() => addItem({ itemId: item.id, name: item.name, price: item.price, qty: 1 })}
          activeOpacity={0.8}
        >
          <Text style={styles.recAddBtnText}>+ Add</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => {
              if (qty === 1) removeItem(item.id);
              else updateQty(item.id, qty - 1);
            }}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNum}>{qty}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => addItem({ itemId: item.id, name: item.name, price: item.price, qty: 1 })}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

// Horizontal row of recommendation cards
function RecommendationRow({ items }: { items: MenuItem[] }) {
  return (
    <View style={styles.recRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recRowScroll}
      >
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

// Slide-in animated message bubble
function MessageBubble({ item }: { item: TextMessage }) {
  const isUser = item.role === 'user';
  const translateX = useRef(new Animated.Value(isUser ? 60 : -60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.msgWrapper,
        isUser ? styles.msgWrapperUser : styles.msgWrapperAssistant,
        { transform: [{ translateX }], opacity },
      ]}
    >
      <View
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
          ]}
        >
          {item.content}
        </Text>
      </View>
    </Animated.View>
  );
}

// Three sequentially pulsing dots
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 220);
    const a3 = pulse(dot3, 440);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={styles.typingWrapper}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((op, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: op }]} />
        ))}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const cart = useCartStore((state) => state.cart);
  const addMessage = useCartStore((state) => state.addMessage);
  const applyActions = useCartStore((state) => state.applyActions);
  const moodSet = useCartStore((state) => state.moodSet);
  const setMoodData = useCartStore((state) => state.setMoodData);

  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const moodCardsOpacity = useRef(new Animated.Value(1)).current;

  function addLocalMsg(msg: LocalMessage) {
    setLocalMessages((prev) => [...prev, msg]);
  }

  // Welcome message on first load
  useEffect(() => {
    addLocalMsg({
      type: 'text',
      role: 'assistant',
      content:
        "Hi! I'm your Bistro assistant 🍽️\nTell me what you'd like to order, or share how you're feeling and I'll recommend something perfect for you!",
    });
  }, []);

  // Fetch full menu so we can resolve recommendedItemIds into MenuItem objects
  useEffect(() => {
    axios
      .get<MenuItem[]>(`${API_BASE_URL}/menu`)
      .then((res) => setMenuItems(res.data))
      .catch(() => {});
  }, []);

  // Animate mood cards out when moodSet becomes true
  useEffect(() => {
    if (moodSet) {
      Animated.timing(moodCardsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [moodSet]);

  // Pulsing online indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function pushMoodResponse(res: MoodResponse) {
    const { mood: resMood, moodLabel, openingMessage, recommendedItemIds: recIds, cartActions } = res;
    setMoodData({ mood: resMood, moodLabel, recommendedItemIds: recIds });
    if (cartActions?.length) applyActions(cartActions);
    addLocalMsg({ type: 'text', role: 'assistant', content: openingMessage });
    addMessage({ role: 'assistant', content: openingMessage });
    if (recIds.length > 0) {
      const recItems = menuItems.filter((i) => recIds.includes(i.id));
      if (recItems.length > 0) addLocalMsg({ type: 'recommendations', items: recItems });
    }
  }

  async function handleMoodSelect(selectedMood: string, label: string, emoji: string) {
    if (sending) return;

    addLocalMsg({ type: 'text', role: 'user', content: `${label} ${emoji}` });
    addMessage({ role: 'user', content: `${label} ${emoji}` });
    setSending(true);

    try {
      console.log('[mood] card selected:', selectedMood);
      const res = await axios.post<MoodResponse>(`${API_BASE_URL}/mood`, { feeling: selectedMood });
      console.log('[mood] response:', res.data);
      pushMoodResponse(res.data);
    } catch (err) {
      console.error('[mood] error:', err);
      addLocalMsg({ type: 'text', role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    Keyboard.dismiss();

    // Always read moodSet fresh from the store to avoid stale closure
    const currentMoodSet = useCartStore.getState().moodSet;
    const currentRecommendedIds = useCartStore.getState().recommendedItemIds;

    // Part 3: yes-intent shortcut — add all recommended items without hitting the API
    if (
      currentMoodSet &&
      YES_INTENTS.includes(text.toLowerCase().trim()) &&
      currentRecommendedIds.length > 0
    ) {
      addLocalMsg({ type: 'text', role: 'user', content: text });
      addMessage({ role: 'user', content: text });
      const recItems = menuItems.filter((i) => currentRecommendedIds.includes(i.id));
      applyActions(
        recItems.map((item) => ({
          type: 'add' as const,
          itemId: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
        }))
      );
      addLocalMsg({ type: 'text', role: 'assistant', content: "Added all recommendations to your cart! 🛒" });
      addMessage({ role: 'assistant', content: "Added all recommendations to your cart! 🛒" });
      return;
    }

    addLocalMsg({ type: 'text', role: 'user', content: text });
    addMessage({ role: 'user', content: text });
    setSending(true);

    try {
      if (!currentMoodSet) {
        console.log('[mood] first message, routing to /mood:', text);
        const res = await axios.post<MoodResponse>(`${API_BASE_URL}/mood`, { feeling: text });
        console.log('[mood] response:', res.data);
        pushMoodResponse(res.data);
      } else {
        console.log('[chat] routing to /chat:', text);
        const currentMood = useCartStore.getState().mood;
        const history = localMessages
          .filter((m) => m.type === 'text')
          .slice(-6)
          .map((m) => ({ role: (m as TextMessage).role, content: (m as TextMessage).content }));
        const res = await axios.post<{ reply: string; actions: CartAction[] }>(
          `${API_BASE_URL}/chat`,
          { message: text, cart, mood: currentMood, recommendedItemIds: currentRecommendedIds, history }
        );
        console.log('[chat] response:', res.data);
        const actions = res.data.actions;
        if (actions?.length) applyActions(actions);
        addLocalMsg({ type: 'text', role: 'assistant', content: res.data.reply });
        addMessage({ role: 'assistant', content: res.data.reply });
      }
    } catch (err) {
      console.error('[chat] error:', err);
      addLocalMsg({ type: 'text', role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
    } finally {
      setSending(false);
    }
  }

  const canSend = input.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* Header only — tapping header dismisses keyboard */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={styles.onlineRow}>
              <Animated.View style={[styles.onlineDot, { opacity: pulseAnim }]} />
              <Text style={styles.onlineLabel}>Online</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* FlatList — NOT inside TouchableWithoutFeedback */}
        <FlatList
          ref={flatListRef}
          style={styles.flex}
          data={localMessages}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          renderItem={({ item }) => {
            if (item.type === 'recommendations') {
              return <RecommendationRow items={item.items} />;
            }
            return <MessageBubble item={item} />;
          }}
          ListFooterComponent={sending ? <TypingIndicator /> : null}
        />

        {/* Mood cards — NOT inside TouchableWithoutFeedback */}
        {!moodSet && (
          <Animated.View style={[styles.moodCardsContainer, { opacity: moodCardsOpacity }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodCardsScroll}
            >
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.mood}
                  style={styles.moodCard}
                  onPress={() => handleMoodSelect(m.mood, m.label, m.emoji)}
                  activeOpacity={0.75}
                  disabled={sending}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={styles.moodLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={C.textSecondary}
            value={input}
            onChangeText={setInput}
            editable={true}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={true}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <FontAwesome
              name="arrow-up"
              size={18}
              color={canSend ? '#000000' : '#555555'}
            />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    color: C.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.success,
  },
  onlineLabel: {
    color: C.success,
    fontSize: 13,
    fontWeight: '600',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },

  msgWrapper: {
    marginBottom: 10,
    maxWidth: '82%',
  },
  msgWrapperUser: { alignSelf: 'flex-end' },
  msgWrapperAssistant: { alignSelf: 'flex-start' },

  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: { color: '#000000' },
  bubbleTextAssistant: { color: C.textPrimary },

  typingWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  typingBubble: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.textSecondary,
  },

  moodCardsContainer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 12,
  },
  moodCardsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  moodCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    width: 100,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  moodLabel: {
    color: C.textPrimary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },

  recRow: {
    marginBottom: 10,
  },
  recRowScroll: {
    gap: 10,
    paddingRight: 4,
  },
  recCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    width: 160,
    height: 140,
    justifyContent: 'space-between',
  },
  recName: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recPrice: {
    color: C.accent,
    fontSize: 12,
    marginBottom: 10,
  },
  recAddBtn: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  recAddBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    backgroundColor: '#000000',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: C.accent,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  qtyNum: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: C.textPrimary,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
});
