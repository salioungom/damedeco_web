'use client';

/**
 * @file /hooks/useRecommendations.ts
 * @description Produits recommandés pour l'espace client.
 *
 * La source est l'API produits existante (`/api/v1/products/?is_featured=true`).
 * L'endpoint dédié `/api/v1/products/recommended` et le jeu de données de
 * secours seront branchés à l'étape suivante (services + mocks de
 * développement) ; ce hook consomme déjà l'API, sans aucune donnée factice.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { productService } from '@/services/product.service';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';
import { isCanceledRequest } from '@/lib/api';
import type { Product } from '@/types/product';

export interface UseRecommendationsResult {
  data: Product[];
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
}

export function useRecommendations(limit = 8): UseRecommendationsResult {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const result = await productService.getProducts({ limit, is_featured: true }, signal);
        if (signal.aborted) {
          return;
        }
        if (result.error) {
          setData([]);
          setError(ApiErrorHandler.classifyError(result.error));
          return;
        }
        setData(result.data?.items ?? []);
      } catch (err) {
        // Requête annulée (démontage, remontage) : ce n'est pas une panne.
        if (signal.aborted || isCanceledRequest(err)) {
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
