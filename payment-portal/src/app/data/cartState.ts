// Persistent cart backed by /api/forwarder/cart (User-scoped).
//
// Keeps the observer pattern so existing components (Cart, ForwarderDashboard,
// CargoStatus, PendingPayments, AwbDetailPage, routeWrappers) can subscribe
// synchronously for count badges, while mutations go through the backend.
//
// Optimistic updates: local state is updated first, API call runs in
// background. On failure the local state is reverted and subscribers are
// notified again so the UI reflects the true server state.

import { cartApi } from '../services/apiClient';

export interface CartItem {
  id?: number;        // server-issued id (undefined for optimistic entries)
  awbNumber: string;
  amount: number;
}

class CartState {
  private cart: CartItem[] = [];
  private listeners: (() => void)[] = [];
  private loaded = false;
  private loadingPromise: Promise<void> | null = null;

  /** Load the cart from the server. Idempotent across concurrent callers. */
  async load(): Promise<void> {
    if (this.loaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        const result = await cartApi.get();
        this.cart = result.items.map(i => ({ id: i.id, awbNumber: i.awbNumber, amount: i.amount }));
        this.loaded = true;
        this.notifyListeners();
      } catch {
        // Not authenticated yet or server error — leave cart empty.
        this.cart = [];
      } finally {
        this.loadingPromise = null;
      }
    })();

    return this.loadingPromise;
  }

  /** Reset to unloaded state (call on logout). */
  reset(): void {
    this.cart = [];
    this.loaded = false;
    this.loadingPromise = null;
    this.notifyListeners();
  }

  async addToCart(awbNumber: string, amount: number): Promise<boolean> {
    if (this.cart.some(item => item.awbNumber === awbNumber)) return false;

    // Optimistic: show immediately, reconcile with server id on success.
    const optimistic: CartItem = { awbNumber, amount };
    this.cart.push(optimistic);
    this.notifyListeners();

    try {
      const saved = await cartApi.addItem(awbNumber, amount);
      const idx = this.cart.findIndex(i => i.awbNumber === awbNumber && i.id === undefined);
      if (idx >= 0) {
        this.cart[idx] = { id: saved.id, awbNumber: saved.awbNumber, amount: saved.amount };
        this.notifyListeners();
      }
      return true;
    } catch {
      // Roll back optimistic add.
      this.cart = this.cart.filter(i => !(i.awbNumber === awbNumber && i.id === undefined));
      this.notifyListeners();
      return false;
    }
  }

  async removeFromCart(awbNumber: string): Promise<void> {
    const item = this.cart.find(i => i.awbNumber === awbNumber);
    if (!item) return;

    const previous = [...this.cart];
    this.cart = this.cart.filter(i => i.awbNumber !== awbNumber);
    this.notifyListeners();

    if (item.id === undefined) return;  // never persisted, nothing to call

    try {
      await cartApi.removeItem(item.id);
    } catch {
      // Revert on failure.
      this.cart = previous;
      this.notifyListeners();
    }
  }

  async clearCart(): Promise<void> {
    if (this.cart.length === 0) return;
    const previous = [...this.cart];
    this.cart = [];
    this.notifyListeners();

    try {
      await cartApi.clear();
    } catch {
      this.cart = previous;
      this.notifyListeners();
    }
  }

  /**
   * Local-only removal — used by checkout confirmation flow when the server
   * has already deleted the CartItem server-side (the payment endpoint
   * removes the cart row after a successful payment, so the client just
   * needs to reconcile its local state).
   */
  removeLocalByAwb(awbNumber: string): void {
    const hadItem = this.cart.some(i => i.awbNumber === awbNumber);
    if (!hadItem) return;
    this.cart = this.cart.filter(i => i.awbNumber !== awbNumber);
    this.notifyListeners();
  }

  getCart(): CartItem[] {
    return [...this.cart];
  }

  getCartCount(): number {
    return this.cart.length;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const globalCartState = new CartState();
