import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
import type { CartAction, ChatMessage } from '@/types';
import useCartStore from '@/store/cartStore';
import { API_BASE_URL } from '@/app/config';

const C = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  accent: '#F4A825',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  border: '#2A2A2A',
  success: '#4CAF50',
};

// Slide-in animated message bubble
function MessageBubble({ item }: { item: ChatMessage }) {
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
  const messages = useCartStore((state) => state.messages);
  const cart = useCartStore((state) => state.cart);
  const addMessage = useCartStore((state) => state.addMessage);
  const applyActions = useCartStore((state) => state.applyActions);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: "Hi! I am your Bistro assistant. Tell me what you'd like to order!",
      });
    }
  }, []);

  // Pulsing online indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    Keyboard.dismiss();
    addMessage({ role: 'user', content: text });
    setSending(true);

    try {
      const res = await axios.post<{ reply: string; actions: CartAction[] }>(
        `${API_BASE_URL}/chat`,
        { message: text, cart }
      );
      const actions = res.data.actions;
      if (actions?.length) applyActions(actions);
      addMessage({ role: 'assistant', content: res.data.reply });
    } catch {
      addMessage({
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      });
    } finally {
      setSending(false);
    }
  }

  const canSend = input.trim().length > 0 && !sending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={styles.onlineRow}>
              <Animated.View style={[styles.onlineDot, { opacity: pulseAnim }]} />
              <Text style={styles.onlineLabel}>Online</Text>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            onLayout={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={({ item }) => <MessageBubble item={item} />}
            ListFooterComponent={sending ? <TypingIndicator /> : null}
          />

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor={C.textSecondary}
              value={input}
              onChangeText={setInput}
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
      </TouchableWithoutFeedback>
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
