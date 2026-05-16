import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import useCartStore from '@/store/cartStore';
import CartItemRow from '@/components/CartItem';

const C = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  accent: '#F4A825',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  border: '#2A2A2A',
};

export default function CartScreen() {
  const cart = useCartStore((state) => state.cart);
  const clearCart = useCartStore((state) => state.clearCart);
  const router = useRouter();

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  function handlePlaceOrder() {
    Alert.alert(
      'Order Placed!',
      `Your order is confirmed.\nTotal: $${total.toFixed(2)}\n\nEnjoy your meal!`,
      [{ text: 'Great!', onPress: () => clearCart() }]
    );
  }

  if (cart.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.emptyContainer]} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Order</Text>
        </View>
        <View style={styles.emptyContent}>
          <FontAwesome name="shopping-cart" size={56} color={C.accent} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Browse the menu and add some delicious items!
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.navigate('/')}
            activeOpacity={0.85}
          >
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Order</Text>
        <Text style={styles.headerCount}>
          {cart.reduce((s, i) => s + i.qty, 0)} item
          {cart.reduce((s, i) => s + i.qty, 0) !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.itemId}
        renderItem={({ item }) => <CartItemRow item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.placeOrderBtn}
              onPress={handlePlaceOrder}
              activeOpacity={0.85}
            >
              <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  emptyContainer: {},
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
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerCount: {
    color: C.textSecondary,
    fontSize: 14,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: C.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtitle: {
    color: C.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  browseBtn: {
    marginTop: 28,
    backgroundColor: C.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  browseBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summary: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    color: C.textSecondary,
    fontSize: 15,
  },
  summaryValue: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  totalLabel: {
    color: C.textPrimary,
    fontSize: 17,
    fontWeight: 'bold',
  },
  totalValue: {
    color: C.accent,
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeOrderBtn: {
    backgroundColor: C.accent,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
});
