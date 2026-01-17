import apiClient from './client';
import { Item, Category, PaginatedResponse } from '../types';

export interface CreateItemDto {
  storeId: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  categoryId?: string;
  isActive?: boolean;
}

export interface UpdateItemDto {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  isActive?: boolean;
}

export interface CreateCategoryDto {
  storeId: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const itemsApi = {
  getAll: async (params: {
    storeId: string;
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Item>> => {
    const response = await apiClient.get<PaginatedResponse<Item>>('/items', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Item> => {
    const response = await apiClient.get<Item>(`/items/${id}`);
    return response.data;
  },

  create: async (data: CreateItemDto): Promise<Item> => {
    const response = await apiClient.post<Item>('/items', data);
    return response.data;
  },

  update: async (id: string, data: UpdateItemDto): Promise<Item> => {
    const response = await apiClient.patch<Item>(`/items/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },

  getVersions: async (id: string): Promise<{ version: number; name: string; price: number; createdAt: string }[]> => {
    const response = await apiClient.get(`/items/${id}/versions`);
    return response.data;
  },

  // Categories
  getCategories: async (storeId: string): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/items/categories/list', { params: { storeId } });
    return response.data;
  },

  getCategoryById: async (id: string): Promise<Category> => {
    const response = await apiClient.get<Category>(`/items/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: CreateCategoryDto): Promise<Category> => {
    const response = await apiClient.post<Category>('/items/categories', data);
    return response.data;
  },

  updateCategory: async (id: string, data: UpdateCategoryDto): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/items/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/categories/${id}`);
  },
};
