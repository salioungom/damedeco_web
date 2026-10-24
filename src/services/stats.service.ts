/**
 * @file /services/stats.service.ts
 * @description Service dédié aux statistiques du dashboard client avec API v1
 * @version 1.0.0
 * @author DameDéco Team
 */

import { api, isCanceledRequest } from '@/lib/api';
import { formatFcfa } from '@/lib/format';
import { getImageUrl } from '@/lib/imageUtils';
import type { Order } from '@/lib/types';
import type { OrderResponse } from './order.service';

// ---------------------------------------------------------------------------
// Types stricts du tableau de bord client
// ---------------------------------------------------------------------------

/** Statuts de commande acceptés par l'API. */
export type AccountOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/** Statuts de paiement acceptés par l'API. */
export type AccountPaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled'
  | 'expired';

const ACCOUNT_ORDER_STATUSES: ReadonlySet<string> = new Set<AccountOrderStatus>([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

const ACCOUNT_PAYMENT_STATUSES: ReadonlySet<string> = new Set<AccountPaymentStatus>([
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'cancelled',
  'expired',
]);

/** Statuts qui comptent comme « commande en cours ». */
const ACTIVE_ORDER_STATUSES: ReadonlySet<AccountOrderStatus> = new Set<AccountOrderStatus>([
  'pending',
  'processing',
  'shipped',
]);

/** Commande normalisée pour les blocs du tableau de bord. */
export interface AccountOrder {
  id: number;
  orderNumber: string;
  status: AccountOrderStatus;
  paymentStatus: AccountPaymentStatus;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
  firstItemImage: string | null;
  firstItemName: string | null;
}

/** Statistiques de l'espace client. */
export interface AccountStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  totalFavorites: number;
}

/** Commande récente affichée en carte. */
export interface RecentOrder {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: AccountOrderStatus;
  paymentStatus: AccountPaymentStatus;
  itemsCount: number;
  createdAt: string;
  firstItemImage: string | null;
  productImages?: string[];
}

/** Suivi de commande : étape atteinte dans le parcours de livraison. */
export interface OrderTracking {
  orderId: number;
  orderNumber: string;
  status: AccountOrderStatus;
  /** Index de l'étape atteinte (-1 : aucune étape validée). */
  step: number;
  createdAt: string;
  totalAmount: number;
  itemsCount: number;
}

/** Étapes du suivi, dans l'ordre du parcours de livraison. */
export const TRACKING_STEPS: ReadonlyArray<{ value: AccountOrderStatus; label: string }> = [
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'processing', label: 'Préparée' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
];

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  totalFavorites: number;
  recentOrders: RecentOrder[];
}

// ---------------------------------------------------------------------------
// Chargement partagé des commandes du client
//
// Les trois blocs du tableau de bord (statistiques, commandes récentes, suivi)
// s'appuient sur UNE SEULE requête `GET /api/v1/orders?skip=0&limit=…` :
// les appels concurrents partagent la requête en cours et son résultat est
// brièvement mis en cache. Le `signal` fourni par l'appelant annule son
// propre attente ; la requête partagée n'est interrompue que lorsque le
// dernier appelant se désabonne.
// ---------------------------------------------------------------------------

const ORDERS_FEED_TTL_MS = 30_000;

type OrdersFeedCache = { at: number; orders: AccountOrder[] };
type OrdersFeedPending = {
  promise: Promise<AccountOrder[]>;
  controller: AbortController;
  waiters: number;
};

/**
 * Cache et requêtes en cours, CLÉS PAR IDENTIFIANT UTILISATEUR : deux
 * comptes ne doivent jamais voir les commandes de l'autre (le cache n'est pas
 * partagé entre les sessions).
 */
const ordersFeedCache = new Map<string, OrdersFeedCache>();
const ordersFeedPending = new Map<string, OrdersFeedPending>();

function isAccountOrderStatus(value: unknown): value is AccountOrderStatus {
  return typeof value === 'string' && ACCOUNT_ORDER_STATUSES.has(value);
}

function isAccountPaymentStatus(value: unknown): value is AccountPaymentStatus {
  return typeof value === 'string' && ACCOUNT_PAYMENT_STATUSES.has(value);
}

/** Erreur d'annulation : distingue une annulation d'une panne réseau. */
function createAbortError(): Error {
  const error = new Error('Requête annulée');
  error.name = 'AbortError';
  return error;
}

// Service de gestion des statistiques
export class StatsService {
  /**
   * Normalise une commande de l'API en commande exploitable par les blocs du
   * tableau de bord (statuts typés, montant numérique, miniature).
   */
  static normalizeOrder(order: Order): AccountOrder {
    const items = Array.isArray(order.items) ? order.items : [];
    const firstItem = items[0];
    const rawImage =
      firstItem?.product?.cover_image_url ??
      firstItem?.product?.images?.[0]?.image_url ??
      null;

    return {
      id: order.id,
      orderNumber: order.order_number || `#${order.id}`,
      status: isAccountOrderStatus(order.status) ? order.status : 'pending',
      paymentStatus: isAccountPaymentStatus(order.payment_status) ? order.payment_status : 'pending',
      totalAmount: Number(order.total_amount) || 0,
      itemsCount: order.items_count ?? items.length,
      createdAt: order.created_at,
      firstItemImage: rawImage ? getImageUrl(rawImage) : null,
      firstItemName: firstItem?.product?.name ?? null,
    };
  }

  /**
   * Charge les commandes du client.
   *
   * UNE SEULE requête `GET /api/v1/orders?skip=0&limit=…` alimente les trois
   * blocs du tableau de bord (statistiques, commandes récentes, suivi) : les
   * appels concurrents partagent la requête en cours (single-flight) et le
   * résultat est brièvement mis en cache.
   *
   * Le `signal` de l'appelant annule sa propre attente ; la requête partagée
   * n'est interrompue que lorsque le dernier appelant se désabonne.
   */
  static async getCustomerOrdersFeed(
    userId: string,
    limit = 100,
    signal?: AbortSignal,
  ): Promise<AccountOrder[]> {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const cached = ordersFeedCache.get(userId);
    if (cached && Date.now() - cached.at < ORDERS_FEED_TTL_MS) {
      return cached.orders;
    }

    let pending = ordersFeedPending.get(userId);
    if (!pending) {
      const controller = new AbortController();
      const promise = api
        .get<Order[]>(`/api/v1/orders/?skip=0&limit=${limit}`, { signal: controller.signal })
        .then((response) => {
          const orders = (Array.isArray(response.data) ? response.data : []).map((order) =>
            this.normalizeOrder(order),
          );
          ordersFeedCache.set(userId, { at: Date.now(), orders });
          return orders;
        })
        .finally(() => {
          if (ordersFeedPending.get(userId)?.promise === promise) {
            ordersFeedPending.delete(userId);
          }
        });
      pending = { promise, controller, waiters: 0 };
      ordersFeedPending.set(userId, pending);
    }
    pending.waiters += 1;

    let released = false;
    const release = () => {
      if (released) {
        return;
      }
      released = true;
      pending.waiters -= 1;
      if (pending.waiters <= 0) {
        // Plus aucun bloc n'attend cette requête : elle est annulée et
        // retirée IMMÉDIATEMENT du pool. Sans cette retrait, un appelant
        // suivant (remontage du composant) se rattacherait à la requête
        // annulée et récupérerait son erreur au lieu de déclencher un
        // nouveau chargement.
        pending.controller.abort();
        if (ordersFeedPending.get(userId) === pending) {
          ordersFeedPending.delete(userId);
        }
      }
    };
    const onAbort = () => release();
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const orders = await pending.promise;
      if (signal?.aborted) {
        throw createAbortError();
      }
      return orders;
    } finally {
      signal?.removeEventListener('abort', onAbort);
      release();
    }
  }

  /**
   * Vide le cache des commandes (déconnexion, création ou annulation de
   * commande). Sans identifiant, tous les utilisateurs sont purgés.
   */
  static clearOrdersFeedCache(userId?: string): void {
    if (userId) {
      ordersFeedCache.delete(userId);
      ordersFeedPending.delete(userId);
      return;
    }
    ordersFeedCache.clear();
    ordersFeedPending.clear();
  }

  /**
   * Statistiques de l'espace client : nombre de commandes, total dépensé
   * (somme des commandes payées), commandes en cours et nombre de favoris.
   *
   * TODO(back) Les statistiques sont calculées sur les 100 DERNIÈRES
   * commandes au maximum (la liste est paginée côté API). Un utilisateur
   * ayant plus de 100 commandes verra donc des compteurs et un total dépensé
   * partiels. Ticket à créer : endpoint d'agrégation côté backend
   * (ex. GET /api/v1/account/stats renvoyant total_orders, total_spent,
   * pending_orders) pour que les chiffres soient exhaustifs.
   */
  static async getAccountStats(
    userId: string,
    limit = 100,
    signal?: AbortSignal,
  ): Promise<AccountStats> {
    const orders = await this.getCustomerOrdersFeed(userId, limit, signal);
    const { FavoriteService } = await import('./favorite.service');

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const pendingOrders = orders.filter((order) => ACTIVE_ORDER_STATUSES.has(order.status)).length;

    let totalFavorites = 0;
    try {
      totalFavorites = await FavoriteService.getFavoritesCount(signal);
    } catch (error) {
      if (isCanceledRequest(error)) {
        throw error;
      }
      totalFavorites = 0;
    }

    return { totalOrders, totalSpent, pendingOrders, totalFavorites };
  }

  /**
   * Commandes récentes (les plus récentes d'abord), issues de la requête
   * partagée avec les statistiques et le suivi.
   */
  static async getRecentOrders(
    userId: string,
    limit = 3,
    signal?: AbortSignal,
  ): Promise<RecentOrder[]> {
    const orders = await this.getCustomerOrdersFeed(userId, 100, signal);
    return orders.slice(0, limit).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemsCount: order.itemsCount,
      createdAt: order.createdAt,
      firstItemImage: order.firstItemImage,
    }));
  }

  /**
   * Suivi des commandes non livrées : chaque entrée décrit l'étape atteinte
   * dans le parcours confirmée → préparée → expédiée → livrée.
   */
  static async getOrderTrackings(userId: string, signal?: AbortSignal): Promise<OrderTracking[]> {
    const orders = await this.getCustomerOrdersFeed(userId, 100, signal);
    return orders
      .filter((order) => order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'refunded')
      .map((order) => {
        const step = TRACKING_STEPS.findIndex((stepDef) => stepDef.value === order.status);
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          step,
          createdAt: order.createdAt,
          totalAmount: order.totalAmount,
          itemsCount: order.itemsCount,
        };
      });
  }

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
          paymentStatus: isAccountPaymentStatus(order.payment_status) ? order.payment_status : 'pending',
          itemsCount: order.items_count ?? order.items?.length ?? 0,
          createdAt: order.created_at,
          firstItemImage: productImages[0] ?? null,
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
        paymentStatus: isAccountPaymentStatus(order.payment_status) ? order.payment_status : 'pending',
        itemsCount: order.items_count ?? order.items?.length ?? 0,
        createdAt: order.created_at,
        firstItemImage: null,
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
