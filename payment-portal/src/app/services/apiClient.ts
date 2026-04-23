import type { CargoInfo, BillingInfo, PaymentInfo, PaymentConfirmation, PendingPayment, CompletedPayment, RevenueStats } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Token management
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

// Current user (set after login/register so callers can access email, role, etc.
// without re-fetching /auth/me).
export interface CurrentUser {
  id: number;
  username?: string;
  email: string;
  fullName: string;
  companyName: string;
  role: string;
}

let currentUser: CurrentUser | null = null;

export function setCurrentUser(user: CurrentUser | null) {
  currentUser = user;
}

export function getCurrentUser(): CurrentUser | null {
  return currentUser;
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
export const authApi = {
  login: (username: string, password: string) =>
    request<{ accessToken: string; refreshToken: string; user: { id: number; username: string; email: string; fullName: string; companyName: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (data: { username: string; email: string; password: string; fullName: string; companyName: string }) =>
    request<{ accessToken: string; refreshToken: string; user: { id: number; username: string; email: string; fullName: string; companyName: string; role: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<{ id: number; email: string; fullName: string; companyName: string; role: string }>('/auth/me'),
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
  }) =>
    request<PaymentConfirmation[]>('/payments/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReceiptUrl: (confirmationNumber: string) =>
    `${BASE_URL}/payments/${encodeURIComponent(confirmationNumber)}/receipt`,
};

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
