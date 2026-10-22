import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine } from '../../shared/types';
type Cart = {
  lines: CartLine[];
  add: (id: number) => void;
  quantity: (id: number, quantity: number) => void;
  instructions: (id: number, text: string) => void;
  clear: () => void;
  count: number;
};
const CartContext = createContext<Cart | null>(null);
function readCart(): CartLine[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('hushgrain-tray-v2') || '[]');
    if (!Array.isArray(saved)) return [];
    const ids = new Set<number>();
    return saved
      .filter((line) => {
        if (
          !line ||
          !Number.isInteger(line.menuItemId) ||
          line.menuItemId < 1 ||
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > 12 ||
          typeof line.specialInstructions !== 'string' ||
          ids.has(line.menuItemId)
        )
          return false;
        ids.add(line.menuItemId);
        return true;
      })
      .slice(0, 30)
      .map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        specialInstructions: line.specialInstructions.slice(0, 300),
      }));
  } catch {
    return [];
  }
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart);
  useEffect(() => {
    try {
      localStorage.setItem('hushgrain-tray-v2', JSON.stringify(lines));
    } catch {
      /* Storage is optional. */
    }
  }, [lines]);
  const value = useMemo<Cart>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add(id) {
        setLines((current) =>
          current.some((line) => line.menuItemId === id)
            ? current.map((line) =>
                line.menuItemId === id
                  ? { ...line, quantity: Math.min(12, line.quantity + 1) }
                  : line,
              )
            : [...current, { menuItemId: id, quantity: 1, specialInstructions: '' }],
        );
      },
      quantity(id, quantity) {
        setLines((current) =>
          quantity <= 0
            ? current.filter((line) => line.menuItemId !== id)
            : current.map((line) =>
                line.menuItemId === id
                  ? { ...line, quantity: Math.min(12, Math.floor(quantity)) }
                  : line,
              ),
        );
      },
      instructions(id, text) {
        setLines((current) =>
          current.map((line) =>
            line.menuItemId === id ? { ...line, specialInstructions: text.slice(0, 300) } : line,
          ),
        );
      },
      clear() {
        setLines([]);
      },
    }),
    [lines],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('Missing cart provider');
  return value;
}
const ToastContext = createContext<(text: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);
  return (
    <ToastContext.Provider value={setToast}>
      {children}
      <div role="status" aria-live="polite" className={`toast ${toast ? 'visible' : ''}`}>
        {toast}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
