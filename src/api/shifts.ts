import apiClient from './client';
import { Shift, ShiftStatus, PaginatedResponse, CashMovement } from '../types';

export interface GetShiftsParams {
  storeId?: string;
  branchId?: string;
  posDeviceId?: string;
  status?: ShiftStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ShiftsSummary {
  totalShifts: number;
  openShifts: number;
  closedShifts: number;
  totalVariance: number;
  shiftsWithVariance: number;
  averageShiftDuration: number;
}

export const shiftsApi = {
  getShifts: async (params: GetShiftsParams): Promise<PaginatedResponse<Shift>> => {
    const response = await apiClient.get<PaginatedResponse<Shift>>('/shifts', { params });
    return response.data;
  },

  getShiftById: async (id: string): Promise<Shift> => {
    const response = await apiClient.get<Shift>(`/shifts/${id}`);
    return response.data;
  },

  getShiftCashMovements: async (shiftId: string): Promise<CashMovement[]> => {
    const response = await apiClient.get<CashMovement[]>(`/shifts/${shiftId}/movements`);
    return response.data;
  },

  getShiftsSummary: async (params: Omit<GetShiftsParams, 'page' | 'limit'>): Promise<ShiftsSummary> => {
    const response = await apiClient.get<ShiftsSummary>('/shifts/summary', { params });
    return response.data;
  },

  getVarianceShifts: async (params: GetShiftsParams): Promise<PaginatedResponse<Shift>> => {
    const response = await apiClient.get<PaginatedResponse<Shift>>('/shifts/variances', { params });
    return response.data;
  },
};
