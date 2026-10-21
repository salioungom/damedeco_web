'use client';

/**
 * @file /hooks/useOrderTracking.ts
 * @description Suivi des commandes en cours (non livrées).
 *
 * Les commandes proviennent de la requête partagée avec les statistiques et les
 * commandes récentes : aucune requête supplémentaire n'est émise pour ce bloc.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StatsService, type OrderTracking } from '@/services/stats.service';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';
import { useAuth } from '@/contexts/AuthContext';

export interface UseOrderTrackingResult {
  data: OrderTracking[];
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
}

export function useOrderTracking(): UseOrderTrackingResult {
  const [data, setData] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const load = useCallback(async (signal: AbortSignal) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const trackings = await StatsService.getOrderTrackings(userId, signal);
      if (signal.aborted) {
        return;
      }
      setData(trackings);
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
  }, [userId]);

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
