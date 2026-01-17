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
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'VOIDED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type OrderType = 'DINE_IN' | 'TAKEOUT' | 'DELIVERY' | 'DRIVE_THRU';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOBILE_PAYMENT' | 'GIFT_CARD' | 'STORE_CREDIT' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
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
