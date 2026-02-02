import apiClient from './client';
import { BranchInventory, InventoryMovement, PaginatedResponse } from '../types';

export type AdjustmentType = 'ADJUSTED_UP' | 'ADJUSTED_DOWN' | 'WASTED';

export interface CreateInventoryDto {
  storeId: string;
  itemId: string;
  branchId: string;
  initialQuantity?: number;
  lowStockThreshold?: number;
  isTracked?: boolean;
}

export interface ReceiveStockDto {
  storeId: string;
  inventoryId: string;
  quantity: number;
  referenceNumber?: string;
  notes?: string;
}

export interface AdjustInventoryDto {
  storeId: string;
  inventoryId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason?: string;
}

export interface UpdateInventoryDto {
  lowStockThreshold?: number;
  isTracked?: boolean;
}

export interface InventoryQueryParams {
  storeId: string;
  branchId?: string;
  page?: number;
  limit?: number;
  lowStockOnly?: boolean;
  search?: string;
}

export const inventoryApi = {
  getAll: async (params: InventoryQueryParams): Promise<PaginatedResponse<BranchInventory>> => {
    const response = await apiClient.get<PaginatedResponse<BranchInventory>>('/inventory', { params });
    return response.data;
  },

  create: async (data: CreateInventoryDto): Promise<BranchInventory> => {
    const { storeId, ...body } = data;
    const response = await apiClient.post<BranchInventory>('/inventory', body, {
      params: { storeId },
    });
    return response.data;
  },

  getById: async (id: string): Promise<BranchInventory> => {
    const response = await apiClient.get<BranchInventory>(`/inventory/${id}`);
    return response.data;
  },

  getLowStock: async (branchId?: string): Promise<BranchInventory[]> => {
    const response = await apiClient.get<BranchInventory[]>('/inventory/low-stock', {
      params: { branchId },
    });
    return response.data;
  },

  getMovements: async (
    inventoryId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<InventoryMovement>> => {
    const response = await apiClient.get<PaginatedResponse<InventoryMovement>>(
      `/inventory/${inventoryId}/movements`,
      { params }
    );
    return response.data;
  },

  update: async (id: string, data: UpdateInventoryDto): Promise<BranchInventory> => {
    const response = await apiClient.patch<BranchInventory>(`/inventory/${id}`, data);
    return response.data;
  },

  receiveStock: async (data: ReceiveStockDto): Promise<BranchInventory> => {
    const { storeId, ...body } = data;
    const response = await apiClient.post<BranchInventory>('/inventory/receive', body, {
      params: { storeId },
    });
    return response.data;
  },

  adjust: async (data: AdjustInventoryDto): Promise<BranchInventory> => {
    const { storeId, ...body } = data;
    const response = await apiClient.post<BranchInventory>('/inventory/adjust', body, {
      params: { storeId },
    });
    return response.data;
  },
};
