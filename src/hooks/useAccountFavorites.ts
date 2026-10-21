'use client';

/**
 * @file /hooks/useAccountFavorites.ts
 * @description Favoris du client : image, prix, disponibilité et quantité.
 *
 * Bloc indépendant : sa requête ne dépend pas de celle des commandes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FavoriteService, type Favorite } from '@/services/favorite.service';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';

export interface UseAccountFavoritesResult {
  data: Favorite[];
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
}

export function useAccountFavorites(limit = 12): UseAccountFavoritesResult {
  const [data, setData] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const favorites = await FavoriteService.getUserFavorites(0, limit, signal);
        if (signal.aborted) {
          return;
        }
        setData(favorites.items ?? []);
      } catch (err) {
        if (signal.aborted) {
          return;
        }
        setData([]);
        setError(ApiErrorHandler.classifyError(err));
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [limit],
  );

  const retry = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    void load(controller.signal);
  }, [load]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { data, loading, error, retry };
}
