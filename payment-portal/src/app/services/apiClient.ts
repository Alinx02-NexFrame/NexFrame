import type { CargoInfo, BillingInfo, PaymentInfo, PaymentConfirmation, PendingPayment, CompletedPayment, RevenueStats } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Token + currentUser persistence: localStorage so a page refresh doesn't
// silently sign the user out. SSR-safe (typeof window guard).
const TOKEN_KEY = 'gha.accessToken';
const USER_KEY = 'gha.currentUser';
const hasStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readStored<T>(key: string): T | null {
  if (!hasStorage) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

function writeStored(key: string, value: unknown) {
  if (!hasStorage) return;
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota / disabled — best-effort only */ }
}

let accessToken: string | null = readStored<string>(TOKEN_KEY);

export function setAccessToken(token: string | null) {
  accessToken = token;
  writeStored(TOKEN_KEY, token);
}

export function getAccessToken() {
  return accessToken;
}

// Current user (set after login/register so callers can access email, role, etc.
// without re-fetching /auth/me).
export type CompanyRole = 'Admin' | 'Manager' | 'Member';

export interface CurrentUser {
  id: number;
  username?: string;
  email: string;
  fullName: string;
  companyName: string;
  role: string;
  companyRole?: CompanyRole | null;
}

let currentUser: CurrentUser | null = readStored<CurrentUser>(USER_KEY);

export function setCurrentUser(user: CurrentUser | null) {
  currentUser = user;
  writeStored(USER_KEY, user);
}

export function getCurrentUser(): CurrentUser | null {
  return currentUser;
}

// Sign out helper: clears token + user. Components should also clear any
// in-memory state (cart/watchlist) and navigate to '/' separately.
export function clearAuth() {
  setAccessToken(null);
  setCurrentUser(null);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Server rejected the bearer (expired / revoked / signing key mismatch).
    // Clear cached auth so the user is forced back through login instead of
    // looping on a dead token.
    if (response.status === 401 && accessToken) {
      clearAuth();
    }
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.title || `Request failed: ${response.status}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return undefined as T;
}

// Auth API
type AuthUserResponse = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  companyName: string;
  role: string;
  companyRole?: CompanyRole | null;
};

export const authApi = {
  login: (username: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: AuthUserResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (data: { username: string; email: string; password: string; fullName: string; companyName: string }) =>
    request<{ accessToken: string; refreshToken: string; user: AuthUserResponse }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<AuthUserResponse>('/auth/me'),
};

// Cargo API
export const cargoApi = {
  search: (awbNumber: string) =>
    request<CargoInfo>(`/cargo/search?awbNumber=${encodeURIComponent(awbNumber)}`),
};

// Billing API
export const billingApi = {
  getByAwb: (awbNumber: string) =>
    request<BillingInfo>(`/billing/${encodeURIComponent(awbNumber)}`),
};

// Payment API
//
// Field naming follows the backend DTO `CreatePaymentRequest` exactly
// (CardExpiry / CardCVV — NOT CardExpiryDate / CardCvv). Bulk endpoint
// currently only consumes AwbNumbers + PaymentMethod on the backend, but we
// pass card/ACH fields too so future expansion is one-sided (backend can
// start consuming them without a frontend change).
export const paymentApi = {
  process: (data: { awbNumber: string; paymentMethod: string; email: string; cardNumber?: string; cardExpiry?: string; cardCVV?: string; accountNumber?: string; routingNumber?: string }) =>
    request<PaymentConfirmation>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  processAuthenticated: (data: {
    awbNumber: string;
    paymentMethod: string;
    email: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCVV?: string;
    accountNumber?: string;
    routingNumber?: string;
    savedCardId?: number;
  }) =>
    request<PaymentConfirmation>('/payments/authenticated', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  processBulk: (data: {
    awbNumbers: string[];
    paymentMethod: string;
    email: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCVV?: string;
    accountNumber?: string;
    routingNumber?: string;
    savedCardId?: number;
  }) =>
    request<PaymentConfirmation[]>('/payments/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReceiptUrl: (confirmationNumber: string) =>
    `${BASE_URL}/payments/${encodeURIComponent(confirmationNumber)}/receipt`,

  // Bulk-receipt endpoint is [Authorize] — use downloadAuthenticatedPdf() to
  // attach the JWT, NOT window.open().
  getBulkReceiptUrl: (confirmationNumbers: string[]) =>
    `${BASE_URL}/payments/bulk-receipt?confirmations=${confirmationNumbers
      .map(encodeURIComponent)
      .join(',')}`,
};

/**
 * Download a PDF that requires JWT auth. Falls back to a friendly error
 * if the request fails. Used for endpoints that cannot be hit with a plain
 * `window.open(url)` because they require an Authorization header.
 */
export async function downloadAuthenticatedPdf(url: string, filename: string): Promise<boolean> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    return false;
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
  return true;
}

// Forwarder API
export const forwarderApi = {
  getDashboard: () =>
    request<{ accountCredit: number; pendingCount: number; overdueCount: number; totalPendingAmount: number }>('/forwarder/dashboard'),

  getPendingPayments: () =>
    request<PendingPayment[]>('/forwarder/payments/pending'),

  getPaymentHistory: (page = 1, pageSize = 10, search?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    return request<{ items: CompletedPayment[]; totalCount: number; page: number; pageSize: number; totalPages: number }>(`/forwarder/payments/history?${params}`);
  },

  getTransactionChart: () =>
    request<{ month: string; amount: number; count: number }[]>('/forwarder/reports/transactions'),

  getFeeCategoryBreakdown: () =>
    request<{ name: string; value: number }[]>('/forwarder/reports/categories'),

  getTransactionSummary: () =>
    request<{
      monthlyTotal: number;
      monthlyTotalGrowthPercent: number;
      transactionCount: number;
      transactionCountGrowthPercent: number;
      averageTransaction: number;
      periodMonths: number;
      periodLabel: string;
    }>('/forwarder/reports/summary'),

  exportReport: (format: string) => {
    // Direct download - open in new tab
    window.open(`${BASE_URL}/forwarder/reports/export?format=${format}`, '_blank');
  },

  getWatchlist: () =>
    request<{ id: number; items: { id: number; awbNumber: string; addedAt: string }[] }>('/forwarder/watchlist'),

  addWatchlistItem: (awbNumber: string) =>
    request<{ id: number; awbNumber: string; addedAt: string }>('/forwarder/watchlist', {
      method: 'POST',
      body: JSON.stringify({ awbNumber }),
    }),

  removeWatchlistItem: (itemId: number) =>
    request<void>(`/forwarder/watchlist/${itemId}`, { method: 'DELETE' }),

  // Company user management (Admin-only on the backend)
  getCompanyUsers: () =>
    request<{ id: number; email: string; fullName: string; companyRole: CompanyRole | null; isActive: boolean }[]>('/forwarder/users'),

  createCompanyUser: (data: { email: string; fullName: string; password: string; companyRole: CompanyRole }) =>
    request<{ id: number; email: string; fullName: string; companyRole: CompanyRole | null; isActive: boolean }>('/forwarder/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCompanyUser: (targetUserId: number, data: { fullName?: string; companyRole?: CompanyRole; isActive?: boolean }) =>
    request<{ id: number; email: string; fullName: string; companyRole: CompanyRole | null; isActive: boolean }>(`/forwarder/users/${targetUserId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCompanyUser: (targetUserId: number) =>
    request<void>(`/forwarder/users/${targetUserId}`, { method: 'DELETE' }),
};

// Cart API (persisted, User-scoped)
export const cartApi = {
  get: () =>
    request<{ id: number; items: { id: number; awbNumber: string; amount: number; addedAt: string }[] }>('/forwarder/cart'),

  addItem: (awbNumber: string, amount: number) =>
    request<{ id: number; awbNumber: string; amount: number; addedAt: string }>('/forwarder/cart', {
      method: 'POST',
      body: JSON.stringify({ awbNumber, amount }),
    }),

  removeItem: (itemId: number) =>
    request<void>(`/forwarder/cart/${itemId}`, { method: 'DELETE' }),

  clear: () =>
    request<void>('/forwarder/cart', { method: 'DELETE' }),
};

// Saved-card API (Company-scoped — shared by all forwarder users, admin-managed)
export type SavedCard = {
  id: number;
  cardLast4: string;
  cardBrand: string;
  cardHolderName: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: string;
};

export const savedCardApi = {
  list: () => request<SavedCard[]>('/forwarder/saved-cards'),

  add: (data: { cardNumber: string; cardBrand: string; cardHolderName: string; expiryMonth: number; expiryYear: number; isDefault: boolean }) =>
    request<SavedCard>('/forwarder/saved-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  setDefault: (cardId: number) =>
    request<void>(`/forwarder/saved-cards/${cardId}/default`, { method: 'POST' }),

  remove: (cardId: number) =>
    request<void>(`/forwarder/saved-cards/${cardId}`, { method: 'DELETE' }),
};

// GHA Admin API
export const ghaApi = {
  getRevenue: () =>
    request<RevenueStats>('/gha/revenue'),

  getMonthlyTrend: () =>
    request<{ month: string; revenue: number; transactions: number }[]>('/gha/revenue/monthly-trend'),

  getRevenueBreakdown: () =>
    request<{ category: string; amount: number; percentage: number }[]>('/gha/revenue/breakdown'),

  getSettlement: () =>
    request<{ totalProcessingFees: number; settlementAmount: number; settlementRate: number }>('/gha/revenue/settlement'),

  getTopCustomers: (count = 5) =>
    request<{ companyName: string; transactionCount: number; totalSpent: number }[]>(`/gha/revenue/top-customers?count=${count}`),

  getCustomers: (page = 1, pageSize = 10, search?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    return request<{ items: { id: string; companyName: string; email: string; totalTransactions: number; lastPaymentDate: string; totalSpent: number }[]; totalCount: number }>(`/gha/customers?${params}`);
  },

  getRecentActivity: (count = 20) =>
    request<{ type: string; description: string; timestamp: string }[]>(`/gha/customers/activity?count=${count}`),

  getReportsList: (count = 10) =>
    request<{ id: number; name: string; reportType: string; format: string; fileUrl?: string; generatedAt: string }[]>(`/gha/reports/list?count=${count}`),

  getMonthlyInsights: () =>
    request<{ revenueGrowthPercent: number; newCustomersThisMonth: number; topCustomerName: string; topCustomerSpent: number }>('/gha/insights/monthly'),
};
