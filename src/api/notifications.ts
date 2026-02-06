import apiClient from './client';
import {
  NotificationPreference,
  NotificationLog,
  NotificationSchedule,
  NotificationType,
  NotificationStatus,
} from '../types';

export interface UpdatePreferencesDto {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  dailyDigest?: boolean;
  weeklySummary?: boolean;
  alertsEnabled?: boolean;
  email?: string;
  phone?: string;
}

export interface UpdateScheduleDto {
  schedule?: string;
  timezone?: string;
  enabled?: boolean;
}

export interface SendTestNotificationDto {
  type: NotificationType;
  subject?: string;
  message: string;
}

export interface LogQueryParams {
  type?: NotificationType;
  status?: NotificationStatus;
  userId?: string;
  limit?: number;
  offset?: number;
}

export const notificationsApi = {
  // Preferences
  getMyPreferences: async (storeId: string): Promise<NotificationPreference> => {
    const response = await apiClient.get<NotificationPreference>(
      `/stores/${storeId}/notifications/preferences`
    );
    return response.data;
  },

  updateMyPreferences: async (
    storeId: string,
    data: UpdatePreferencesDto
  ): Promise<NotificationPreference> => {
    const response = await apiClient.patch<NotificationPreference>(
      `/stores/${storeId}/notifications/preferences`,
      data
    );
    return response.data;
  },

  getAllPreferences: async (storeId: string): Promise<NotificationPreference[]> => {
    const response = await apiClient.get<NotificationPreference[]>(
      `/stores/${storeId}/notifications/preferences/all`
    );
    return response.data;
  },

  getUserPreferences: async (
    storeId: string,
    userId: string
  ): Promise<NotificationPreference> => {
    const response = await apiClient.get<NotificationPreference>(
      `/stores/${storeId}/notifications/preferences/user/${userId}`
    );
    return response.data;
  },

  updateUserPreferences: async (
    storeId: string,
    userId: string,
    data: UpdatePreferencesDto
  ): Promise<NotificationPreference> => {
    const response = await apiClient.patch<NotificationPreference>(
      `/stores/${storeId}/notifications/preferences/user/${userId}`,
      data
    );
    return response.data;
  },

  // Logs
  getLogs: async (
    storeId: string,
    params?: LogQueryParams
  ): Promise<NotificationLog[]> => {
    const response = await apiClient.get<NotificationLog[]>(
      `/stores/${storeId}/notifications/logs`,
      { params }
    );
    return response.data;
  },

  getMyLogs: async (
    storeId: string,
    limit?: number
  ): Promise<NotificationLog[]> => {
    const response = await apiClient.get<NotificationLog[]>(
      `/stores/${storeId}/notifications/logs/my`,
      { params: { limit } }
    );
    return response.data;
  },

  // Test
  sendTest: async (
    storeId: string,
    data: SendTestNotificationDto
  ): Promise<{ success: boolean; error?: string }> => {
    const response = await apiClient.post<{ success: boolean; error?: string }>(
      `/stores/${storeId}/notifications/test`,
      data
    );
    return response.data;
  },

  // Schedules
  getSchedules: async (storeId: string): Promise<NotificationSchedule[]> => {
    const response = await apiClient.get<NotificationSchedule[]>(
      `/stores/${storeId}/notifications/schedules`
    );
    return response.data;
  },

  getSchedule: async (
    storeId: string,
    type: NotificationType
  ): Promise<NotificationSchedule | null> => {
    const response = await apiClient.get<NotificationSchedule | null>(
      `/stores/${storeId}/notifications/schedules/${type}`
    );
    return response.data;
  },

  updateSchedule: async (
    storeId: string,
    type: NotificationType,
    data: UpdateScheduleDto
  ): Promise<NotificationSchedule> => {
    const response = await apiClient.patch<NotificationSchedule>(
      `/stores/${storeId}/notifications/schedules/${type}`,
      data
    );
    return response.data;
  },

  initializeSchedules: async (
    storeId: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      `/stores/${storeId}/notifications/schedules/initialize`
    );
    return response.data;
  },

  triggerDigest: async (
    storeId: string,
    type: NotificationType
  ): Promise<{ sent: number }> => {
    const response = await apiClient.post<{ sent: number }>(
      `/stores/${storeId}/notifications/schedules/${type}/trigger`
    );
    return response.data;
  },
};
