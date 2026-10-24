'use client';

/**
 * @file /hooks/useAccountFavorites.ts
 * @description Favoris du client : image, prix, disponibilité et quantité.
 *
 * Bloc indépendant : sa requête ne dépend pas de celle des commandes.
 *
 * Le résumé produit renvoyé par `/api/v1/favorites/` ne porte pas toujours
 * le prix d'origine (prix barré). Chaque favori est donc normalisé : le prix
 * d'origine est lu sous tous ses alias possibles puis publié sous les deux
 * noms utilisés par le front (`compare_price`, nom API, et `original_price`,
 * alias historique). S'il manque encore, il est complété depuis
 * `/api/v1/products/{id}` — la même source que la boutique — pour que le prix
 * barré, le badge de réduction et l'économie soient identiques des deux côtés.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { FavoriteService, type Favorite, type ProductInfo } from '@/services/favorite.service';
import { api, isCanceledRequest } from '@/lib/api';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';
import { readOriginalPrice } from '@/lib/pricing';
import type { Product } from '@/types/product';

export interface UseAccountFavoritesResult {
  data: Favorite[];
  loading: boolean;
  error: ApiError | null;
  retry: () => void;
}

/**
 * Publie le prix d'origine sous les deux noms lus par l'interface
 * (`compare_price` — nom API, `original_price` — alias historique).
 */
function withOriginalPrice(product: ProductInfo, originalPrice: number | null): ProductInfo {
  if (originalPrice === null) {
    return product;
  }
  return {
    ...product,
    compare_price: originalPrice,
    original_price: originalPrice,
  };
}

/** Normalise un favori : le prix d'origine garde toujours le même nom. */
function mapFavorite(favorite: Favorite): Favorite {
  return {
    ...favorite,
    product: withOriginalPrice(favorite.product, readOriginalPrice(favorite.product)),
  };
}

/**
 * Complète le prix d'origine manquant depuis l'API produits.
 * Un échec n'est pas bloquant : le favori reste affiché, sans prix barré.
 */
async function completeFavorite(favorite: Favorite, signal: AbortSignal): Promise<Favorite> {
  if (readOriginalPrice(favorite.product) !== null) {
    return favorite;
  }

  const productId = favorite.product?.id;
  if (!productId) {
    return favorite;
  }

  try {
    const response = await api.get<Product>(`/api/v1/products/${productId}`, {
      signal,
      params: { include: 'category' },
    });
    const originalPrice = readOriginalPrice(response.data);
    if (originalPrice === null) {
      return favorite;
    }
    return { ...favorite, product: withOriginalPrice(favorite.product, originalPrice) };
  } catch (err) {
    // Requête annulée : à propager pour que le chargement s'interrompe.
    if (isCanceledRequest(err)) {
      throw err;
    }
    return favorite;
  }
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
        const items = (favorites.items ?? []).map(mapFavorite);
        setData(items);

        // Le prix d'origine peut manquer dans le résumé des favoris : on le
        // complète depuis l'API produits, comme le fait la page /favorites.
        const completed = await Promise.all(
          items.map((item) => completeFavorite(item, signal)),
        );
        if (signal.aborted) {
          return;
        }
        setData(completed);
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
