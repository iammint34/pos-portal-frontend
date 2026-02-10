// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Store types
export type StoreType = 'RESTAURANT' | 'RETAIL' | 'CAFE' | 'OTHER';
export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Store {
  id: string;
  name: string;
  type: StoreType;
  status: StoreStatus;
  address?: string;
  phone?: string;
  email?: string;
  // BIR Compliance Fields
  registeredName?: string;
  registeredAddress?: string;
  vatTin?: string;
  isVatRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    branches: number;
    storeUsers: number;
  };
}

// Branch types
export type BranchStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';

export interface Branch {
  id: string;
  storeId: string;
  name: string;
  address?: string;
  phone?: string;
  status: BranchStatus;
  lastSyncAt?: string;
  // BIR Compliance Fields (PTU - Permit To Use)
  ptuNo?: string;
  ptuDateIssued?: string;
  ptuValidUntil?: string;
  accreditationNo?: string;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    name: string;
  };
  _count?: {
    posDevices: number;
    itemBranches?: number;
  };
}

// Category types
export interface Category {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
}

// Item types
export interface Item {
  id: string;
  storeId: string;
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
  };
}

// POS Device types
export type PosStatus = 'ONLINE' | 'OFFLINE' | 'INACTIVE';

export interface PosDevice {
  id: string;
  branchId: string;
  deviceIdentifier?: string;
  name?: string;
  appVersion?: string;
  status: PosStatus;
  lastHeartbeatAt?: string;
  lastSyncAt?: string;
  registrationCode?: string;
  registrationCodeExpiresAt?: string;
  isRegistered?: boolean;
  registeredAt?: string;
  // BIR Compliance Fields
  min?: string;
  serialNumber?: string;
  permitNumber?: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
}

// Role & Permission types
export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  storeId: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    storeUsers: number;
  };
}

// Audit Log types
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'SYNC';

export interface AuditLog {
  id: string;
  userId?: string;
  storeId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Sync types
export type SyncType = 'CONFIG' | 'ITEMS' | 'CATEGORIES' | 'FULL' | 'HEARTBEAT';
export type SyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';

export interface SyncLog {
  id: string;
  posDeviceId: string;
  syncType: SyncType;
  status: SyncStatus;
  version?: number;
  itemCount?: number;
  errorMsg?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  posDevice?: {
    id: string;
    name: string;
    deviceIdentifier: string;
    branch: {
      id: string;
      name: string;
    };
  };
}

// Pagination types
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Sales/Order types
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'VOIDED' | 'REFUNDED';
export type OrderType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY' | 'DRIVE_THRU';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOBILE_PAYMENT' | 'GIFT_CARD' | 'STORE_CREDIT' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountScope = 'ORDER' | 'ITEM';

export interface OrderItem {
  id: string;
  orderId: string;
  posItemId?: string;
  itemId?: string;
  itemName: string;
  itemSku?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
  notes?: string;
  isVoided: boolean;
  voidReason?: string;
  createdAt: string;
  item?: {
    id: string;
    name: string;
    sku?: string;
  };
  discounts?: OrderDiscount[];
}

export interface OrderDiscount {
  id: string;
  orderId: string;
  orderItemId?: string;
  discountName: string;
  discountType: DiscountType;
  discountScope: DiscountScope;
  discountValue: number;
  discountAmount: number;
  reason?: string;
  appliedBy?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  posPaymentId: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  tipAmount: number;
  changeAmount: number;
  referenceNumber?: string;
  processedAt: string;
  createdAt: string;
  refunds?: Refund[];
}

export interface Refund {
  id: string;
  posRefundId: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  reason?: string;
  refundMethod: PaymentMethod;
  processedBy?: string;
  processedAt: string;
  createdAt: string;
}

export interface Order {
  id: string;
  posOrderId: string;
  posDeviceId: string;
  branchId: string;
  storeId: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  posCreatedAt: string;
  posClosedAt?: string;
  syncedAt: string;
  syncBatchId?: string;
  createdAt: string;
  updatedAt: string;
  posDevice?: {
    id: string;
    name?: string;
    deviceIdentifier: string;
    branch?: {
      id: string;
      name: string;
    };
  };
  orderItems?: OrderItem[];
  discounts?: OrderDiscount[];
  payments?: Payment[];
  refunds?: Refund[];
}

export interface SalesSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  orders: {
    count: number;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
  };
  refunds: {
    total: number;
  };
  netSales: number;
  paymentsByMethod: {
    method: string;
    count: number;
    amount: number;
    tips: number;
  }[];
}

// Shift types
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type CashMovementType =
  | 'OPENING_FLOAT'
  | 'CASH_SALE'
  | 'CHANGE_GIVEN'
  | 'TIP_CASH'
  | 'PAID_OUT'
  | 'DROP'
  | 'CASH_IN'
  | 'REFUND'
  | 'CLOSING_COUNT';

export interface CashMovement {
  id: string;
  shiftId: string;
  movementType: CashMovementType;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy: string;
  performedAt: string;
  createdAt: string;
}

export interface ShiftSummary {
  openingCash: number;
  totalCashSales: number;
  totalChangeGiven: number;
  totalCashRefunds: number;
  totalPaidOuts: number;
  totalDrops: number;
  totalCashIn: number;
  expectedCash: number;
  orderCount: number;
}

export interface Shift {
  id: string;
  posShiftId?: string;
  posDeviceId: string;
  branchId: string;
  storeId: string;
  operatorId?: string;
  posOperatorId?: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  variance?: number;
  notes?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
  posDevice?: {
    id: string;
    name?: string;
    deviceIdentifier: string;
    branch?: {
      id: string;
      name: string;
    };
  };
  operator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  cashMovements?: CashMovement[];
  summary?: ShiftSummary;
  _count?: {
    orders: number;
    cashMovements: number;
  };
}

// Report types
export interface ReportQueryParams {
  storeId?: string;
  branchId?: string;
  posDeviceId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  todayAvgOrder: number;
  yesterdaySales: number;
  yesterdayOrders: number;
  weekSales: number;
  weekOrders: number;
  monthSales: number;
  monthOrders: number;
  salesGrowth: number;
  ordersGrowth: number;
}

export interface ReportSalesSummary {
  totalOrders: number;
  completedOrders: number;
  voidedOrders: number;
  grossSales: number;
  totalDiscounts: number;
  totalRefunds: number;
  netSales: number;
  totalTax: number;
  vatableSales: number;
  vatAmount: number;
  vatExemptSales: number;
  zeroRatedSales: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  averageOrderValue: number;
  periodStart: string;
  periodEnd: string;
}

export interface SalesByBranch {
  branchId: string;
  branchName: string;
  orderCount: number;
  grossSales: number;
  discounts: number;
  refunds: number;
  netSales: number;
  percentage: number;
}

export interface SalesByDevice {
  posDeviceId: string;
  deviceName: string;
  branchName: string;
  orderCount: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  percentage: number;
}

export interface SalesByCategory {
  categoryId: string;
  categoryName: string;
  itemCount: number;
  quantitySold: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  percentage: number;
}

export interface SalesByItem {
  itemId: string;
  itemName: string;
  itemSku?: string;
  categoryName?: string;
  quantitySold: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  averagePrice: number;
}

export interface TopSellingItem extends SalesByItem {
  revenue: number;
  rank: number;
}

export interface SalesByPaymentMethod {
  paymentMethod: string;
  transactionCount: number;
  totalAmount: number;
  tipAmount: number;
  percentage: number;
}

export interface SalesByHour {
  hour: number;
  hourLabel: string;
  orderCount: number;
  totalSales: number;
  itemsSold: number;
}

export interface SalesTrend {
  date: string;
  orderCount: number;
  grossSales: number;
  netSales: number;
}

export interface TransactionReport {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  orderType: string;
  status: string;
  customerName?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  itemCount: number;
  paymentMethod?: string;
  branchName: string;
  deviceName: string;
  createdAt: string;
  closedAt?: string;
}

export interface VoidedTransaction {
  id: string;
  orderNumber: string;
  invoiceNumber?: string;
  originalTotal: number;
  voidReason?: string;
  branchName: string;
  deviceName: string;
  voidedAt: string;
}

export interface DiscountReport {
  discountName: string;
  discountType: string;
  discountScope: string;
  timesApplied: number;
  totalDiscountAmount: number;
  ordersAffected: number;
}

export interface RefundReport {
  id: string;
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  refundMethod: string;
  amount: number;
  reason?: string;
  processedBy?: string;
  branchName: string;
  processedAt: string;
}

export interface ShiftReport {
  id: string;
  operatorName: string;
  branchName: string;
  deviceName: string;
  status: string;
  openedAt: string;
  closedAt?: string;
  duration?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash: number;
  variance?: number;
  orderCount: number;
  totalSales: number;
}

export interface ZReadingReport {
  id: string;
  zCounterNo: number;
  branchName: string;
  deviceName: string;
  readingDate: string;
  beginningInvoice: string;
  endingInvoice: string;
  openingGrandTotal: number;
  closingGrandTotal: number;
  grossSales: number;
  netSales: number;
  vatableSales: number;
  vatAmount: number;
  vatExemptSales: number;
  zeroRatedSales: number;
  totalDiscounts: number;
  totalRefunds: number;
  totalVoids: number;
  transactionCount: number;
}

// Staff report types
export interface StaffSales {
  operatorId: string;
  operatorName: string;
  orderCount: number;
  grossSales: number;
  discounts: number;
  netSales: number;
  averageOrderValue: number;
  percentage: number;
}

export interface StaffPerformance {
  operatorId: string;
  operatorName: string;
  orderCount: number;
  totalSales: number;
  averageOrderValue: number;
  voidCount: number;
  voidAmount: number;
  refundCount: number;
  refundAmount: number;
  discountCount: number;
  discountAmount: number;
  shiftCount: number;
  totalShiftHours: number;
  cashVariance: number;
}

// Alert types
export type AlertType =
  | 'ZERO_SALES_BRANCH'
  | 'EXCESSIVE_VOID_REFUND'
  | 'INVENTORY_ANOMALY'
  | 'POS_SYNC_FAILURE';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  storeId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertConfig {
  alertType: AlertType;
  enabled: boolean;
  thresholds: Record<string, unknown>;
  cooldownMinutes: number;
}

export interface AlertCountResponse {
  count: number;
  bySeverity: {
    INFO: number;
    WARNING: number;
    CRITICAL: number;
  };
}

// Clone types
export type CloneType = 'BRANCH' | 'STORE';
export type CloneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';

export interface CloneStoreConfig {
  items?: boolean;
  categories?: boolean;
  roles?: boolean;
  lossPreventionThresholds?: boolean;
}

export interface CloneBranchConfig {
  itemBranches?: boolean;
}

export interface CloneStoreRequest {
  sourceStoreId: string;
  name: string;
  type?: StoreType;
  address?: string;
  phone?: string;
  email?: string;
  config?: CloneStoreConfig;
  registeredName?: string;
  registeredAddress?: string;
  vatTin?: string;
  isVatRegistered?: boolean;
}

export interface CloneBranchRequest {
  sourceBranchId: string;
  name: string;
  address?: string;
  phone?: string;
  config?: CloneBranchConfig;
  ptuNo?: string;
  accreditationNo?: string;
}

export interface CloneJob {
  id: string;
  storeId: string;
  type: CloneType;
  sourceId: string;
  targetId: string | null;
  targetName: string;
  config: CloneStoreConfig | CloneBranchConfig;
  status: CloneStatus;
  errorMessage: string | null;
  createdBy: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CloneStoreResult {
  job: CloneJob;
  store: Store;
}

export interface CloneBranchResult {
  job: CloneJob;
  branch: Branch;
}

export interface ClonePreviewItem {
  type: string;
  count: number;
  label: string;
}

export interface ClonePreviewResponse {
  type: CloneType;
  sourceId: string;
  sourceName: string;
  items: ClonePreviewItem[];
  totalItems: number;
}

// Loss Prevention types
export type LossPreventionMetricType =
  | 'VOID_COUNT'
  | 'VOID_AMOUNT'
  | 'REFUND_COUNT'
  | 'REFUND_AMOUNT'
  | 'DISCOUNT_PERCENTAGE'
  | 'CONSECUTIVE_VOIDS';

export type LossPreventionTimeWindow = 'SHIFT' | 'DAY' | 'WEEK';
export type LossPreventionScope = 'BRANCH' | 'STAFF' | 'POS_DEVICE';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
export type LPAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface LossPreventionThreshold {
  id: string;
  storeId: string;
  metricType: LossPreventionMetricType;
  threshold: number;
  timeWindow: LossPreventionTimeWindow;
  scope: LossPreventionScope;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface LossPreventionIncident {
  id: string;
  storeId: string;
  branchId: string;
  staffId?: string;
  posDeviceId?: string;
  metricType: LossPreventionMetricType;
  actualValue: number;
  thresholdValue: number;
  timeWindow: LossPreventionTimeWindow;
  severity: LPAlertSeverity;
  status: IncidentStatus;
  transactions: string[];
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  escalatedBy?: string;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
  staff?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ThresholdWithStats extends LossPreventionThreshold {
  incidentCount: number;
  lastTriggeredAt?: string;
}

export interface LPDashboardSummary {
  totalThresholds: number;
  enabledThresholds: number;
  totalIncidents: number;
  openIncidents: number;
  acknowledgedIncidents: number;
  resolvedIncidents: number;
  escalatedIncidents: number;
  incidentsBySeverity: {
    INFO: number;
    WARNING: number;
    CRITICAL: number;
  };
  recentIncidents: LossPreventionIncident[];
}

export interface LPIncidentStats {
  total: number;
  byStatus: {
    OPEN: number;
    ACKNOWLEDGED: number;
    RESOLVED: number;
    ESCALATED: number;
  };
  bySeverity: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  byMetricType: Record<string, number>;
}

// Notification types
export type NotificationType =
  | 'DAILY_DIGEST'
  | 'WEEKLY_SUMMARY'
  | 'LOSS_PREVENTION_ALERT'
  | 'DEVICE_OFFLINE'
  | 'SYNC_FAILURE'
  | 'SYSTEM_ALERT';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NotificationPreference {
  id: string;
  storeId: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  dailyDigest: boolean;
  weeklySummary: boolean;
  alertsEnabled: boolean;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface NotificationLog {
  id: string;
  storeId: string;
  userId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  content: string;
  status: NotificationStatus;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface NotificationSchedule {
  id: string;
  storeId: string;
  type: NotificationType;
  schedule: string;
  timezone: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory types
export type MovementType =
  | 'RECEIVED'
  | 'SOLD'
  | 'ADJUSTED_UP'
  | 'ADJUSTED_DOWN'
  | 'WASTED'
  | 'VOIDED_SALE'
  | 'REFUNDED'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export interface BranchInventory {
  id: string;
  itemId: string;
  branchId: string;
  storeId: string;
  currentQuantity: number;
  lowStockThreshold?: number;
  isTracked: boolean;
  createdAt: string;
  updatedAt: string;
  item?: {
    id: string;
    name: string;
    sku?: string;
    price: number;
    category?: {
      id: string;
      name: string;
    };
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface InventoryMovement {
  id: string;
  movementId: string;
  branchInventoryId: string;
  itemId: string;
  branchId: string;
  storeId: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType?: string;
  referenceId?: string;
  posDeviceId?: string;
  reason?: string;
  performedBy?: string;
  performedAt: string;
  syncedAt?: string;
  createdAt: string;
}
