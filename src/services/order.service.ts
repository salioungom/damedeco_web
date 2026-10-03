/**
 * @file /services/order.service.ts
 * @description Service dédié à la gestion des commandes avec API v1
 * @version 1.0.0
 * @author DameDéco Team
 */

import { getOrders, getOrderById, createOrder, cancelOrder, getOrderPayments, confirmOrderDelivery, updateOrderDelivery } from '@/lib/api';
import api from '@/lib/api';
import { formatFcfa } from '@/lib/format';
import { Order, CartItem } from '@/lib/types';
import { CartItemWithProduct } from '@/hooks/useCartWithProducts';
import type { DeliveryMode, PaymentMethod, ShippingAddress } from '@/lib/delivery';

// Réexport du contrat partagé (livraison / paiement).
export type { DeliveryMode, PaymentMethod, ShippingAddress } from '@/lib/delivery';
export { PAYMENT_GATEWAY } from '@/lib/delivery';

// Type unique des articles de commande (source unique : lib/types).
export type { OrderItem } from '@/lib/types';

// Types pour les statuts de commande
export const ORDER_STATUS = {
  PENDING: 'pending' as const,
  CONFIRMED: 'confirmed' as const,
  PROCESSING: 'processing' as const,
  SHIPPED: 'shipped' as const,
  DELIVERED: 'delivered' as const,
  CANCELLED: 'cancelled' as const,
  REFUNDED: 'refunded' as const
};

export const PAYMENT_STATUS = {
  PENDING: 'pending' as const,
  PROCESSING: 'processing' as const,
  COMPLETED: 'completed' as const,
  PAID: 'paid' as const,
  FAILED: 'failed' as const,
  CANCELLED: 'cancelled' as const,
  EXPIRED: 'expired' as const,
  REFUNDED: 'refunded' as const
};

// Types pour les réponses API
export interface OrderResponse extends Order {
  order_number: string;
  payment_status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  currency: string;
  items_count?: number;
}

export interface Payment {
  id: number;
  order_id: number;
  payment_method: string | null;
  amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'expired';
  transaction_id?: string;
  created_at: string;
}

export interface PaymentInitiateResponse {
  payment_id?: number;
  redirect_url?: string;
  ref_command?: string;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

// Interface pour la création de commande
// shipping_address est obligatoire uniquement pour mode=home_delivery.
// payment_method est optionnel : PayTech détermine le moyen réel, renseigné après IPN.
export interface CreateOrderData {
  items: {
    product_id: string | number;
    quantity: number;
    unit_price: number;
  }[];
  mode: DeliveryMode;
  shipping_address?: ShippingAddress;
  currency?: string;
  payment_method?: PaymentMethod;
  payment_phone?: string;
  order_type?: string;
}

/**
 * Erreur enrichie par les services : elle conserve le statut HTTP d'origine
 * (posé par l'intercepteur api.ts) ainsi que la réponse brute de l'API et la
 * cause réelle, afin de garder le `detail` backend identifiable derrière le
 * message métier.
 */
interface ServiceError extends Error {
  status?: number;
  code?: string;
  response?: unknown;
  config?: unknown;
  cause?: unknown;
}

/**
 * Enrichit une erreur levée par le service avec le statut HTTP d'origine
 * (l'intercepteur api.ts le pose sur l'erreur Axios). Permet aux appels
 * (pages success / finalize) de réagir précisément, ex. 404 = commande introuvable.
 *
 * La cause réelle n'est jamais détruite : `response.data` (vrai `detail` de
 * l'API), `config` et l'erreur source sont conservés pour diagnostiquer une
 * erreur serveur (ex. HTTP 500 sur les paiements).
 */
function withStatus(error: unknown, message: string): Error {
  const source = error as ServiceError | null;
  const out: ServiceError = new Error(message);

  if (error instanceof Error) out.cause = error;
  else if (source?.cause) out.cause = source.cause;
  if (typeof source?.status === 'number') out.status = source.status;
  if (source?.code) out.code = source.code;
  if (source?.response !== undefined) out.response = source.response;
  if (source?.config !== undefined) out.config = source.config;

  return out;
}

// Service de gestion des commandes
export class OrderService {
  /**
   * Récupérer la liste des commandes du client
   */
  static async getCustomerOrders(
    page: number = 0,
    limit: number = 20,
    status?: typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
  ): Promise<OrderResponse[]> {
    try {
      const orders = await getOrders(page, limit, status);
      return orders;
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      throw withStatus(error, 'Impossible de récupérer les commandes');
    }
  }

  /**
   * Récupérer les détails d'une commande
   */
  static async getOrderDetails(orderId: string | number): Promise<OrderResponse> {
    try {
      const order = await getOrderById(orderId);
      return order;
    } catch (error) {
      console.error('Erreur détails commande:', error);
      throw withStatus(error, 'Impossible de récupérer les détails de la commande');
    }
  }

  /**
   * Créer une nouvelle commande à partir du panier
   * Note: La validation des données doit être faite avant l'appel à cette méthode
   */
  static async createOrderFromCart(
    cartItems: CartItemWithProduct[],
    mode: DeliveryMode,
    shippingAddress?: ShippingAddress,
    paymentMethod?: PaymentMethod,
    currency: string = 'FCFA'
  ): Promise<OrderResponse> {
    try {
      const orderItems = cartItems.map(item => {
        if (!item.product) {
          throw new Error(`Produit non trouvé pour l'item ${item.product_id}`);
        }
        const price = item.price_type === 'wholesale'
          ? item.product.wholesale_price
          : item.product.price;

        return {
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: Number(price) || 0
        };
      });

      const orderData: CreateOrderData = {
        items: orderItems,
        currency,
        order_type: 'standard',
        mode
      };

      if (paymentMethod) {
        orderData.payment_method = paymentMethod;
      }

      if (mode === 'home_delivery' && shippingAddress) {
        orderData.shipping_address = shippingAddress;
      }

      const order = await createOrder(orderData);
      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Annuler une commande du client
   */
  static async cancelCustomerOrder(orderId: string | number): Promise<OrderResponse> {
    try {
      const cancelledOrder = await cancelOrder(orderId);
      return cancelledOrder;
    } catch (error) {
      console.error('Erreur annulation commande:', error);
      throw withStatus(error, 'Impossible d\'annuler la commande');
    }
  }

  /**
   * Confirmer la réception d'une commande livrée (action client dédiée).
   * Le statut est posé par le backend : le frontend ne modifie jamais
   * order.status directement.
   */
  static async confirmDelivery(orderId: string | number): Promise<OrderResponse> {
    try {
      const confirmedOrder = await confirmOrderDelivery(orderId);
      return confirmedOrder;
    } catch (error) {
      console.error('Erreur confirmation réception:', error);
      throw withStatus(error, 'Impossible de confirmer la réception de la commande');
    }
  }

  /**
   * Modifier une commande du client
   */
  static async modifyOrder(orderId: string | number, modifications: Array<{
    action: 'add' | 'remove' | 'update';
    product_id: number;
    quantity?: number;
    unit_price?: number;
  }>): Promise<OrderResponse> {
    try {
      // Import des utilitaires d'authentification
      const { getAuthToken, getAuthHeaders } = await import('@/lib/authUtils');
      
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Vous devez être connecté pour modifier une commande. Veuillez vous reconnecter.');
      }

      const response = await fetch(`/api/v1/orders/${orderId}/modify`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: modifications })
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = 'Impossible de modifier la commande';
        
        // Gestion des erreurs spécifiques du backend
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (error.detail.msg) {
            errorMessage = error.detail.msg;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Gestion spécifique de l'erreur de credentials
        if (errorMessage.includes('credentials') || errorMessage.includes('Could not validate credentials')) {
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
        }
        
        throw new Error(errorMessage);
      }

      const updatedOrder = await response.json();
      return updatedOrder;
    } catch (error) {
      console.error('Erreur modification commande:', error);
      
      // Si l'erreur est liée à l'authentification, on peut proposer la reconnexion
      if (error instanceof Error && error.message.includes('reconnecter')) {
        // Optionnellement, on pourrait déclencher une reconnexion automatique
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
      
      throw error;
    }
  }

  /**
   * Récupérer les paiements d'une commande
   */
  static async getOrderPayments(orderId: string | number): Promise<Payment[]> {
    try {
      const payments = await getOrderPayments(orderId);
      return payments as Payment[];
    } catch (error) {
      console.error('Erreur récupération paiements:', error);
      throw withStatus(error, 'Impossible de récupérer les paiements');
    }
  }

  /**
   * Initialiser le paiement d'une commande (POST /api/v1/orders/{orderId}/pay).
   * Le backend exige order_id dans le corps. Aucun payment_method n'est envoyé :
   * c'est PayTech qui détermine le moyen de paiement réel (renseigné par IPN).
   */
  static async initiatePayment(orderId: string | number, payload?: Record<string, unknown>): Promise<PaymentInitiateResponse> {
    try {
      const response = await api.post<PaymentInitiateResponse>(`/api/v1/orders/${orderId}/pay`, {
        order_id: orderId,
        ...(payload || {})
      });
      return response.data;
    } catch (error) {
      console.error('Erreur initialisation paiement:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les informations de livraison d'une commande existante.
   * Utilisé lors de la reprise d'une commande sur /checkout/finalize?orderId={orderId}.
   */
  static async updateOrderDelivery(
    orderId: string | number,
    mode: DeliveryMode,
    shippingAddress?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      city?: string;
      address?: string;
      instructions?: string;
    }
  ): Promise<OrderResponse> {
    try {
      const payload: any = { mode };

      if (mode === 'home_delivery' && shippingAddress) {
        payload.shipping_address = {
          first_name: shippingAddress.first_name,
          last_name: shippingAddress.last_name,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          city: shippingAddress.city,
          address: shippingAddress.address,
          instructions: shippingAddress.instructions,
        };
      }

      const updatedOrder = await updateOrderDelivery(orderId, payload);
      return updatedOrder;
    } catch (error) {
      console.error('Erreur mise à jour livraison:', error);
      throw withStatus(error, 'Impossible de mettre à jour les informations de livraison');
    }
  }

  /**
   * Formater le montant en devise locale.
   * Formatage centralisé dans /lib/format.ts (0 décimale, suffixe « FCFA »).
   * L'application n'utilise que la devise FCFA : `currency` est conservé pour
   * compatibilité d'appel.
   */
  static formatAmount(amount: string | number, currency: string = 'FCFA'): string {
    return formatFcfa(amount);
  }

  /**
   * Formater la date en français
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-SN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtenir la couleur du statut pour l'UI
   */
  static getStatusColor(status: string): 'success' | 'warning' | 'info' | 'default' | 'error' {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'confirmed':
      case 'processing':
      case 'shipped':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  }

  /**
   * Obtenir le libellé du statut en français
   */
  static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      // 'confirmed' est legacy uniquement : conservé pour l'affichage d'anciennes commandes.
      'confirmed': 'Confirmée',
      'processing': 'En préparation',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      // 'refunded' n'est pas déclenché par l'UI : simple compatibilité d'affichage.
      'refunded': 'Remboursée'
    };
    return labels[status] || status;
  }

  /**
   * Obtenir le libellé du statut de paiement en français
   */
  static getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'processing': 'En traitement',
      'paid': 'Payé',
      'completed': 'Payé',
      'failed': 'Échoué',
      'cancelled': 'Annulé',
      'expired': 'Expiré',
      'refunded': 'Remboursé'
    };
    return labels[status] || status;
  }
}

export default OrderService;
