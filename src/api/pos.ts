import apiClient from './client';
import { PosDevice, PaginatedResponse, PosStatus, SyncLog } from '../types';

export interface CreatePosDeviceDto {
  branchId: string;
  name?: string;
  // BIR Compliance Fields
  min?: string;
  serialNumber?: string;
  permitNumber?: string;
}

export interface RegisterPosDto {
  branchId: string;
  deviceIdentifier: string;
  name?: string;
  appVersion?: string;
}

export interface UpdatePosDto {
  name?: string;
  status?: PosStatus;
  // BIR Compliance Fields
  min?: string;
  serialNumber?: string;
  permitNumber?: string;
}

export interface PosDeviceWithCode extends PosDevice {
  registrationCode?: string;
  registrationCodeExpiresAt?: string;
  isRegistered?: boolean;
}

export const posApi = {
  getAll: async (params: {
    storeId: string;
    page?: number;
    limit?: number;
    branchId?: string;
    status?: PosStatus;
  }): Promise<PaginatedResponse<PosDevice>> => {
    const response = await apiClient.get<PaginatedResponse<PosDevice>>('/pos/devices', { params });
    return response.data;
  },

  getById: async (id: string): Promise<PosDevice> => {
    const response = await apiClient.get<PosDevice>(`/pos/devices/${id}`);
    return response.data;
  },

  createDevice: async (data: CreatePosDeviceDto): Promise<PosDeviceWithCode> => {
    const response = await apiClient.post<PosDeviceWithCode>('/pos/devices', data);
    return response.data;
  },

  regenerateCode: async (id: string): Promise<PosDeviceWithCode> => {
    const response = await apiClient.post<PosDeviceWithCode>(`/pos/devices/${id}/regenerate-code`);
    return response.data;
  },

  register: async (data: RegisterPosDto): Promise<PosDevice> => {
    const response = await apiClient.post<PosDevice>('/pos/register', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePosDto): Promise<PosDevice> => {
    const response = await apiClient.patch<PosDevice>(`/pos/devices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/pos/devices/${id}`);
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.post(`/pos/devices/${id}/deactivate`);
  },

  getStats: async (storeId: string): Promise<{
    total: number;
    online: number;
    offline: number;
    inactive: number;
  }> => {
    const response = await apiClient.get('/pos/devices/stats', { params: { storeId } });
    return response.data;
  },

  // Sync
  getSyncLogs: async (params: {
    storeId: string;
    page?: number;
    limit?: number;
    posDeviceId?: string;
  }): Promise<PaginatedResponse<SyncLog>> => {
    const response = await apiClient.get<PaginatedResponse<SyncLog>>('/sync/logs', { params });
    return response.data;
  },

  getSyncStats: async (storeId: string): Promise<{
    last24Hours: {
      total: number;
      successful: number;
      failed: number;
      successRate: string;
    };
    lastHour: number;
  }> => {
    const response = await apiClient.get('/sync/stats', { params: { storeId } });
    return response.data;
  },
};
