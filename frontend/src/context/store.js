import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-store',
      storage: localStorage,
    }
  )
);

export const useOrderStore = create((set, get) => ({
  currentOrder: null,
  orderItems: [],
  
  createOrder: (order) => set({ currentOrder: order, orderItems: [] }),
  
  addItem: (item) => set((state) => ({
    orderItems: [...state.orderItems, { ...item, id: Date.now() }],
  })),
  
  updateItem: (itemId, updates) => set((state) => ({
    orderItems: state.orderItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ),
  })),
  
  removeItem: (itemId) => set((state) => ({
    orderItems: state.orderItems.filter(item => item.id !== itemId),
  })),
  
  clearOrder: () => set({ currentOrder: null, orderItems: [] }),
  
  getCartTotal: () => {
    const { orderItems } = get();
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  },
}));

export const useTablesStore = create((set) => ({
  tables: [],
  stats: null,
  
  setTables: (tables) => set({ tables }),
  setStats: (stats) => set({ stats }),
  
  updateTableStatus: (tableId, status) => set((state) => ({
    tables: state.tables.map(table =>
      table.id === tableId ? { ...table, status } : table
    ),
  })),
}));

export const useCategoriesStore = create((set) => ({
  categories: [],
  
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({
    categories: [...state.categories, category],
  })),
  updateCategory: (categoryId, updates) => set((state) => ({
    categories: state.categories.map(cat =>
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ),
  })),
  deleteCategory: (categoryId) => set((state) => ({
    categories: state.categories.filter(cat => cat.id !== categoryId),
  })),
}));

export const useProductsStore = create((set) => ({
  products: [],
  
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({
    products: [...state.products, product],
  })),
  updateProduct: (productId, updates) => set((state) => ({
    products: state.products.map(prod =>
      prod.id === productId ? { ...prod, ...updates } : prod
    ),
  })),
  deleteProduct: (productId) => set((state) => ({
    products: state.products.filter(prod => prod.id !== productId),
  })),
}));
