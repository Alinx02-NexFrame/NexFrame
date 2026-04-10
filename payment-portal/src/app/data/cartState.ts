// Global cart state management
export interface CartItem {
  awbNumber: string;
  amount: number;
}

class CartState {
  private cart: CartItem[] = [];
  private listeners: (() => void)[] = [];

  addToCart(awbNumber: string, amount: number): boolean {
    // Check if already in cart
    if (this.cart.some(item => item.awbNumber === awbNumber)) {
      return false;
    }
    this.cart.push({ awbNumber, amount });
    this.notifyListeners();
    return true;
  }

  removeFromCart(awbNumber: string): void {
    this.cart = this.cart.filter(item => item.awbNumber !== awbNumber);
    this.notifyListeners();
  }

  clearCart(): void {
    this.cart = [];
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
