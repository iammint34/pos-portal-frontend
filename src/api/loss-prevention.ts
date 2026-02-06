import apiClient from './client';
import {
  LossPreventionThreshold,
  LossPreventionIncident,
  ThresholdWithStats,
  LPDashboardSummary,
  LPIncidentStats,
  LossPreventionMetricType,
  LossPreventionTimeWindow,
  LossPreventionScope,
  IncidentStatus,
  LPAlertSeverity,
  PaginatedResponse,
} from '../types';

export interface CreateThresholdDto {
  metricType: LossPreventionMetricType;
  threshold: number;
  timeWindow: LossPreventionTimeWindow;
  scope: LossPreventionScope;
  enabled?: boolean;
}

export interface UpdateThresholdDto {
  threshold?: number;
  timeWindow?: LossPreventionTimeWindow;
  enabled?: boolean;
}

export interface IncidentQueryParams {
  storeId: string;
  branchId?: string;
  staffId?: string;
  status?: IncidentStatus;
  metricType?: LossPreventionMetricType;
  severity?: LPAlertSeverity;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ResolveIncidentDto {
  resolution: string;
}

export const lossPreventionApi = {
  // Dashboard
  getDashboard: async (storeId: string): Promise<LPDashboardSummary> => {
    const response = await apiClient.get<LPDashboardSummary>(
      `/stores/${storeId}/loss-prevention/dashboard`
    );
    return response.data;
  },

  // Thresholds
  getThresholds: async (storeId: string): Promise<ThresholdWithStats[]> => {
    const response = await apiClient.get<ThresholdWithStats[]>(
      `/stores/${storeId}/loss-prevention/thresholds`
    );
    return response.data;
  },

  createThreshold: async (
    storeId: string,
    data: CreateThresholdDto
  ): Promise<LossPreventionThreshold> => {
    const response = await apiClient.post<LossPreventionThreshold>(
      `/stores/${storeId}/loss-prevention/thresholds`,
      data
    );
    return response.data;
  },

  initializeThresholds: async (
    storeId: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/stores/${storeId}/loss-prevention/thresholds/initialize`
    );
    return response.data;
  },

  updateThreshold: async (
    storeId: string,
    thresholdId: string,
    data: UpdateThresholdDto
  ): Promise<LossPreventionThreshold> => {
    const response = await apiClient.patch<LossPreventionThreshold>(
      `/stores/${storeId}/loss-prevention/thresholds/${thresholdId}`,
      data
    );
    return response.data;
  },

  deleteThreshold: async (storeId: string, thresholdId: string): Promise<void> => {
    await apiClient.delete(
      `/stores/${storeId}/loss-prevention/thresholds/${thresholdId}`
    );
  },

  // Incidents
  getIncidents: async (
    params: IncidentQueryParams
  ): Promise<PaginatedResponse<LossPreventionIncident>> => {
    const { storeId, ...queryParams } = params;
    const response = await apiClient.get<PaginatedResponse<LossPreventionIncident>>(
      `/stores/${storeId}/loss-prevention/incidents`,
      { params: queryParams }
    );
    return response.data;
  },

  getIncidentStats: async (
    storeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<LPIncidentStats> => {
    const response = await apiClient.get<LPIncidentStats>(
      `/stores/${storeId}/loss-prevention/incidents/stats`,
      { params: { startDate, endDate } }
    );
    return response.data;
  },

  getIncident: async (
    storeId: string,
    incidentId: string
  ): Promise<LossPreventionIncident> => {
    const response = await apiClient.get<LossPreventionIncident>(
      `/stores/${storeId}/loss-prevention/incidents/${incidentId}`
    );
    return response.data;
  },

  acknowledgeIncident: async (
    storeId: string,
    incidentId: string
  ): Promise<LossPreventionIncident> => {
    const response = await apiClient.post<LossPreventionIncident>(
      `/stores/${storeId}/loss-prevention/incidents/${incidentId}/acknowledge`
    );
    return response.data;
  },

  resolveIncident: async (
    storeId: string,
    incidentId: string,
    data: ResolveIncidentDto
  ): Promise<LossPreventionIncident> => {
    const response = await apiClient.post<LossPreventionIncident>(
      `/stores/${storeId}/loss-prevention/incidents/${incidentId}/resolve`,
      data
    );
    return response.data;
  },

  escalateIncident: async (
    storeId: string,
    incidentId: string
  ): Promise<LossPreventionIncident> => {
    const response = await apiClient.post<LossPreventionIncident>(
      `/stores/${storeId}/loss-prevention/incidents/${incidentId}/escalate`
    );
    return response.data;
  },

  // Manual Evaluation
  triggerEvaluation: async (
    storeId: string
  ): Promise<{ message: string; incidentsCreated: number }> => {
    const response = await apiClient.post<{
      message: string;
      incidentsCreated: number;
    }>(`/stores/${storeId}/loss-prevention/evaluate`);
    return response.data;
  },
};
