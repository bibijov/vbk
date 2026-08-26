"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  count: number;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  quantityOf: (productId: string) => number;
}

const CartContext = createContext<CartState | null>(null);

const storageKey = (clinicId: string) => `vbk.cart.${clinicId}`;

function readCart(clinicId: string | null): CartLine[] {
  if (!clinicId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(clinicId));
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

/**
 * Korpa živi u localStorage po klinici — preživi refresh, ne meša se između
 * naloga. Roditelj prosleđuje `key={clinicId}` da se stanje podigne iznova.
 */
export function CartProvider({
  clinicId,
  children,
}: {
  clinicId: string | null;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>(() => readCart(clinicId));

  useEffect(() => {
    if (!clinicId) return;
    window.localStorage.setItem(storageKey(clinicId), JSON.stringify(lines));
  }, [clinicId, lines]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.productId !== productId);
      const exists = prev.some((l) => l.productId === productId);
      if (!exists) return [...prev, { productId, quantity }];
      return prev.map((l) => (l.productId === productId ? { ...l, quantity } : l));
    });
  }, []);

  const value = useMemo<CartState>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      setQuantity,
      add: (productId, quantity = 1) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.productId === productId);
          if (!existing) return [...prev, { productId, quantity }];
          return prev.map((l) =>
            l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
          );
        }),
      remove: (productId) =>
        setLines((prev) => prev.filter((l) => l.productId !== productId)),
      clear: () => setLines([]),
      quantityOf: (productId) =>
        lines.find((l) => l.productId === productId)?.quantity ?? 0,
    }),
    [lines, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart mora biti unutar <CartProvider>.");
  return ctx;
}
