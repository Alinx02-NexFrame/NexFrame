// Global account balance state management
class AccountState {
  private balance: number = 100000.00; // Initial balance
  private listeners: (() => void)[] = [];

  getBalance(): number {
    return this.balance;
  }

  deductBalance(amount: number): boolean {
    if (this.balance >= amount) {
      this.balance -= amount;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  addBalance(amount: number): void {
    this.balance += amount;
    this.notifyListeners();
  }

  setBalance(amount: number): void {
    this.balance = amount;
    this.notifyListeners();
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

export const globalAccountState = new AccountState();
