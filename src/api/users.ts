import apiClient from './client';
import { User, PaginatedResponse } from '../types';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  storeId?: string;
  roleId?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UserWithStores extends User {
  storeUsers?: {
    id: string;
    storeId: string;
    roleId: string;
    isActive: boolean;
    store: {
      id: string;
      name: string;
    };
    role: {
      id: string;
      name: string;
    };
  }[];
}

export const usersApi = {
  getAll: async (params?: {
    storeId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<UserWithStores>> => {
    const response = await apiClient.get<PaginatedResponse<UserWithStores>>('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<UserWithStores> => {
    const response = await apiClient.get<UserWithStores>(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  assignToStore: async (userId: string, storeId: string, roleId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/assign-store`, { storeId, roleId });
  },

  removeFromStore: async (userId: string, storeId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/stores/${storeId}`);
  },
};
