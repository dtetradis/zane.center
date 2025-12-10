import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Service } from '@/types';

interface CartState {
  items: CartItem[];
  storeId: string | null;
  storeName: string | null;

  // Actions
  addItem: (service: Service, employee?: string, dateTime?: string) => void;
  removeItem: (serviceId: string) => void;
  updateItemDateTime: (serviceId: string, dateTime: string) => void;
  updateItemEmployee: (serviceId: string, employee: string) => void;
  clearCart: () => void;
  setStore: (storeId: string, storeName: string) => void;
  validateCartItems: (validServiceIds: string[]) => void;

  // Computed
  getTotalDuration: () => number;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      storeName: null,

      addItem: (service, employee, dateTime) => {
        set((state) => {
          // Check if item already exists
          const existingItem = state.items.find(item => item.service.id === service.id);

          if (existingItem) {
            // Update existing item
            return {
              items: state.items.map(item =>
                item.service.id === service.id
                  ? { ...item, employee, dateTime }
                  : item
              ),
            };
          }

          // Add new item
          return {
            items: [...state.items, { service, employee, dateTime }],
          };
        });
      },

      removeItem: (serviceId) => {
        set((state) => ({
          items: state.items.filter(item => item.service.id !== serviceId),
        }));
      },

      updateItemDateTime: (serviceId, dateTime) => {
        set((state) => ({
          items: state.items.map(item =>
            item.service.id === serviceId
              ? { ...item, dateTime }
              : item
          ),
        }));
      },

      updateItemEmployee: (serviceId, employee) => {
        set((state) => ({
          items: state.items.map(item =>
            item.service.id === serviceId
              ? { ...item, employee }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], storeId: null, storeName: null });
      },

      setStore: (storeId, storeName) => {
        set({ storeId, storeName });
      },

      validateCartItems: (validServiceIds) => {
        set((state) => {
          const validItems = state.items.filter(item =>
            validServiceIds.includes(item.service.id)
          );

          // Only update if items were removed
          if (validItems.length !== state.items.length) {
            console.log(`Removed ${state.items.length - validItems.length} invalid items from cart`);
            return { items: validItems };
          }

          return state;
        });
      },

      getTotalDuration: () => {
        return get().items.reduce((total, item) => total + item.service.duration, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.service.price, 0);
      },

      getItemCount: () => {
        return get().items.length;
      },
    }),
    {
      name: 'zane-center-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
