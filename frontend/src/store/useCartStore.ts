import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 询价单/购物车状态管理 (Zustand Store)
 * 
 * 功能:
 * - 管理用户临时选择的商品 (Items)
 * - 自动合并相同 SKU 的商品数量
 * - 计算总数量和预估总价
 * - 持久化到 localStorage ('rfq-cart-storage')
 */
export interface CartItem {
  id: string; // 唯一复合键: productId-skuId
  productId: string;
  productName: string;
  skuId: string;
  skuCode?: string;
  color?: string; // (旧字段) 兼容性保留
  size?: string;  // (旧字段) 兼容性保留
  specs?: string; // 新版规格描述字符串 (e.g. "Color: Red, Size: 42")
  quantity: number;
  price: number;  // 预估单价
  image: string;
  type?: 'STANDARD' | 'SAMPLE'; // 订单类型
}

interface CartStore {
  items: CartItem[]; // 商品列表
  addItem: (item: CartItem) => void; // 添加商品 (自动去重合并)
  removeItem: (id: string) => void;  // 移除商品
  updateQuantity: (id: string, quantity: number) => void; // 更新数量
  clearCart: () => void; // 清空购物车
  totalItems: () => number; // 获取总件数
  totalPrice: () => number; // 获取总金额
  getCartType: () => 'STANDARD' | 'SAMPLE' | null; // 获取当前购物车类型
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => set((state) => {
        // 1. Check for Mixed Cart Conflict
        const currentType = state.items.length > 0 ? (state.items[0].type || 'STANDARD') : null;
        const newType = newItem.type || 'STANDARD';

        if (currentType && currentType !== newType) {
          // Ideally, we should throw an error or handle this in UI. 
          // For now, we will replace the cart if types conflict to avoid invalid state, 
          // but a better UX would be to ask the user.
          // Since this is a void function, we can't return an error easily without changing signature.
          // We will Assume the UI checks this using `getCartType` before calling addItem, 
          // OR we strictly enforce it here by clearing if conflict (aggressive).
          // Let's go with: Conflict -> Reject (do nothing) or Replace?
          // Let's Replace for now (simplest "Switch Mode" logic), but arguably dangerous.
          // Better: Append ONLY if matching.
          // Actually, let's just allow it here and filter/split later? No, Backend Order has one type.
          // Let's clear if type mismatch.
          return { items: [newItem] }; 
        }

        const existingItem = state.items.find(item => item.id === newItem.id);
        
        if (existingItem) {
          // 如果商品已存在，则合并数量
          return {
            items: state.items.map(item => 
              item.id === newItem.id 
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            )
          };
        }
        
        return { items: [...state.items, newItem] };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),

      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(item => 
          item.id === id ? { ...item, quantity } : item
        )
      })),

      clearCart: () => set({ items: [] }),

      totalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      },

      getCartType: () => {
        const items = get().items;
        if (items.length === 0) return null;
        return items[0].type || 'STANDARD';
      }
    }),
    {
      name: 'rfq-cart-storage', // 持久化 Key
    }
  )
);
