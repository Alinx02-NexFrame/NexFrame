// AWB 화물 정보 타입
export interface CargoInfo {
  awbNumber: string;
  origin: string;
  destination: string;
  flightDate: string;
  arrivalDate: string;
  arrivalTime: string;
  breakdownStatus: 'In Progress' | 'Completed';
  customsStatus: 'PNF' | 'Hold' | 'Released';
  storageStartDate: string;
  freeTimeDays: number;
  pieces: number;
  weight: number;
  description: string;
  consignee: string;
  readyToPickup: boolean;
}

// 비용 정보 타입
export interface BillingInfo {
  awbNumber: string;
  serviceFee: number;
  storageFee: number;
  otherCharge: number;
  subtotal: number;
  processingFee: number;
  total: number;
}

// 결제 정보 타입
export interface PaymentInfo {
  paymentMethod: 'Credit Card' | 'ACH' | 'International Wire';
  email: string;
  phone?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCVV?: string;
  accountNumber?: string;
  routingNumber?: string;
}

// 결제 완료 정보 타입
export interface PaymentConfirmation {
  confirmationNumber: string;
  awbNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  /** Set only when this row came from a bulk submission. */
  batchId?: string | null;
}

// 사용자 타입
export interface User {
  id: string;
  email: string;
  companyName: string;
  role: 'forwarder' | 'gha_admin';
}

// Dashboard - 결제 대기 항목
export interface PendingPayment {
  awbNumber: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'overdue';
}

// Dashboard - 결제 완료 항목
export interface CompletedPayment {
  id: string;
  awbNumber: string;
  paymentDate: string;
  amount: number;
  processingFee: number;
  receiptUrl: string;
}

// GHA Admin - 매출 통계
export interface RevenueStats {
  totalRevenue: number;
  processingFeeRevenue: number;
  storageFeeRevenue: number;
  transactionCount: number;
  period: string;
}
