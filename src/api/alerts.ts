import apiClient from './client';
import {
  Alert,
  AlertConfig,
  AlertCountResponse,
  AlertType,
  AlertSeverity,
  PaginatedResponse,
} from '../types';

export interface AlertQueryParams {
  storeId?: string;
  type?: AlertType;
  severity?: AlertSeverity;
  status?: 'active' | 'acknowledged' | 'dismissed' | 'all';
  page?: number;
  limit?: number;
}

export interface UpdateAlertConfigDto {
  enabled?: boolean;
  thresholds?: Record<string, unknown>;
  cooldownMinutes?: number;
}

export const alertsApi = {
  getAll: async (params: AlertQueryParams): Promise<PaginatedResponse<Alert>> => {
    const response = await apiClient.get<PaginatedResponse<Alert>>('/alerts', { params });
    return response.data;
  },

  getCount: async (storeId: string): Promise<AlertCountResponse> => {
    const response = await apiClient.get<AlertCountResponse>('/alerts/count', {
      params: { storeId },
    });
    return response.data;
  },

  acknowledge: async (id: string): Promise<Alert> => {
    const response = await apiClient.patch<Alert>(`/alerts/${id}/acknowledge`);
    return response.data;
  },

  dismiss: async (id: string): Promise<Alert> => {
    const response = await apiClient.patch<Alert>(`/alerts/${id}/dismiss`);
    return response.data;
  },

  bulkDismiss: async (alertIds: string[]): Promise<{ dismissed: number }> => {
    const response = await apiClient.post<{ dismissed: number }>('/alerts/bulk-dismiss', {
      alertIds,
    });
    return response.data;
  },

  getConfigs: async (storeId: string): Promise<AlertConfig[]> => {
    const response = await apiClient.get<AlertConfig[]>('/alerts/config', {
      params: { storeId },
    });
    return response.data;
  },

  updateConfig: async (
    alertType: AlertType,
    data: UpdateAlertConfigDto,
    storeId: string,
  ): Promise<AlertConfig> => {
    const response = await apiClient.put<AlertConfig>(
      `/alerts/config/${alertType}`,
      data,
      { params: { storeId } },
    );
    return response.data;
  },
};
