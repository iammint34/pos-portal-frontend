import apiClient from './client';
import { Branch, PaginatedResponse, BranchStatus } from '../types';

export interface CreateBranchDto {
  storeId: string;
  name: string;
  address?: string;
  phone?: string;
  // BIR Compliance Fields (PTU)
  ptuNo?: string;
  ptuDateIssued?: string;
  ptuValidUntil?: string;
  accreditationNo?: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  status?: BranchStatus;
  // BIR Compliance Fields (PTU)
  ptuNo?: string;
  ptuDateIssued?: string;
  ptuValidUntil?: string;
  accreditationNo?: string;
}

export const branchesApi = {
  getAll: async (params: { storeId: string; page?: number; limit?: number }): Promise<PaginatedResponse<Branch>> => {
    const response = await apiClient.get<PaginatedResponse<Branch>>('/branches', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Branch> => {
    const response = await apiClient.get<Branch>(`/branches/${id}`);
    return response.data;
  },

  create: async (data: CreateBranchDto): Promise<Branch> => {
    const response = await apiClient.post<Branch>('/branches', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBranchDto): Promise<Branch> => {
    const response = await apiClient.patch<Branch>(`/branches/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/branches/${id}`);
  },

  getStats: async (id: string): Promise<{ posDevices: number; onlineDevices: number; itemsAvailable: number }> => {
    const response = await apiClient.get(`/branches/${id}/stats`);
    return response.data;
  },
};
