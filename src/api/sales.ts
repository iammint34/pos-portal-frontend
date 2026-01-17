import apiClient from './client';
import { Order, OrderStatus, PaginatedResponse, SalesSummary } from '../types';

export interface GetOrdersParams {
  storeId?: string;
  branchId?: string;
  posDeviceId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetSalesSummaryParams {
  storeId?: string;
  branchId?: string;
  startDate: string;
  endDate: string;
}

export const salesApi = {
  getOrders: async (params: GetOrdersParams): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>('/sales/orders', { params });
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/sales/orders/${id}`);
    return response.data;
  },

  getSalesSummary: async (params: GetSalesSummaryParams): Promise<SalesSummary> => {
    const response = await apiClient.get<SalesSummary>('/sales/summary', { params });
    return response.data;
  },
};
