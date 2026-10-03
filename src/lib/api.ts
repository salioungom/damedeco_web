/**
 * @file /lib/api.ts
 * @description Instance Axios centralisée avec interceptors robustes
 * @version 2.0.0
 * @author DameDéco Team
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Product, Category, Order, Customer, DeliveryOption, PromoCodeValidation, PromoCodeRequest } from './types';
import type { DeliveryMode, PaymentMethod, ShippingAddress } from './delivery';
import { getCsrfHeader, CSRF_HEADER } from './csrf';

// Types pour les logs structurés
interface ApiLogData {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  error?: string;
  phase: 'request' | 'response' | 'error';
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
}

// Configuration de l'environnement avec fallback sécurisé
const getApiConfig = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  return {
    baseURL: apiUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
};

// Création de l'instance Axios
const createApiInstance = (): AxiosInstance => {
  const config = getApiConfig();
  
  const instance = axios.create(config);

  // Logger structuré pour le développement
  const log = (data: ApiLogData) => {
    if (process.env.NODE_ENV === 'development') {
      const { timestamp, method, url, status, duration, error, phase } = data;
      const emoji = phase === 'error' ? '❌' : phase === 'request' ? '📤' : '📥';
      
      console.log(
        `${emoji} API ${phase.toUpperCase()} ${timestamp} ${method} ${url}${status ? ` ${status}` : ''}${duration ? ` (${duration}ms)` : ''}`
      );
      
      if (error) {
        if (!status || status >= 500) {
          console.error(`   Error:`, error);
        } else {
          console.warn(`   Warning:`, error);
        }
      }
    }
  };

  // Interceptor de requête
  instance.interceptors.request.use(
    (config: any) => {
      const startTime = Date.now();
      
      // Ajout du timestamp pour tracking
      config.metadata = { startTime };
      
      // Gestion sécurisée du localStorage
      let token = null;
      if (typeof window !== 'undefined') {
        try {
          token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        } catch {
          // Silent fail
        }
      }

      // Ajout du header d'authentification si token présent
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // CSRF protection for state-changing requests
      const method = config.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && config.headers) {
        const csrfHeaders = getCsrfHeader();
        Object.assign(config.headers, csrfHeaders);
      }

      // Injection automatique du header X-Session-Id pour les routes guest
      if (config.url?.includes('/cartitems/guest')) {
        try {
          const sessionId = localStorage.getItem('guest_session_id');
          if (sessionId && config.headers) {
            config.headers['X-Session-Id'] = sessionId;
          }
        } catch { /* noop */ }
      }

      // Log de la requête
      log({
        timestamp: new Date().toISOString(),
        method: config.method?.toUpperCase() || 'UNKNOWN',
        url: config.url || 'unknown',
        phase: 'request',
      });

      return config;
    },
    (error) => {
      log({
        timestamp: new Date().toISOString(),
        method: 'UNKNOWN',
        url: 'unknown',
        error: error.message,
        phase: 'error',
      });
      return Promise.reject(error);
    }
  );

  // ─── Refresh token state (module-level, shared across all instances) ───
  let isRefreshing = false;
  let refreshAttempts = 0;
  let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

  const REFRESH_MAX_ATTEMPTS = 3;
  const REFRESH_BACKOFF_MS = [5000, 15000, 45000];

  const EXCLUDED_REFRESH_URLS = ['/auth/login', '/auth/refresh', '/auth/verify-otp'];

  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token!);
    });
    failedQueue = [];
  };

  const forceLogout = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } catch { /* noop */ }
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const attemptRefresh = async (): Promise<string | null> => {
    const refreshResponse = await axios.post(
      getApiConfig().baseURL + '/api/v1/auth/refresh',
      {},
      { withCredentials: true }
    );
    return refreshResponse.data.access_token || refreshResponse.data.accessToken || null;
  };

  // Interceptor de réponse
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const startTime = (response.config as any)?.metadata?.startTime;
      const duration = startTime ? Date.now() - startTime : undefined;

      log({
        timestamp: new Date().toISOString(),
        method: response.config.method?.toUpperCase() || 'UNKNOWN',
        url: response.config.url || 'unknown',
        status: response.status,
        duration,
        phase: 'response',
      });

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;
      const startTime = originalRequest?.metadata?.startTime;
      const duration = startTime ? Date.now() - startTime : undefined;
      const status = error.response?.status;

      // ─── 401 → Refresh → Retry (with mutex + max attempts) ──────────
      // Only attempt refresh if there's actually a token to refresh.
      // A 401 without any token means the user simply isn't logged in — not an error.
      const hasToken = (() => {
        try {
          return !!(typeof window !== 'undefined' &&
            (localStorage.getItem('accessToken') || localStorage.getItem('token')));
        } catch { return false; }
      })();

      if (
        status === 401 &&
        hasToken &&
        originalRequest &&
        !originalRequest._retry &&
        !EXCLUDED_REFRESH_URLS.some((u) => originalRequest.url?.includes(u))
      ) {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          });
        }

        if (refreshAttempts >= REFRESH_MAX_ATTEMPTS) {
          forceLogout();
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await attemptRefresh();
          refreshAttempts = 0;

          if (newToken) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', newToken);
            }
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }

          processQueue(new Error('No token in refresh response'), null);
          forceLogout();
        } catch (refreshError: any) {
          const refreshStatus = refreshError?.response?.status;

          // 429 → backoff + single retry
          if (refreshStatus === 429) {
            const retryAfter = refreshError.response.headers?.['retry-after'];
            const delayMs = retryAfter
              ? parseInt(retryAfter, 10) * 1000
              : REFRESH_BACKOFF_MS[Math.min(refreshAttempts, REFRESH_BACKOFF_MS.length - 1)];
            refreshAttempts++;

            processQueue(new Error('Trop de requêtes. Veuillez réessayer dans quelques minutes.'), null);

            if (refreshAttempts < REFRESH_MAX_ATTEMPTS) {
              await sleep(delayMs);
              try {
                const retryToken = await attemptRefresh();
                refreshAttempts = 0;
                if (retryToken) {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', retryToken);
                  }
                  processQueue(null, retryToken);
                  originalRequest.headers.Authorization = `Bearer ${retryToken}`;
                  return instance(originalRequest);
                }
              } catch {
                // Retry also failed
              }
            }
            forceLogout();
          }

          // 401/422 → refresh token is dead, logout immediately
          if (refreshStatus === 401 || refreshStatus === 422) {
            refreshAttempts = REFRESH_MAX_ATTEMPTS;
            processQueue(refreshError, null);
            forceLogout();
          }

          // Network error → queue rejects but don't logout
          if (!refreshStatus) {
            processQueue(refreshError, null);
          }
        } finally {
          isRefreshing = false;
        }
      }

      // ─── Structured error logging ─────────────────────────────────────
      let errorMessage = 'Erreur inconnue';
      let statusCode = 0;

      if (error.response) {
        statusCode = error.response.status;
        const responseData = error.response.data as any;

        if (statusCode === 429) {
          errorMessage = 'Trop de requêtes. Veuillez réessayer dans quelques minutes.';
        } else if (Array.isArray(responseData)) {
          errorMessage = responseData.map((err) => err?.msg || err?.message || JSON.stringify(err)).join(', ');
        } else if (typeof responseData === 'object') {
          if (Array.isArray(responseData?.detail)) {
            errorMessage = responseData.detail.map((err: any) => err?.msg || err?.message || JSON.stringify(err)).join(', ');
          } else {
            errorMessage =
              responseData?.detail ||
              responseData?.message ||
              responseData?.error ||
              responseData?.non_field_errors?.join(', ') ||
              JSON.stringify(responseData);
          }
        } else {
          errorMessage = String(responseData) || `HTTP ${statusCode}`;
        }

        log({
          timestamp: new Date().toISOString(),
          method: error.config?.method?.toUpperCase() || 'UNKNOWN',
          url: error.config?.url || 'unknown',
          status: statusCode,
          duration,
          error: errorMessage,
          phase: 'error',
        });
      } else if (error.request) {
        errorMessage = 'Aucune réponse du serveur (réseau/timeout)';
        statusCode = 0;

        log({
          timestamp: new Date().toISOString(),
          method: error.config?.method?.toUpperCase() || 'UNKNOWN',
          url: error.config?.url || 'unknown',
          error: errorMessage,
          phase: 'error',
        });
      } else {
        errorMessage = error.message || 'Erreur de configuration';

        log({
          timestamp: new Date().toISOString(),
          method: error.config?.method?.toUpperCase() || 'UNKNOWN',
          url: error.config?.url || 'unknown',
          error: errorMessage,
          phase: 'error',
        });
      }

      const structuredError = new Error(errorMessage) as any;
      structuredError.status = statusCode;
      structuredError.code = error.code;
      structuredError.config = error.config;
      structuredError.response = error.response;

      return Promise.reject(structuredError);
    }
  );

  return instance;
};

// Export de l'instance
export const api = createApiInstance();

// Export des utilitaires
export const apiUtils = {
  // Vérification de l'URL de l'API
  getApiUrl: () => getApiConfig().baseURL,
  
  // Vérification de la disponibilité de l'API
  checkApiHealth: async () => {
    try {
      const response = await api.get('/health', { timeout: 5000 });
      return { available: true, status: response.status };
    } catch (error) {
      return { available: false, error };
    }
  },

  // Gestion des erreurs standardisée
  handleApiError: (error: any): string => {
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Erreur lors de la communication avec le serveur';
  },

  // Extraction du message d'erreur pour l'UI
  getErrorMessage: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'Erreur inconnue';
  }
};

// Export des types
export type { ApiResponse, ApiLogData };

export const getProducts = async (params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    search?: string;
}): Promise<{ items: Product[]; total: number; page: number; pages: number }> => {
    const response = await api.get<{ items: Product[]; total: number; page: number; pages: number }>('/api/v1/products/', { params });
    return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/api/v1/products/${id}`);
    return response.data;
};

export const getProductBySlug = async (slug: string): Promise<Product> => {
    const response = await api.get<Product>(`/api/v1/products/${slug}`);
    return response.data;
};

export const getProductStock = async (id: string): Promise<{
    product_id: string;
    inventory_quantity: number;
    track_inventory: boolean;
    stock_status: 'in_stock' | 'out_of_stock' | 'low_stock';
    reserved_quantity: number;
    available_quantity: number;
}> => {
    const response = await api.get(`/api/v1/products/${id}/stock`);
    return response.data;
};

export const searchProducts = async (query: string, params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get<{ products: Product[]; total: number; page: number; totalPages: number }>('/api/v1/products/search', { 
        params: { q: query, ...params } 
    });
    return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/api/v1/categories/');
    return response.data;
};

export const getCategoryById = async (id: string): Promise<Category> => {
    const response = await api.get<Category>(`/api/v1/categories/${id}`);
    return response.data;
};

// Orders API - Nouvelle version selon documentation API v1
export const getOrders = async (page = 0, limit = 20, status?: string): Promise<Order[]> => {
    const params = new URLSearchParams({
        skip: (page * limit).toString(),
        limit: limit.toString()
    });
    
    if (status) {
        params.append('status', status);
    }
    
    const response = await api.get<Order[]>(`/api/v1/orders/?${params}`);
    return response.data;
};

/** Commandes — endpoint admin (toutes les commandes) */
export const getAdminOrders = async (page = 0, limit = 50, status?: string): Promise<Order[]> => {
    const params = new URLSearchParams({
        skip: (page * limit).toString(),
        limit: limit.toString(),
    });
    if (status) {
        params.append('status', status);
    }
    const response = await api.get<Order[]>(`/api/v1/orders/admin?${params}`);
    return response.data;
};

export const getOrderById = async (id: string | number): Promise<Order> => {
    const response = await api.get<Order>(`/api/v1/orders/${id}`);
    return response.data;
};

export const createOrder = async (orderData: {
    items: {
        product_id: string | number;
        quantity: number;
        unit_price: number;
    }[];
    mode: DeliveryMode;
    shipping_address?: ShippingAddress;
    currency?: string;
    payment_method?: PaymentMethod;
    order_type?: string;
    payment_phone?: string;
}): Promise<Order> => {
    const response = await api.post<Order>('/api/v1/orders/', orderData);
    return response.data;
};

export const cancelOrder = async (id: string | number): Promise<Order> => {
    const response = await api.post<Order>(`/api/v1/orders/${id}/cancel`);
    return response.data;
};

/** Action client dédiée : confirmation de réception d'une commande livrée. */
export const confirmOrderDelivery = async (id: string | number): Promise<Order> => {
    const response = await api.post<Order>(`/api/v1/orders/${id}/confirm-delivery`);
    return response.data;
};

export const updateOrderStatus = async (
    id: string | number,
    status: string,
    notes?: string
): Promise<Order> => {
    const response = await api.patch<Order>(`/api/v1/orders/${id}/status`, { status, notes });
    return response.data;
};

export const updateOrderDelivery = async (
    id: string | number,
    payload: {
        mode: 'home_delivery' | 'store_pickup';
        shipping_address?: {
            first_name?: string;
            last_name?: string;
            full_name?: string;
            email?: string;
            phone?: string;
            city?: string;
            address?: string;
            instructions?: string;
        };
    }
): Promise<Order> => {
    const response = await api.patch<Order>(`/api/v1/orders/${id}/delivery`, payload);
    return response.data;
};

export const getOrderPayments = async (id: string | number): Promise<any[]> => {
    const response = await api.get<any[]>(`/api/v1/orders/${id}/payments`);
    return response.data;
};

// Cart API — see @/services/cart.service.ts for guest/authenticated cart operations

// Delivery Options API
export const getDeliveryOptions = async (): Promise<DeliveryOption[]> => {
    const response = await api.get<DeliveryOption[]>('/api/v1/delivery-rules/delivery-options/');
    return response.data;
};

// Promo Code API
export const validatePromoCode = async (request: PromoCodeRequest): Promise<PromoCodeValidation> => {
    const response = await api.post<PromoCodeValidation>('/api/v1/promo-codes/validate', request);
    return response.data;
};

export default api;
