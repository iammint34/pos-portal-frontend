import apiClient from './client';
import {
  Store,
  PaginatedResponse,
  StoreType,
  StoreStatus,
  CloneStoreRequest,
  CloneStoreResult,
  CloneJob,
  ClonePreviewResponse,
} from '../types';

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

  // Clone operations
  clone: async (data: CloneStoreRequest): Promise<CloneStoreResult> => {
    const response = await apiClient.post<CloneStoreResult>('/clone/store', data);
    return response.data;
  },

  previewClone: async (
    storeId: string,
    data: { type: 'STORE'; sourceId: string; config?: CloneStoreRequest['config'] }
  ): Promise<ClonePreviewResponse> => {
    const response = await apiClient.post<ClonePreviewResponse>(
      `/stores/${storeId}/clone/preview`,
      data
    );
    return response.data;
  },

  getCloneJobs: async (storeId: string, limit = 20): Promise<CloneJob[]> => {
    const response = await apiClient.get<CloneJob[]>(
      `/stores/${storeId}/clone/jobs`,
      { params: { limit } }
    );
    return response.data;
  },

  getCloneJob: async (jobId: string): Promise<CloneJob> => {
    const response = await apiClient.get<CloneJob>(`/clone/jobs/${jobId}`);
    return response.data;
  },

  rollbackCloneJob: async (jobId: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/clone/jobs/${jobId}/rollback`
    );
    return response.data;
  },
};
