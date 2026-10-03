/**
 * @file /services/cart.service.ts
 * @description Service dédié à la gestion du panier — routes guest séparées (X-Session-Id auto via interceptor)
 * @version 3.0.0
 * @author DameDéco Team
 */

import { safeApiCall } from '@/lib/error-handler';
import { api } from '@/lib/api';

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  price_type: 'retail' | 'wholesale';
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  items: CartItem[];
  total_items: number;
  total_unique_products: number;
}

export interface CartSummary {
  items: CartItem[];
  total_items: number;
  total_unique_products: number;
  subtotal: number;
  total: number;
}

export interface GuestInitResponse {
  session_id: string;
}

export interface MergeResponse {
  success: boolean;
  message: string;
  merged_items: number;
}

// ─── Guest Endpoints (/api/v1/cartitems/guest/*) ────────────────────────────
// X-Session-Id is injected automatically by the axios interceptor in api.ts

export const cartService = {
  async initGuestSession(): Promise<{ data: GuestInitResponse | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.post('/api/v1/cartitems/guest/init');
      return response.data as GuestInitResponse;
    });
  },

  async getGuestCart(): Promise<{ data: CartResponse | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.get('/api/v1/cartitems/guest/cart');
      return response.data as CartResponse;
    });
  },

  async addToGuestCart(
    productId: number,
    quantity: number = 1,
    priceType: 'retail' | 'wholesale' = 'retail',
  ): Promise<{ data: CartItem | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.post('/api/v1/cartitems/guest/items', {
        product_id: productId,
        quantity,
        price_type: priceType,
      });
      return response.data as CartItem;
    });
  },

  async updateGuestCartItem(
    itemId: number,
    quantity: number,
  ): Promise<{ data: CartItem | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.put(`/api/v1/cartitems/guest/items/${itemId}`, { quantity });
      return response.data as CartItem;
    });
  },

  async removeGuestCartItem(itemId: number): Promise<{ data: null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.delete(`/api/v1/cartitems/guest/items/${itemId}`);
      return response.data;
    });
  },

  async clearGuestCart(): Promise<{ data: null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.delete('/api/v1/cartitems/guest/cart');
      return response.data;
    });
  },

  async getGuestCartSummary(): Promise<{ data: CartSummary | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.get('/api/v1/cartitems/guest/cart/summary');
      return response.data as CartSummary;
    });
  },

  // ─── Authenticated Endpoints (/api/v1/cartitems/*) ──────────────────────
  // JWT is injected automatically by the axios interceptor in api.ts

  async getCart(): Promise<{ data: CartResponse | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.get('/api/v1/cartitems/cart');
      return response.data as CartResponse;
    });
  },

  async addToCart(
    productId: number,
    quantity: number = 1,
    priceType: 'retail' | 'wholesale' = 'retail',
  ): Promise<{ data: CartItem | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.post('/api/v1/cartitems/items', {
        product_id: productId,
        quantity,
        price_type: priceType,
      });
      return response.data as CartItem;
    });
  },

  async updateCartItem(
    itemId: number,
    quantity: number,
  ): Promise<{ data: CartItem | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.put(`/api/v1/cartitems/items/${itemId}`, { quantity });
      return response.data as CartItem;
    });
  },

  async removeFromCart(itemId: number): Promise<{ data: null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.delete(`/api/v1/cartitems/items/${itemId}`);
      return response.data;
    });
  },

  async clearCart(): Promise<{ data: null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.delete('/api/v1/cartitems/cart');
      return response.data;
    });
  },

  async getCartSummary(): Promise<{ data: CartSummary | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.get('/api/v1/cartitems/cart/summary');
      return response.data as CartSummary;
    });
  },

  // ─── Merge (guest → user) ────────────────────────────────────────────────

  async mergeGuestCart(sessionId: string): Promise<{ data: MergeResponse | null; error: any }> {
    return safeApiCall(async () => {
      const response = await api.post('/api/v1/cartitems/merge-guest-cart', {
        session_id: sessionId,
      });
      return response.data as MergeResponse;
    });
  },
};

export default cartService;
