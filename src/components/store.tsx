"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import {
  lineSchema,
  type Product,
  type CartLine,
  type StoreConfig,
} from "@/lib/schema";
type Store = {
  products: Product[];
  config: StoreConfig;
  demo: boolean;
  firebaseReady: boolean;
  checkoutDisabled: string | null;
  cart: CartLine[];
  favorites: string[];
  ready: boolean;
  add: (line: CartLine) => string | null;
  quantity: (productId: string, variantId: string, n: number) => void;
  remove: (productId: string, variantId: string) => void;
  clear: () => void;
  favorite: (id: string) => void;
  message: (s: string) => void;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({
  children,
  ...data
}: {
  children: ReactNode;
  products: Product[];
  config: StoreConfig;
  demo: boolean;
  firebaseReady: boolean;
  checkoutDisabled: string | null;
}) {
  const [cart, setCart] = useState<CartLine[]>([]),
    [favorites, setFavorites] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [toast, setToast] = useState("");
  const key = `kn-${data.demo ? "demo" : "live"}-cart-v1`;
  useEffect(() => {
    try {
      setCart(
        z
          .array(lineSchema)
          .max(30)
          .parse(JSON.parse(localStorage.getItem(key) || "[]")),
      );
      setFavorites(
        z
          .array(z.string())
          .max(500)
          .parse(JSON.parse(localStorage.getItem("kn-favorites") || "[]")),
      );
    } catch {
      setCart([]);
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(key, JSON.stringify(cart));
        localStorage.setItem("kn-favorites", JSON.stringify(favorites));
      } catch {}
    }
  }, [cart, favorites, ready, key]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  function add(line: CartLine) {
    const v = data.products
      .find((p) => p.id === line.productId)
      ?.variants.find((v) => v.id === line.variantId);
    const existing = cart.find(
      (l) => l.productId === line.productId && l.variantId === line.variantId,
    );
    if (
      !v ||
      line.quantity + (existing?.quantity || 0) >
        Math.min(10, v.stock - v.reserved)
    )
      return "La cantidad supera la disponibilidad de esta variante.";
    setCart((c) =>
      existing
        ? c.map((l) =>
            l === existing ? { ...l, quantity: l.quantity + line.quantity } : l,
          )
        : [...c, line],
    );
    setToast("Prenda añadida a tu bolsa.");
    return null;
  }
  return (
    <Context.Provider
      value={{
        ...data,
        cart,
        favorites,
        ready,
        add,
        quantity: (pid, vid, n) =>
          setCart((c) =>
            c.map((l) =>
              l.productId === pid && l.variantId === vid
                ? { ...l, quantity: Math.max(1, Math.min(10, n)) }
                : l,
            ),
          ),
        remove: (pid, vid) =>
          setCart((c) =>
            c.filter((l) => !(l.productId === pid && l.variantId === vid)),
          ),
        clear: () => setCart([]),
        favorite: (id) =>
          setFavorites((f) =>
            f.includes(id) ? f.filter((v) => v !== id) : [...f, id],
          ),
        message: setToast,
      }}
    >
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`toast ${toast ? "visible" : ""}`}
      >
        {toast}
      </div>
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider requerido");
  return value;
}
