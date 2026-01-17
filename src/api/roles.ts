import apiClient from './client';
import { Role, Permission } from '../types';

export interface CreateRoleDto {
  storeId?: string;
  name: string;
  description?: string;
  permissions: string[]; // Permission codes like 'store.read'
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[]; // Permission codes like 'store.read'
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export const rolesApi = {
  // Roles
  getAll: async (storeId?: string): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/rbac/roles', { params: { storeId } });
    return response.data;
  },

  getById: async (id: string): Promise<Role> => {
    const response = await apiClient.get<Role>(`/rbac/roles/${id}`);
    return response.data;
  },

  create: async (data: CreateRoleDto): Promise<Role> => {
    const response = await apiClient.post<Role>('/rbac/roles', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRoleDto): Promise<Role> => {
    const response = await apiClient.patch<Role>(`/rbac/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rbac/roles/${id}`);
  },

  // Permissions
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>('/rbac/permissions');
    return response.data;
  },

  getPermissionsByModule: async (): Promise<PermissionGroup[]> => {
    const response = await apiClient.get<PermissionGroup[]>('/rbac/permissions/grouped');
    return response.data;
  },

  // Current user permissions
  getMyPermissions: async (): Promise<{
    permissions: string[];
    storeId?: string;
    roleId?: string;
  }> => {
    const response = await apiClient.get('/rbac/my-permissions');
    return response.data;
  },
};
