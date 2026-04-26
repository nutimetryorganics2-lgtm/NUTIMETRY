import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';

// Configure localforage for IndexedDB persistence
localforage.config({
  name: 'nutimetryorganics_app',
  storeName: 'app_state'
});

const storage = {
  getItem: async (name) => await localforage.getItem(name),
  setItem: async (name, value) => await localforage.setItem(name, value),
  removeItem: async (name) => await localforage.removeItem(name),
};

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null, // 'admin' or 'farmer'
      token: null,
      isAuthenticated: false,
      _hasHydrated: false, // Hydration tracker

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      setAuth: (user, role, token) => set({ 
        user, 
        role, 
        token, 
        isAuthenticated: true 
      }),

      logout: () => {
        set({ 
          user: null, 
          role: null, 
          token: null, 
          isAuthenticated: false 
        });
        // Optional: clear cart on logout if security requires it
        // useCartStore.getState().clearCart();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      }
    }
  )
);

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,
      _hasHydrated: false,

      toggleCart: () => set({ isCartOpen: !get().isCartOpen }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      addToCart: (product) => {
        const { cart } = get();
        const productId = product._id || product.id;
        const existing = cart.find(item => (item._id === productId || item.id === productId));
        
        if (existing) {
          set({
            cart: cart.map(item => (item._id === productId || item.id === productId) 
              ? { ...item, quantity: item.quantity + 1 } 
              : item)
          });
        } else {
          set({ cart: [...cart, { ...product, id: productId, quantity: 1 }] });
        }
      },

      removeFromCart: (id) => set({
        cart: get().cart.filter(item => item._id !== id && item.id !== id)
      }),

      updateQuantity: (id, quantity) => {
        if (quantity < 1) return;
        set({
          cart: get().cart.map(item => (item._id === id || item.id === id) ? { ...item, quantity } : item)
        });
      },

      clearCart: () => set({ cart: [] }),
      
      getCartTotal: () => get().cart.reduce((total, item) => total + (item.price * item.quantity), 0),
      getCartCount: () => get().cart.reduce((count, item) => count + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      }
    }
  )
);

export const useDashboardStore = create((set) => ({
  activeTab: 'overview', // for admin dashboard navigation
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  flockLogs: [],
  addFlockLog: (log) => set((state) => ({ flockLogs: [log, ...state.flockLogs] })),
}));

