'use client';

/**
 * @file /hooks/useRecentOrders.ts
 * @description Commandes récentes du client (les plus récentes d'abord).
 *
 * Les commandes proviennent de la requête partagée avec les statistiques et le
 * suivi : aucune requête supplémentaire n'est émise pour ce bloc.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StatsService, type RecentOrder } from '@/services/stats.service';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';
import { useAuth } from '@/contexts/AuthContext';

export interface UseRecentOrdersResult {
  data: RecentOrder[];
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
}

export function useRecentOrders(limit = 3): UseRecentOrdersResult {
  const [data, setData] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const orders = await StatsService.getRecentOrders(userId, limit, signal);
        if (signal.aborted) {
          return;
        }
        setData(orders);
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
    [limit, userId],
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
