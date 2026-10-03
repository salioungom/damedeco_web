import axios from 'axios';
import { Category } from '@/lib/types';
import { safeApiCall } from '@/lib/error-handler';
import { getImageUrl } from '@/lib/imageUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''; // Utiliser le proxy Next.js

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

export const homeService = {
  // Récupérer les catégories actives pour la page d'accueil
  async getActiveCategories(): Promise<{ data: Category[] | null; error: any }> {
    return safeApiCall(async () => {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/categories/active`,
        getAuthHeader()
      );
      // L'API retourne { items: Category[] }
      const apiCategories = response.data.items || response.data || [];
      
      // Transformer les catégories de l'API vers le format attendu par HomePage
      return apiCategories.map((apiCategory: any) => ({
        id: apiCategory.id.toString(),
        name: apiCategory.name,
        icon: '🏠', // Icône par défaut
        image: getImageUrl(apiCategory.cover_image_url) || '/placeholder-image.jpg'
      }));
    });
  },
};
