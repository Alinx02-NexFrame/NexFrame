// Global watchlist state management
type WatchlistListener = () => void;

class WatchlistState {
  private watchlist: string[] = [
    '020-12345678', '020-98765432', '020-11223344', '020-55667788',
    '020-99887766', '020-44556677', '020-22334455', '020-88776655',
    '020-33445566', '020-66778899', '020-55443322', '020-77665544',
    '020-11009988', '020-22119977', '020-33221166', '020-44332255',
    '020-55446633', '020-66557744', '020-77668855', '020-88779966',
    '020-99881122', '020-10293847', '020-56473829', '020-91827364',
    '020-47382910'  // 25 AWBs for testing
  ];
  private listeners: WatchlistListener[] = [];

  subscribe(listener: WatchlistListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  getWatchlist(): string[] {
    return [...this.watchlist];
  }

  getWatchlistCount(): number {
    return this.watchlist.length;
  }

  addToWatchlist(awbNumber: string): boolean {
    if (this.watchlist.includes(awbNumber)) {
      return false; // Already in watchlist
    }
    this.watchlist.push(awbNumber);
    this.notify();
    return true;
  }

  removeFromWatchlist(awbNumber: string): boolean {
    const index = this.watchlist.indexOf(awbNumber);
    if (index === -1) {
      return false; // Not in watchlist
    }
    this.watchlist.splice(index, 1);
    this.notify();
    return true;
  }

  isInWatchlist(awbNumber: string): boolean {
    return this.watchlist.includes(awbNumber);
  }

  clearWatchlist() {
    this.watchlist = [];
    this.notify();
  }
}

export const globalWatchlistState = new WatchlistState();
