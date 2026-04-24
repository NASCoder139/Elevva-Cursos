import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  thumbnailUrl: string | null;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'elevva_cart';
const LEGACY_STORAGE_KEY = 'miaccess_cart';

// Migra el carrito guardado bajo la clave antigua (antes del rebranding a Elevva)
// hacia la nueva. Se ejecuta una sola vez: si ya existe la nueva o no existe la vieja,
// no hace nada.
function migrateLegacyCart(): string | null {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current !== null) return current;
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy !== null) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = migrateLegacyCart();
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (item: CartItem) => {
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
    setDrawerOpen(true);
  };
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const has = (id: string) => items.some((i) => i.id === id);

  const total = items.reduce((sum, i) => sum + Number(i.price || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        total,
        add,
        remove,
        clear,
        has,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
