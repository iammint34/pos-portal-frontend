import apiClient from './client';
import { Store, PaginatedResponse, StoreType, StoreStatus } from '../types';

export interface CreateStoreDto {
  name: string;
  type?: StoreType;
  address?: string;
  phone?: string;
  email?: string;
  // BIR Compliance Fields
  registeredName?: string;
  registeredAddress?: string;
  vatTin?: string;
  isVatRegistered?: boolean;
}

export interface UpdateStoreDto {
  name?: string;
  type?: StoreType;
  status?: StoreStatus;
  address?: string;
  phone?: string;
  email?: string;
  // BIR Compliance Fields
  registeredName?: string;
  registeredAddress?: string;
  vatTin?: string;
  isVatRegistered?: boolean;
}

export const storesApi = {
  getAll: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Store>> => {
    const response = await apiClient.get<PaginatedResponse<Store>>('/stores', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Store> => {
    const response = await apiClient.get<Store>(`/stores/${id}`);
    return response.data;
  },

  create: async (data: CreateStoreDto): Promise<Store> => {
    const response = await apiClient.post<Store>('/stores', data);
    return response.data;
  },

  update: async (id: string, data: UpdateStoreDto): Promise<Store> => {
    const response = await apiClient.patch<Store>(`/stores/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/stores/${id}`);
  },
};
