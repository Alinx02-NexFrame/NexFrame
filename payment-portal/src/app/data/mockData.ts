import { CargoInfo, BillingInfo, CompletedPayment, PendingPayment, RevenueStats } from '../types';

// Mock AWB 데이터
export const mockCargoData: Record<string, CargoInfo> = {
  '020-12345678': {
    awbNumber: '020-12345678',
    origin: 'ICN (Seoul, Korea)',
    destination: 'LAX (Los Angeles, USA)',
    flightDate: '2026-03-06',
    arrivalDate: '2026-03-07',
    arrivalTime: '14:30',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-07',
    freeTimeDays: 3,
    pieces: 45,
    weight: 1250.5,
    description: 'Electronic Components',
    consignee: 'Tech Solutions Inc.',
    readyToPickup: true
  },
  '020-98765432': {
    awbNumber: '020-98765432',
    origin: 'NRT (Tokyo, Japan)',
    destination: 'SFO (San Francisco, USA)',
    flightDate: '2026-03-05',
    arrivalDate: '2026-03-06',
    arrivalTime: '16:20',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-06',
    freeTimeDays: 3,
    pieces: 32,
    weight: 890.0,
    description: 'Medical Equipment',
    consignee: 'HealthCare Logistics LLC',
    readyToPickup: true
  },
  '020-87654321': {
    awbNumber: '020-87654321',
    origin: 'PVG (Shanghai, China)',
    destination: 'JFK (New York, USA)',
    flightDate: '2026-03-04',
    arrivalDate: '2026-03-05',
    arrivalTime: '09:15',
    breakdownStatus: 'Completed',
    customsStatus: 'Hold',
    storageStartDate: '2026-03-05',
    freeTimeDays: 3,
    pieces: 120,
    weight: 3500.0,
    description: 'Textile Products',
    consignee: 'Fashion Import Co.',
    readyToPickup: false
  },
  '020-11223344': {
    awbNumber: '020-11223344',
    origin: 'HKG (Hong Kong)',
    destination: 'ORD (Chicago, USA)',
    flightDate: '2026-03-07',
    arrivalDate: '2026-03-08',
    arrivalTime: '11:45',
    breakdownStatus: 'In Progress',
    customsStatus: 'PNF',
    storageStartDate: '2026-03-08',
    freeTimeDays: 5,
    pieces: 80,
    weight: 2100.0,
    description: 'Auto Parts',
    consignee: 'Automotive Supply Group',
    readyToPickup: false
  },
  '020-55667788': {
    awbNumber: '020-55667788',
    origin: 'ICN (Seoul, Korea)',
    destination: 'LAX (Los Angeles, USA)',
    flightDate: '2026-03-02',
    arrivalDate: '2026-03-03',
    arrivalTime: '13:15',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-03',
    freeTimeDays: 3,
    pieces: 25,
    weight: 650.0,
    description: 'Fashion Accessories',
    consignee: 'Fashion World Inc.',
    readyToPickup: true
  },
  '020-99887766': {
    awbNumber: '020-99887766',
    origin: 'SIN (Singapore)',
    destination: 'SEA (Seattle, USA)',
    flightDate: '2026-02-28',
    arrivalDate: '2026-03-01',
    arrivalTime: '10:30',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-01',
    freeTimeDays: 3,
    pieces: 18,
    weight: 420.0,
    description: 'Computer Hardware',
    consignee: 'Tech Distribution LLC',
    readyToPickup: true
  },
  '020-44556677': {
    awbNumber: '020-44556677',
    origin: 'BKK (Bangkok, Thailand)',
    destination: 'MIA (Miami, USA)',
    flightDate: '2026-03-01',
    arrivalDate: '2026-03-02',
    arrivalTime: '18:45',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-02',
    freeTimeDays: 3,
    pieces: 55,
    weight: 1380.0,
    description: 'Organic Food Products',
    consignee: 'Global Foods Inc.',
    readyToPickup: true
  },
  '020-22334455': {
    awbNumber: '020-22334455',
    origin: 'DEL (Delhi, India)',
    destination: 'DFW (Dallas, USA)',
    flightDate: '2026-02-27',
    arrivalDate: '2026-02-28',
    arrivalTime: '22:10',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-02-28',
    freeTimeDays: 3,
    pieces: 95,
    weight: 2450.0,
    description: 'Pharmaceutical Products',
    consignee: 'MedSupply Co.',
    readyToPickup: true
  },
  '020-88776655': {
    awbNumber: '020-88776655',
    origin: 'TPE (Taipei, Taiwan)',
    destination: 'ATL (Atlanta, USA)',
    flightDate: '2026-03-04',
    arrivalDate: '2026-03-05',
    arrivalTime: '15:20',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-05',
    freeTimeDays: 3,
    pieces: 40,
    weight: 980.0,
    description: 'Consumer Electronics',
    consignee: 'Electronics Hub LLC',
    readyToPickup: true
  },
  '020-33445566': {
    awbNumber: '020-33445566',
    origin: 'MNL (Manila, Philippines)',
    destination: 'LAX (Los Angeles, USA)',
    flightDate: '2026-02-28',
    arrivalDate: '2026-03-01',
    arrivalTime: '08:30',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-01',
    freeTimeDays: 3,
    pieces: 30,
    weight: 725.0,
    description: 'Handicrafts',
    consignee: 'Arts & Crafts Import',
    readyToPickup: true
  },
  '020-66778899': {
    awbNumber: '020-66778899',
    origin: 'KUL (Kuala Lumpur, Malaysia)',
    destination: 'SFO (San Francisco, USA)',
    flightDate: '2026-03-03',
    arrivalDate: '2026-03-04',
    arrivalTime: '12:40',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-04',
    freeTimeDays: 3,
    pieces: 22,
    weight: 550.0,
    description: 'Rubber Products',
    consignee: 'Industrial Supplies Inc.',
    readyToPickup: true
  },
  '020-55443322': {
    awbNumber: '020-55443322',
    origin: 'CGK (Jakarta, Indonesia)',
    destination: 'ORD (Chicago, USA)',
    flightDate: '2026-03-05',
    arrivalDate: '2026-03-06',
    arrivalTime: '20:15',
    breakdownStatus: 'In Progress',
    customsStatus: 'PNF',
    storageStartDate: '2026-03-06',
    freeTimeDays: 5,
    pieces: 68,
    weight: 1820.0,
    description: 'Furniture Parts',
    consignee: 'Home Furnishing Co.',
    readyToPickup: false
  },
  '020-77665544': {
    awbNumber: '020-77665544',
    origin: 'HAN (Hanoi, Vietnam)',
    destination: 'JFK (New York, USA)',
    flightDate: '2026-03-02',
    arrivalDate: '2026-03-03',
    arrivalTime: '17:50',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-03',
    freeTimeDays: 3,
    pieces: 50,
    weight: 1150.0,
    description: 'Textiles',
    consignee: 'Fashion Imports LLC',
    readyToPickup: true
  },
  '020-11009988': {
    awbNumber: '020-11009988',
    origin: 'BOM (Mumbai, India)',
    destination: 'IAH (Houston, USA)',
    flightDate: '2026-02-27',
    arrivalDate: '2026-02-28',
    arrivalTime: '19:30',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-02-28',
    freeTimeDays: 3,
    pieces: 75,
    weight: 1950.0,
    description: 'Leather Goods',
    consignee: 'Luxury Imports Inc.',
    readyToPickup: true
  },
  '020-22119977': {
    awbNumber: '020-22119977',
    origin: 'PEK (Beijing, China)',
    destination: 'LAX (Los Angeles, USA)',
    flightDate: '2026-03-06',
    arrivalDate: '2026-03-07',
    arrivalTime: '11:20',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-07',
    freeTimeDays: 3,
    pieces: 100,
    weight: 2800.0,
    description: 'Industrial Machinery',
    consignee: 'Heavy Equipment Co.',
    readyToPickup: true
  },
  '020-33221166': {
    awbNumber: '020-33221166',
    origin: 'SGN (Ho Chi Minh, Vietnam)',
    destination: 'SEA (Seattle, USA)',
    flightDate: '2026-03-01',
    arrivalDate: '2026-03-02',
    arrivalTime: '14:05',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-02',
    freeTimeDays: 3,
    pieces: 35,
    weight: 880.0,
    description: 'Coffee Beans',
    consignee: 'Coffee Traders LLC',
    readyToPickup: true
  },
  '020-44332255': {
    awbNumber: '020-44332255',
    origin: 'KIX (Osaka, Japan)',
    destination: 'SFO (San Francisco, USA)',
    flightDate: '2026-03-03',
    arrivalDate: '2026-03-04',
    arrivalTime: '10:45',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-04',
    freeTimeDays: 3,
    pieces: 28,
    weight: 630.0,
    description: 'Precision Instruments',
    consignee: 'Scientific Supply Inc.',
    readyToPickup: true
  },
  '020-55446633': {
    awbNumber: '020-55446633',
    origin: 'CAN (Guangzhou, China)',
    destination: 'MIA (Miami, USA)',
    flightDate: '2026-02-28',
    arrivalDate: '2026-03-01',
    arrivalTime: '21:30',
    breakdownStatus: 'Completed',
    customsStatus: 'Hold',
    storageStartDate: '2026-03-01',
    freeTimeDays: 3,
    pieces: 85,
    weight: 2250.0,
    description: 'Toys & Games',
    consignee: 'Kids Products Inc.',
    readyToPickup: false
  },
  '020-66557744': {
    awbNumber: '020-66557744',
    origin: 'BNE (Brisbane, Australia)',
    destination: 'LAX (Los Angeles, USA)',
    flightDate: '2026-03-04',
    arrivalDate: '2026-03-05',
    arrivalTime: '06:15',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-05',
    freeTimeDays: 3,
    pieces: 15,
    weight: 380.0,
    description: 'Wine & Spirits',
    consignee: 'Beverage Imports LLC',
    readyToPickup: true
  },
  '020-77668855': {
    awbNumber: '020-77668855',
    origin: 'AKL (Auckland, New Zealand)',
    destination: 'SFO (San Francisco, USA)',
    flightDate: '2026-03-02',
    arrivalDate: '2026-03-03',
    arrivalTime: '07:50',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-03',
    freeTimeDays: 3,
    pieces: 20,
    weight: 490.0,
    description: 'Dairy Products',
    consignee: 'Food Distributors Inc.',
    readyToPickup: true
  },
  '020-88779966': {
    awbNumber: '020-88779966',
    origin: 'SYD (Sydney, Australia)',
    destination: 'ORD (Chicago, USA)',
    flightDate: '2026-03-05',
    arrivalDate: '2026-03-06',
    arrivalTime: '16:40',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-06',
    freeTimeDays: 3,
    pieces: 42,
    weight: 1050.0,
    description: 'Sporting Goods',
    consignee: 'Sports Equipment Co.',
    readyToPickup: true
  },
  '020-99881122': {
    awbNumber: '020-99881122',
    origin: 'MEL (Melbourne, Australia)',
    destination: 'DFW (Dallas, USA)',
    flightDate: '2026-03-01',
    arrivalDate: '2026-03-02',
    arrivalTime: '19:10',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-02',
    freeTimeDays: 3,
    pieces: 38,
    weight: 920.0,
    description: 'Beauty Products',
    consignee: 'Cosmetics Wholesale LLC',
    readyToPickup: true
  },
  '020-10293847': {
    awbNumber: '020-10293847',
    origin: 'DXB (Dubai, UAE)',
    destination: 'JFK (New York, USA)',
    flightDate: '2026-02-27',
    arrivalDate: '2026-02-28',
    arrivalTime: '05:25',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-02-28',
    freeTimeDays: 3,
    pieces: 60,
    weight: 1600.0,
    description: 'Jewelry',
    consignee: 'Fine Jewelry Inc.',
    readyToPickup: true
  },
  '020-56473829': {
    awbNumber: '020-56473829',
    origin: 'DOH (Doha, Qatar)',
    destination: 'IAH (Houston, USA)',
    flightDate: '2026-03-03',
    arrivalDate: '2026-03-04',
    arrivalTime: '23:40',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-04',
    freeTimeDays: 3,
    pieces: 48,
    weight: 1180.0,
    description: 'Perfumes',
    consignee: 'Fragrance Imports Co.',
    readyToPickup: true
  },
  '020-91827364': {
    awbNumber: '020-91827364',
    origin: 'IST (Istanbul, Turkey)',
    destination: 'ATL (Atlanta, USA)',
    flightDate: '2026-03-06',
    arrivalDate: '2026-03-07',
    arrivalTime: '12:55',
    breakdownStatus: 'In Progress',
    customsStatus: 'PNF',
    storageStartDate: '2026-03-07',
    freeTimeDays: 5,
    pieces: 70,
    weight: 1890.0,
    description: 'Carpets & Rugs',
    consignee: 'Home Decor Imports',
    readyToPickup: false
  },
  '020-47382910': {
    awbNumber: '020-47382910',
    origin: 'LHR (London, UK)',
    destination: 'LAX (Los Angeles, USA)',
    flightDate: '2026-02-28',
    arrivalDate: '2026-03-01',
    arrivalTime: '15:30',
    breakdownStatus: 'Completed',
    customsStatus: 'Released',
    storageStartDate: '2026-03-01',
    freeTimeDays: 3,
    pieces: 52,
    weight: 1320.0,
    description: 'Books & Publications',
    consignee: 'Educational Materials Inc.',
    readyToPickup: true
  }
};

// Mock 결제 정보 생성 함수
export const generateBillingInfo = (awbNumber: string, pickupDate?: string): BillingInfo | null => {
  const cargo = mockCargoData[awbNumber];
  if (!cargo) return null;

  // 보관료 계산 - pickupDate가 제공되면 해당 날짜로 계산, 아니면 오늘 기준
  const arrivalDate = new Date(cargo.storageStartDate);
  const targetDate = pickupDate ? new Date(pickupDate) : new Date('2026-03-09'); // Mock current date
  const daysStored = Math.max(0, Math.floor((targetDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)) - cargo.freeTimeDays);
  const storageFee = daysStored > 0 ? daysStored * 50 * (cargo.weight / 1000) : 0;

  const serviceFee = 250.00;
  const otherCharge = cargo.customsStatus === 'Hold' ? 150.00 : 0;
  const subtotal = serviceFee + storageFee + otherCharge;
  const processingFee = subtotal * 0.025; // 2.5% processing fee

  return {
    awbNumber,
    serviceFee,
    storageFee,
    otherCharge,
    subtotal,
    processingFee,
    total: subtotal + processingFee
  };
};

// Mock 대기 중인 결제
export const mockPendingPayments: PendingPayment[] = [
  {
    awbNumber: '020-12345678',
    dueDate: '2026-03-12',
    amount: 512.50,
    status: 'pending'
  },
  {
    awbNumber: '020-87654321',
    dueDate: '2026-03-10',
    amount: 825.75,
    status: 'overdue'
  },
  {
    awbNumber: '020-55667788',
    dueDate: '2026-03-15',
    amount: 345.00,
    status: 'pending'
  }
];

// Mock 완료된 결제
export const mockCompletedPayments: CompletedPayment[] = [
  {
    id: 'PMT-2026030801',
    awbNumber: '020-99887766',
    paymentDate: '2026-03-08',
    amount: 456.25,
    processingFee: 11.41,
    receiptUrl: '#'
  },
  {
    id: 'PMT-2026030701',
    awbNumber: '020-44556677',
    paymentDate: '2026-03-07',
    amount: 678.90,
    processingFee: 16.97,
    receiptUrl: '#'
  },
  {
    id: 'PMT-2026030601',
    awbNumber: '020-33445566',
    paymentDate: '2026-03-06',
    amount: 321.50,
    processingFee: 8.04,
    receiptUrl: '#'
  },
  {
    id: 'PMT-2026030501',
    awbNumber: '020-22334455',
    paymentDate: '2026-03-05',
    amount: 892.00,
    processingFee: 22.30,
    receiptUrl: '#'
  }
];

// Mock GHA 매출 통계
export const mockRevenueStats: RevenueStats = {
  totalRevenue: 45678.50,
  processingFeeRevenue: 1141.96,
  storageFeeRevenue: 12500.00,
  transactionCount: 127,
  period: 'March 2026'
};

// Mock 고객 리스트
export const mockCustomers = [
  {
    id: '1',
    companyName: 'Global Freight Solutions',
    email: 'contact@globalfreight.com',
    totalTransactions: 45,
    lastPaymentDate: '2026-03-08',
    totalSpent: 12345.67
  },
  {
    id: '2',
    companyName: 'Pacific Logistics Inc.',
    email: 'info@pacificlog.com',
    totalTransactions: 32,
    lastPaymentDate: '2026-03-07',
    totalSpent: 8901.23
  },
  {
    id: '3',
    companyName: 'Express Air Cargo',
    email: 'support@expressair.com',
    totalTransactions: 28,
    lastPaymentDate: '2026-03-06',
    totalSpent: 7654.32
  }
];
