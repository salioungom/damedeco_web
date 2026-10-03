import axios from 'axios';
import { safeApiCall, ApiErrorHandler } from '@/lib/error-handler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''; // Utiliser le proxy Next.js

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const getAuthHeader = () => {
  if (typeof window === 'undefined') {
    return { headers: { 'Content-Type': 'application/json' } };
  }
  
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return {
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const categoryService = {
  // Récupérer toutes les catégories avec pagination et filtres
  async getCategories(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<{ data: PaginatedResponse<Category> | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.get<PaginatedResponse<Category>>(
        `${API_BASE_URL}/api/v1/categories/`,
        {
          ...getAuthHeader(),
          params,
        }
      );
      return response.data;
    });
  },

  // Récupérer les catégories actives
  async getActiveCategories(): Promise<{ data: Category[] | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.get<any>(
        `${API_BASE_URL}/api/v1/categories/active`,
        getAuthHeader()
      );
      return response.data.items || response.data || [];
    });
  },

  // Récupérer une catégorie par ID
  async getCategoryById(id: number): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.get<Category>(
        `${API_BASE_URL}/api/v1/categories/${id}`,
        getAuthHeader()
      );
      return response.data;
    });
  },

  // Récupérer une catégorie par slug
  async getCategoryBySlug(slug: string): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.get<Category>(
        `${API_BASE_URL}/api/v1/categories/slug/${slug}`,
        getAuthHeader()
      );
      return response.data;
    });
  },

  // Créer une nouvelle catégorie
  async createCategory(data: {
    name: string;
    slug?: string;
    description?: string;
    is_active?: boolean;
    sort_order?: number;
  }): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.post<Category>(
        `${API_BASE_URL}/api/v1/categories/`,
        data,
        getAuthHeader()
      );
      return response.data;
    });
  },

  // Mettre à jour une catégorie
  async updateCategory(id: number, data: Partial<Category>): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.put<Category>(
        `${API_BASE_URL}/api/v1/categories/${id}`,
        data,
        getAuthHeader()
      );
      return response.data;
    });
  },

  // Supprimer une catégorie
  async deleteCategory(id: number): Promise<{ data: null; error: any }> {
    return safeApiCall(async () => {
      await axios.delete(`${API_BASE_URL}/api/v1/categories/${id}`, getAuthHeader());
      return null;
    });
  },

  // Basculer le statut actif/inactif d'une catégorie
  async toggleCategoryStatus(id: number): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.patch<Category>(
        `${API_BASE_URL}/api/v1/categories/${id}/toggle`,
        {},
        getAuthHeader()
      );
      return response.data;
    });
  },

  // Téléverser ou remplacer une image de catégorie
  async uploadCategoryImage(id: number, file: File): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post<Category>(
        `${API_BASE_URL}/api/v1/categories/${id}/image`,
        formData,
        {
          headers: {
            ...getAuthHeader().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    });
  },

  // Mettre à jour une image de catégorie (NEW)
  async updateCategoryImage(id: number, file: File): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.put<Category>(
        `${API_BASE_URL}/api/v1/categories/${id}/image`,
        formData,
        {
          headers: {
            ...getAuthHeader().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    });
  },

  // Supprimer l'image d'une catégorie
  async deleteCategoryImage(id: number): Promise<{ data: Category | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.delete<Category>(
        `${API_BASE_URL}/api/v1/categories/${id}/image`,
        getAuthHeader()
      );
      return response.data;
    });
  },
};
