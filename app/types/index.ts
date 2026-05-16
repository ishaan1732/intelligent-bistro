export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface CartAction {
  type: 'add' | 'remove' | 'update' | 'clear';
  itemId?: string;
  name?: string;
  price?: number;
  qty?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
