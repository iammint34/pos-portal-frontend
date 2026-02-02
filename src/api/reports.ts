import apiClient from './client';
import {
  ReportQueryParams,
  DashboardStats,
  ReportSalesSummary,
  SalesByBranch,
  SalesByDevice,
  SalesByCategory,
  SalesByItem,
  TopSellingItem,
  SalesByPaymentMethod,
  SalesByHour,
  SalesTrend,
  TransactionReport,
  VoidedTransaction,
  DiscountReport,
  RefundReport,
  ShiftReport,
  ZReadingReport,
  StaffSales,
  StaffPerformance,
  PaginatedResponse,
} from '../types';

export const reportsApi = {
  // Dashboard
  getDashboardStats: async (storeId?: string): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/reports/dashboard', {
      params: { storeId },
    });
    return response.data;
  },

  // Sales Summary
  getSalesSummary: async (params: ReportQueryParams): Promise<ReportSalesSummary> => {
    const response = await apiClient.get<ReportSalesSummary>('/reports/sales/summary', { params });
    return response.data;
  },

  exportSalesSummary: async (params: ReportQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/sales/summary/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  // Sales by Branch
  getSalesByBranch: async (params: ReportQueryParams): Promise<SalesByBranch[]> => {
    const response = await apiClient.get<SalesByBranch[]>('/reports/sales/by-branch', { params });
    return response.data;
  },

  exportSalesByBranch: async (params: ReportQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/sales/by-branch/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  // Sales by Device
  getSalesByDevice: async (params: ReportQueryParams): Promise<SalesByDevice[]> => {
    const response = await apiClient.get<SalesByDevice[]>('/reports/sales/by-device', { params });
    return response.data;
  },

  // Sales by Category
  getSalesByCategory: async (params: ReportQueryParams): Promise<SalesByCategory[]> => {
    const response = await apiClient.get<SalesByCategory[]>('/reports/sales/by-category', { params });
    return response.data;
  },

  exportSalesByCategory: async (params: ReportQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/sales/by-category/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  // Sales by Item
  getSalesByItem: async (params: ReportQueryParams): Promise<PaginatedResponse<SalesByItem>> => {
    const response = await apiClient.get<PaginatedResponse<SalesByItem>>('/reports/sales/by-item', { params });
    return response.data;
  },

  exportSalesByItem: async (params: ReportQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/sales/by-item/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  // Top Selling Items
  getTopSellingItems: async (params: ReportQueryParams, top?: number): Promise<TopSellingItem[]> => {
    const response = await apiClient.get<TopSellingItem[]>('/reports/sales/top-items', {
      params: { ...params, top },
    });
    return response.data;
  },

  // Sales by Payment Method
  getSalesByPaymentMethod: async (params: ReportQueryParams): Promise<SalesByPaymentMethod[]> => {
    const response = await apiClient.get<SalesByPaymentMethod[]>('/reports/sales/by-payment-method', { params });
    return response.data;
  },

  // Sales by Hour
  getSalesByHour: async (params: ReportQueryParams): Promise<SalesByHour[]> => {
    const response = await apiClient.get<SalesByHour[]>('/reports/sales/by-hour', { params });
    return response.data;
  },

  // Sales Trend
  getSalesTrend: async (params: ReportQueryParams): Promise<SalesTrend[]> => {
    const response = await apiClient.get<SalesTrend[]>('/reports/sales/trend', { params });
    return response.data;
  },

  // Transactions
  getTransactions: async (params: ReportQueryParams): Promise<PaginatedResponse<TransactionReport>> => {
    const response = await apiClient.get<PaginatedResponse<TransactionReport>>('/reports/transactions', { params });
    return response.data;
  },

  exportTransactions: async (params: ReportQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/transactions/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  // Voids
  getVoidedTransactions: async (params: ReportQueryParams): Promise<PaginatedResponse<VoidedTransaction>> => {
    const response = await apiClient.get<PaginatedResponse<VoidedTransaction>>('/reports/voids', { params });
    return response.data;
  },

  // Discounts
  getDiscountReport: async (params: ReportQueryParams): Promise<DiscountReport[]> => {
    const response = await apiClient.get<DiscountReport[]>('/reports/discounts', { params });
    return response.data;
  },

  // Refunds
  getRefundReport: async (params: ReportQueryParams): Promise<PaginatedResponse<RefundReport>> => {
    const response = await apiClient.get<PaginatedResponse<RefundReport>>('/reports/refunds', { params });
    return response.data;
  },

  // Shifts
  getShiftHistory: async (params: ReportQueryParams): Promise<PaginatedResponse<ShiftReport>> => {
    const response = await apiClient.get<PaginatedResponse<ShiftReport>>('/reports/shifts', { params });
    return response.data;
  },

  // Z-Readings
  getZReadingHistory: async (params: ReportQueryParams): Promise<PaginatedResponse<ZReadingReport>> => {
    const response = await apiClient.get<PaginatedResponse<ZReadingReport>>('/reports/z-readings', { params });
    return response.data;
  },

  exportZReadings: async (params: ReportQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/z-readings/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  // Staff Reports
  getSalesByStaff: async (params: ReportQueryParams): Promise<StaffSales[]> => {
    const response = await apiClient.get<StaffSales[]>('/reports/sales/by-staff', { params });
    return response.data;
  },

  exportSalesByStaff: async (params: ReportQueryParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/sales/by-staff/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },

  getStaffPerformance: async (params: ReportQueryParams): Promise<StaffPerformance[]> => {
    const response = await apiClient.get<StaffPerformance[]>('/reports/staff/performance', { params });
    return response.data;
  },
};
