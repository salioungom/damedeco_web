'use client';

/**
 * @file /hooks/useAccountStats.ts
 * @description Statistiques de l'espace client (commandes, total dépensé,
 * commandes en cours, favoris).
 *
 * Le hook est autonome : une erreur sur ce bloc n'affecte aucun autre bloc du
 * tableau de bord. La requête des commandes est partagée avec les autres blocs
 * via `StatsService.getCustomerOrdersFeed` (une seule requête HTTP).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StatsService, type AccountStats } from '@/services/stats.service';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';
import { useAuth } from '@/contexts/AuthContext';

export interface UseAccountStatsResult {
  data: AccountStats | null;
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
}

export function useAccountStats(): UseAccountStatsResult {
  const [data, setData] = useState<AccountStats | null>(null);
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
      const stats = await StatsService.getAccountStats(userId, 100, signal);
      if (signal.aborted) {
        return;
      }
      setData(stats);
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      setData(null);
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
