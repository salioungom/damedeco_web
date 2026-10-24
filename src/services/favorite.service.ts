/**
 * @file /services/favorite.service.ts
 * @description Service dédié à la gestion des favoris produits avec API v1
 * @version 2.0.0
 * @author DameDéco Team
 */

import { api, isCanceledRequest } from '@/lib/api';

export interface ProductInfo {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  /**
   * Prix d'origine (prix barré).
   * L'API l'expose sous `compare_price` (nom du modèle produit) ; les alias
   * camelCase sont aussi acceptés car le résumé produit des favoris est
   * sérialisé en camelCase (`imageUrl`). Les montants peuvent arriver en
   * chaîne : ils sont convertis à la lecture (cf. `@/lib/pricing`).
   */
  compare_price?: number | string | null;
  original_price?: number | string | null;
  comparePrice?: number | string | null;
  originalPrice?: number | string | null;
  pieces?: number;
}

export interface Favorite {
  id: number;
  user_id: number;
  product_id: number;
  product: ProductInfo;
  created_at: string;
  updated_at: string;
}

export interface FavoritesList {
  items: Favorite[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export class FavoriteService {
  /**
   * Liste des favoris de l'utilisateur.
   * `signal` permet d'annuler la requête lorsque le bloc qui la consomme
   * est démonté.
   */
  static async getUserFavorites(skip: number = 0, limit: number = 20, signal?: AbortSignal): Promise<FavoritesList> {
    try {
      const response = await api.get<FavoritesList>(`/api/v1/favorites/?skip=${skip}&limit=${limit}`, { signal });
      return response.data;
    } catch (error) {
      // Requête annulée : comportement normal, pas une panne.
      if (isCanceledRequest(error)) {
        throw error;
      }
      console.error('Erreur récupération favoris:', error);
      throw new Error('Impossible de récupérer les favoris');
    }
  }

  static async addFavorite(productId: number): Promise<Favorite> {
    try {
      const response = await api.post<Favorite>(`/api/v1/favorites/?product_id=${productId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Veuillez vous connecter pour ajouter aux favoris');
      }
      if (error.response?.data?.detail === "Produit déjà dans les favoris") {
        throw new Error('Ce produit est déjà dans vos favoris');
      }
      throw new Error('Impossible d\'ajouter aux favoris');
    }
  }

  static async removeFavorite(productId: number): Promise<void> {
    try {
      await api.delete(`/api/v1/favorites/${productId}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("Favori non trouvé");
      }
      throw new Error('Impossible de retirer des favoris');
    }
  }

  static async checkFavorite(productId: number): Promise<boolean> {
    try {
      const response = await api.get<{ isFavorite: boolean }>(`/api/v1/favorites/check/${productId}`);
      return response.data.isFavorite;
    } catch (error) {
      return false;
    }
  }

  static async getFavoritesCount(signal?: AbortSignal): Promise<number> {
    try {
      const favorites = await this.getUserFavorites(0, 1, signal);
      return favorites.total;
    } catch (error) {
      return 0;
    }
  }
}
