import apiClient from './client';
import { AuditLog, AuditAction, PaginatedResponse } from '../types';

export interface AuditLogFilters {
  storeId?: string;
  entityType?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  getLogs: async (filters?: AuditLogFilters): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiClient.get<PaginatedResponse<AuditLog>>('/audit/logs', {
      params: filters,
    });
    return response.data;
  },
};
