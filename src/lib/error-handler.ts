import axios, { AxiosError } from 'axios';
import { useState, useCallback, useEffect } from 'react';

// Enhanced error types for better type safety
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isServerError?: boolean;
  isClientError?: boolean;
}

// Safe error handling utility
export class ApiErrorHandler {
  static isAxiosError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
  }

  static extractErrorMessage(error: unknown): string {
    if (this.isAxiosError(error)) {
      // Server responded with error
      if (error.response) {
        const data = error.response.data as any;
        return (
          data?.detail ||
          data?.message ||
          data?.error ||
          `Server error (${error.response.status})`
        );
      }
      
      // Request was made but no response received
      if (error.request) {
        if (error.code === 'ECONNABORTED') {
          return 'La requête a expiré. Veuillez réessayer.';
        }
        return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      
      // Network or configuration error
      return error.message || 'Erreur de configuration de la requête';
    }

    // Non-Axios errors
    if (error instanceof Error) {
      return error.message;
    }

    return 'Une erreur inattendue est survenue.';
  }

  static classifyError(error: unknown): ApiError {
    const message = this.extractErrorMessage(error);
    
    if (this.isAxiosError(error)) {
      const apiError: ApiError = {
        message,
        code: error.code,
        details: error.response?.data,
      };

      if (error.response) {
        apiError.status = error.response.status;
        apiError.isServerError = error.response.status >= 500;
        apiError.isClientError = error.response.status >= 400 && error.response.status < 500;
      } else {
        apiError.isNetworkError = true;
        apiError.isTimeout = error.code === 'ECONNABORTED';
      }

      return apiError;
    }

    // Non-Axios errors: extract .status / .code if present
    // (api.ts interceptor adds them on the structured Error it rethrows).
    const maybeStatus = (error as any)?.status;
    const maybeCode = (error as any)?.code;
    const is4xx = typeof maybeStatus === 'number' && maybeStatus >= 400 && maybeStatus < 500;
    const is5xx = typeof maybeStatus === 'number' && maybeStatus >= 500;
    const code = typeof maybeCode === 'string' ? maybeCode : undefined;

    return {
      message,
      status: maybeStatus,
      code,
      isNetworkError:
        code === 'ERR_NETWORK' || code === 'NETWORK_ERROR' || code === 'ECONNABORTED',
      isTimeout: code === 'ECONNABORTED',
      isServerError: is5xx,
      isClientError: is4xx,
    };
  }

  static shouldRetry(error: unknown): boolean {
    const apiError = this.classifyError(error);
    
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      apiError.isNetworkError === true ||
      apiError.isTimeout === true ||
      (apiError.isServerError === true && (apiError.status || 0) >= 500)
    );
  }

  static isAuthError(error: unknown): boolean {
    if (this.isAxiosError(error)) {
      return error.response?.status === 401 || error.response?.status === 403;
    }
    // api.ts interceptor adds .status to plain Error objects
    const s = (error as any)?.status;
    return s === 401 || s === 403;
  }

  /**
   * Message d'erreur dédié au parcours commande & paiement.
   * - 403 / 404 → messages distincts imposés par l'UI.
   * - timeout / réseau → « résultat inconnu » : on invite à vérifier le statut
   *   réel de la commande côté backend avant de relancer. Aucune retentative
   *   automatique d'un paiement n'est effectuée.
   *
   * @param phase 'load' (lecture commande) | 'create' | 'pay' | 'check' (vérification).
   */
  static getOrderError(error: unknown, phase: 'load' | 'create' | 'pay' | 'check' = 'check'): string {
    const classified = this.classifyError(error);

    if (classified.status === 403) {
      return "Vous n'avez pas accès à cette commande.";
    }
    if (classified.status === 404) {
      return 'Commande introuvable.';
    }

    if (classified.isTimeout || classified.isNetworkError) {
      switch (phase) {
        case 'pay':
          return 'La demande de paiement est restée sans réponse : le résultat est inconnu. '
            + 'Vérifiez le statut de votre commande dans vos commandes avant de retenter.';
        case 'create':
          return 'La création de commande est restée sans réponse : vérifiez dans vos commandes '
            + "si elle a bien été enregistrée avant de réessayer.";
        case 'load':
          return "Impossible de charger la commande : le serveur n'a pas répondu. "
            + 'Vérifiez votre connexion puis réessayez.';
        default:
          return 'La vérification est restée sans réponse : le résultat du paiement est inconnu. '
            + 'Vérifiez le statut de votre commande dans vos commandes.';
      }
    }

    return classified.message || 'Une erreur est survenue. Veuillez réessayer.';
  }
}

// Safe API wrapper with error handling
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    customErrorHandler?: (error: unknown) => string;
    retryCount?: number;
    retryDelay?: number;
  }
): Promise<{ data: T | null; error: ApiError | null }> {
  const { customErrorHandler, retryCount = 0, retryDelay = 1000 } = options || {};
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const data = await apiCall();
      return { data, error: null };
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) or auth errors
      if (ApiErrorHandler.isAuthError(error) || ApiErrorHandler.classifyError(error).isClientError) {
        break;
      }
      
      // Retry logic
      if (attempt < retryCount && ApiErrorHandler.shouldRetry(error)) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        continue;
      }
      
      break;
    }
  }

  const apiError = ApiErrorHandler.classifyError(lastError);
  
  // Apply custom error handler if provided
  if (customErrorHandler) {
    apiError.message = customErrorHandler(lastError);
  }

  // Auth errors are returned to callers — they decide how to handle navigation/tokens
  return { data: null, error: apiError };
}

// React hook for safe API calls
export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function createSafeApiHook<T>(
  apiCall: () => Promise<T>,
  options?: {
    customErrorHandler?: (error: unknown) => string;
    retryCount?: number;
    retryDelay?: number;
    immediate?: boolean;
  }
) {
  return function useSafeApi(): UseApiState<T> {
    const [state, setState] = useState<{
      data: T | null;
      loading: boolean;
      error: ApiError | null;
    }>({
      data: null,
      loading: options?.immediate !== false,
      error: null,
    });

    const execute = useCallback(async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await safeApiCall(apiCall, options);
      
      setState({
        data: result.data,
        loading: false,
        error: result.error,
      });
    }, [apiCall]);

    useEffect(() => {
      if (options?.immediate !== false) {
        execute();
      }
    }, [execute]);

    return {
      ...state,
      refetch: execute,
    };
  };
}

// Export utilities for backward compatibility
export const handleApiError = ApiErrorHandler.extractErrorMessage;
export const isAxiosError = ApiErrorHandler.isAxiosError;
