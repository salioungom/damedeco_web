'use client';

/**
 * @file /hooks/useSafeApi.ts
 * @description Hook React pour les appels API « sûrs ».
 *
 * Ce module utilise `useState`/`useCallback`/`useEffect` : il doit être
 * marqué « use client ». Il est volontairement séparé de
 * `src/lib/error-handler.ts` (code pur, utilisable dans un Server Component)
 * afin que les services — importés par la page d'accueil rendue côté
 * serveur — ne créent pas de dépendance à React côté serveur.
 */

import { useState, useCallback, useEffect } from 'react';
import { safeApiCall, type ApiError } from '@/lib/error-handler';

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
    }, []);

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
