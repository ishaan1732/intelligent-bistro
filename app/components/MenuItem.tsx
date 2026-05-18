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
  const { addItem, updateQty, removeItem, cart } = useCartStore();
  const cartItem = cart.find((c) => c.itemId === item.id);
  const qty = cartItem?.qty || 0;
  const scale = useRef(new Animated.Value(1)).current;

  function handleAdd() {
    addItem({ itemId: item.id, name: item.name, price: item.price, qty: 1 });
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 7 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 7 }),
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
        {qty === 0 ? (
          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add to Cart</Text>
            </TouchableOpacity>
          </Animated.View>
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
  addBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4A825',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#F4A825',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  qtyNum: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 28,
    textAlign: 'center',
  },
});
