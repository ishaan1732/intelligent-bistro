import { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MenuItem } from '@/types';
import useCartStore from '@/store/cartStore';

const C = {
  card: '#1A1A1A',
  accent: '#F4A825',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
};

interface Props {
  item: MenuItem;
}

export default function MenuItemCard({ item }: Props) {
  const addItem = useCartStore((state) => state.addItem);
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    addItem({ itemId: item.id, name: item.name, price: item.price });
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.88,
        useNativeDriver: true,
        tension: 300,
        friction: 7,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 7,
      }),
    ]).start();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  name: {
    color: C.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    color: C.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: C.accent,
    fontSize: 17,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});
