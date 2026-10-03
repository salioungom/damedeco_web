/**
 * @file /services/stats.service.ts
 * @description Service dédié aux statistiques du dashboard client avec API v1
 * @version 1.0.0
 * @author DameDéco Team
 */

import { api } from '@/lib/api';
import { formatFcfa } from '@/lib/format';
import { OrderResponse } from './order.service';

// Types pour les statistiques
export interface RecentOrder {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  productImages?: string[];
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  totalFavorites: number;
  recentOrders: RecentOrder[];
}

// Service de gestion des statistiques
export class StatsService {
  /**
   * Récupérer les statistiques globales de l'utilisateur
   */
  static async getUserStats(): Promise<UserStats> {
    // Utiliser calculateLocalStats pour extraire les images des produits
    return this.calculateLocalStats();
  }

  /**
   * Calculer les statistiques localement (fallback)
   */
  static async calculateLocalStats(): Promise<UserStats> {
    try {
      // Importer OrderService dynamiquement pour éviter les dépendances circulaires
      const { OrderService } = await import('./order.service');

      // Récupérer les commandes
      const orders = await OrderService.getCustomerOrders(0, 100);
      const recentOrdersRaw = await OrderService.getCustomerOrders(0, 5);

      // Récupérer les détails de chaque commande récente pour obtenir les items
      const recentOrdersWithDetails = await Promise.all(
        recentOrdersRaw.map(async (order) => {
          try {
            const orderDetails = await OrderService.getOrderDetails(order.id);
            return orderDetails;
          } catch (error) {
            console.error(`Erreur récupération détails commande ${order.id}:`, error);
            return order;
          }
        })
      );

      // Calculer les statistiques
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      const activeStatuses = ['pending', 'processing', 'shipped'];
      const pendingOrders = orders.filter(order => activeStatuses.includes(order.status)).length;

      // Récupérer le nombre de favoris (avec fallback si l'API n'existe pas)
      let totalFavorites = 0;
      try {
        const { FavoriteService } = await import('./favorite.service');
        totalFavorites = await FavoriteService.getFavoritesCount();
      } catch (error) {
        console.warn('API favorites non disponible, totalFavorites = 0');
        totalFavorites = 0;
      }

      // Transformer les commandes récentes pour correspondre au format du guide
      const recentOrders: RecentOrder[] = recentOrdersWithDetails.map(order => {
        const productImages = order.items?.map((item: any) => {
          const product = item.product;
          if (!product) return null;
          const rawUrl = product.cover_image_url || (product.images && product.images[0]?.image_url) || null;
          if (!rawUrl) return null;
          if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
          const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
          if (cleanPath.startsWith('/media/')) return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${cleanPath}`;
          return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/media${cleanPath}`;
        }).filter(Boolean).slice(0, 4) || [];
        
        return {
          id: order.id,
          orderNumber: order.order_number || `#${order.id}`,
          totalAmount: Number(order.total_amount) || 0,
          status: order.status,
          createdAt: order.created_at,
          productImages,
        };
      });

      return {
        totalOrders,
        totalSpent,
        pendingOrders,
        totalFavorites,
        recentOrders,
      };
    } catch (error) {
      console.error('Erreur calcul statistiques locales:', error);
      // Retourner des statistiques vides en cas d'erreur
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        totalFavorites: 0,
        recentOrders: [],
      };
    }
  }

  /**
   * Récupérer uniquement les statistiques de commandes
   */
  static async getOrderStats(): Promise<{
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    recentOrders: RecentOrder[];
  }> {
    try {
      const { OrderService } = await import('./order.service');

      const orders = await OrderService.getCustomerOrders(0, 100);
      const recentOrders = await OrderService.getCustomerOrders(0, 5);

      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
      const activeStatuses = ['pending', 'processing', 'shipped'];
      const pendingOrders = orders.filter(order => activeStatuses.includes(order.status)).length;

      // Transformer les commandes récentes pour correspondre au format du guide
      const formattedRecentOrders: RecentOrder[] = recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.order_number || `#${order.id}`,
        totalAmount: Number(order.total_amount) || 0,
        status: order.status,
        createdAt: order.created_at,
      }));

      return {
        totalOrders,
        totalSpent,
        pendingOrders,
        recentOrders: formattedRecentOrders,
      };
    } catch (error) {
      console.error('Erreur récupération statistiques commandes:', error);
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        recentOrders: [],
      };
    }
  }

  /**
   * Formater le montant pour l'affichage.
   * Formatage centralisé dans /lib/format.ts (0 décimale, suffixe « FCFA ») :
   * l'implémentation XOF est supprimée au profit de l'utilitaire unique.
   */
  static formatAmount(amount: number, currency: string = 'FCFA'): string {
    return formatFcfa(amount);
  }

  /**
   * Calculer le pourcentage de commandes livrées
   */
  static async getDeliveryRate(): Promise<number> {
    try {
      const { OrderService } = await import('./order.service');
      const orders = await OrderService.getCustomerOrders(0, 100);

      if (orders.length === 0) return 0;

      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      return Math.round((deliveredOrders / orders.length) * 100);
    } catch (error) {
      console.error('Erreur calcul taux de livraison:', error);
      return 0;
    }
  }
}
