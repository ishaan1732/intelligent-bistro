import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { CartItem } from '@/types';
import useCartStore from '@/store/cartStore';

const C = {
  card: '#1A1A1A',
  accent: '#F4A825',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  btnBg: '#2A2A2A',
  danger: '#EF4444',
};

interface Props {
  item: CartItem;
}

export default function CartItemRow({ item }: Props) {
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>${item.price.toFixed(2)} each</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQty(item.itemId, item.qty - 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qty}>{item.qty}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => updateQty(item.itemId, item.qty + 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => removeItem(item.itemId)}
          activeOpacity={0.7}
        >
          <FontAwesome name="trash" size={16} color={C.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.btnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  qty: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
