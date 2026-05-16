import { create } from 'zustand';
import type { CartItem, CartAction, ChatMessage } from '@/types';

interface CartStore {
  cart: CartItem[];
  messages: ChatMessage[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (itemId: string) => void;
  updateQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  applyActions: (actions: CartAction[]) => void;
  addMessage: (message: ChatMessage) => void;
}

const useCartStore = create<CartStore>()((set, get) => ({
  cart: [],
  messages: [],

  addItem: ({ itemId, name, price }) =>
    set((state) => {
      const existing = state.cart.find((i) => i.itemId === itemId);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.itemId === itemId ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { cart: [...state.cart, { itemId, name, price, qty: 1 }] };
    }),

  removeItem: (itemId) =>
    set((state) => ({ cart: state.cart.filter((i) => i.itemId !== itemId) })),

  updateQty: (itemId, qty) =>
    set((state) => ({
      cart:
        qty <= 0
          ? state.cart.filter((i) => i.itemId !== itemId)
          : state.cart.map((i) => (i.itemId === itemId ? { ...i, qty } : i)),
    })),

  clearCart: () => set({ cart: [] }),

  applyActions: (actions) => {
    actions.forEach((action) => {
      switch (action.type) {
        case 'add':
          const existing = get().cart.find(i => i.itemId === action.itemId);
          if (existing) {
            set(state => ({
              cart: state.cart.map(i =>
                i.itemId === action.itemId
                  ? { ...i, qty: i.qty + (action.qty ?? 1) }
                  : i
              )
            }));
          } else {
            set(state => ({
              cart: [...state.cart, {
                itemId: action.itemId!,
                name: action.name!,
                price: action.price!,
                qty: action.qty ?? 1
              }]
            }));
          }
          break;
        case 'remove':
          set(state => ({
            cart: state.cart.filter(i => i.itemId !== action.itemId)
          }));
          break;
        case 'update':
          set(state => ({
            cart: state.cart
              .map(i => i.itemId === action.itemId ? { ...i, qty: action.qty ?? i.qty } : i)
              .filter(i => i.qty > 0)
          }));
          break;
        case 'clear':
          set(() => ({ cart: [] }));
          break;
      }
    });
  },

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
}));

export default useCartStore;
