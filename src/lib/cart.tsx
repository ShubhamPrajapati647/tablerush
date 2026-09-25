import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartAddon = { id: string; name: string; price: number };

export type CartLine = {
  line_id: string;
  menu_item_id: string;
  name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  addons: CartAddon[];
  instructions: string;
};

export type CartVenue = {
  business_id: string;
  business_name: string;
  business_type: "restaurant" | "cafe";
  table_id: string;
  table_number: string;
  token: string;
};

export type Cart = { venue: CartVenue; lines: CartLine[] } | null;

/** Tax applied to the customer subtotal. Server-side order creation recomputes it. */
export const TAX_RATE = 0.05;

const STORAGE_KEY = "table-rush-cart-v1";

function readStored(): Cart {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cart;
    if (!parsed?.venue?.business_id || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function lineTotal(line: CartLine): number {
  const addons = line.addons.reduce((sum, addon) => sum + Number(addon.price), 0);
  return (Number(line.unit_price) + addons) * line.quantity;
}

export function cartTotals(cart: Cart) {
  const subtotal = (cart?.lines ?? []).reduce((sum, line) => sum + lineTotal(line), 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

type CartContextValue = {
  cart: Cart;
  count: number;
  /** Adds a line. Switching venue replaces the cart so items never mix businesses. */
  addLine: (venue: CartVenue, line: Omit<CartLine, "line_id">) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  /** True when the cart holds items from a different venue than the one given. */
  isOtherVenue: (businessId: string) => boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(null);

  useEffect(() => {
    setCart(readStored());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (cart && cart.lines.length > 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [cart]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      count: (cart?.lines ?? []).reduce((sum, line) => sum + line.quantity, 0),
      addLine: (venue, line) =>
        setCart((current) => {
          const sameVenue =
            current && current.venue.business_id === venue.business_id &&
            current.venue.table_id === venue.table_id;
          const lines = sameVenue ? [...current.lines] : [];
          const lineId = `${line.menu_item_id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          return { venue, lines: [...lines, { ...line, line_id: lineId }] };
        }),
      setQuantity: (lineId, quantity) =>
        setCart((current) => {
          if (!current) return current;
          const lines = current.lines
            .map((line) => (line.line_id === lineId ? { ...line, quantity } : line))
            .filter((line) => line.quantity > 0);
          return lines.length > 0 ? { ...current, lines } : null;
        }),
      removeLine: (lineId) =>
        setCart((current) => {
          if (!current) return current;
          const lines = current.lines.filter((line) => line.line_id !== lineId);
          return lines.length > 0 ? { ...current, lines } : null;
        }),
      clear: () => setCart(null),
      isOtherVenue: (businessId) => Boolean(cart && cart.venue.business_id !== businessId),
    }),
    [cart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
