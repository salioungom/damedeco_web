import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mock modules (hoisted by vitest) ────────────────────────────────────────

vi.mock('@/services/cart.service', () => ({
  cartService: {
    initGuestSession: vi.fn(),
    getGuestCart: vi.fn(),
    addToGuestCart: vi.fn(),
    updateGuestCartItem: vi.fn(),
    removeGuestCartItem: vi.fn(),
    clearGuestCart: vi.fn(),
    getCart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    mergeGuestCart: vi.fn(),
  },
}));

vi.mock('@/services/favorite.service', () => ({
  FavoriteService: { getUserFavorites: vi.fn().mockResolvedValue({ items: [] }) },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

vi.mock('@/lib/retry', () => ({
  withRetry: vi.fn((fn: () => Promise<any>) => fn()),
}));

vi.mock('@/lib/cart-logger', () => ({
  cartLog: vi.fn(),
  cartWarn: vi.fn(),
  cartError: vi.fn(),
  setCartLogging: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getProducts: vi.fn(),
}));

// ─── Import AFTER mocks ─────────────────────────────────────────────────────

import { useCartWithProducts } from '../useCartWithProducts';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api';
import type { CartItem } from '@/services/cart.service';
import type { Product } from '@/lib/types';

const api = vi.mocked(getProducts);

const makeCartItem = (productId: number, quantity = 1): CartItem => ({
  id: productId,
  product_id: productId,
  quantity,
  unit_price: '5000',
  price_type: 'retail',
  created_at: '',
  updated_at: '',
});

const makeProduct = (id: number): Product =>
  ({ id: String(id), name: `Produit ${id}` }) as unknown as Product;

// Le cache produits du hook est à portée module : il doit repartir vide entre
// chaque cas, sinon le catalogue du cas précédent est réutilisé et aucun
// `getProducts` n'est rejoué. Le hook expose l'invalidation ; la référence est
// mémorisée à chaque montage puis appliquée au `beforeEach` suivant. Elle n'est
// volontairement pas effacée en `afterEach`, sinon le `beforeEach` n'aurait plus
// rien à invalider.
let invalidateProductsCache: (() => void) | undefined;

function mount() {
  const view = renderHook(() => useCartWithProducts());
  invalidateProductsCache = view.result.current.invalidateProductsCache;
  return view;
}

const setCart = (items: CartItem[]) =>
  act(() => {
    useStore.setState({ cart: items, cartLoading: false, cartError: null });
  });

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useCartWithProducts', () => {
  beforeEach(() => {
    useStore.setState({
      cart: [],
      cartLoading: false,
      cartError: null,
      isCartOpen: false,
      isLoaded: false,
      lastLoadedAt: 0,
    });
    api.mockReset();
    api.mockResolvedValue({ items: [] } as never);
    act(() => {
      invalidateProductsCache?.();
    });
  });

  // Régression du chantier ESLint : `productsMap` avait été ajouté aux dépendances
  // de l'effet de synchronisation. La branche panier vide y publie une nouvelle
  // `Map` à chaque passe, ce qui re-déclenchait l'effet indéfiniment.
  it('Cas A — panier vide : aucun setState en boucle, le hook se stabilise', async () => {
    let renders = 0;
    const { result, rerender } = renderHook(() => {
      renders++;
      return useCartWithProducts();
    });
    invalidateProductsCache = result.current.invalidateProductsCache;

    expect(renders).toBe(1);
    await flush();

    // Si l'effet se re-déclenchait, `renders` continuerait de croître tout seul.
    expect(renders).toBe(1);
    expect(result.current.cart).toEqual([]);
    expect(api).not.toHaveBeenCalled();

    // Un re-render externe ne doit déclencher aucun render supplémentaire.
    rerender();
    await flush();
    expect(renders).toBe(2);
    expect(result.current.cart).toEqual([]);
  });

  it('Cas A bis — panier vidé après un panier rempli : vidage puis stabilité', async () => {
    api.mockResolvedValue({ items: [makeProduct(10)] } as never);
    setCart([makeCartItem(10)]);

    const { result, rerender } = mount();
    await waitFor(() => {
      expect(result.current.cart[0]?.product?.id).toBe('10');
    });

    setCart([]);
    await waitFor(() => {
      expect(result.current.cart).toEqual([]);
    });
    await flush();

    let renders = 0;
    rerender();
    renders++;
    await flush();

    expect(result.current.cart).toEqual([]);
    expect(renders).toBe(1);
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('Cas B — panier rempli : les produits sont associés aux lignes', async () => {
    api.mockResolvedValue({ items: [makeProduct(10), makeProduct(20)] } as never);
    setCart([makeCartItem(10, 2), makeCartItem(20)]);

    const { result } = mount();

    await waitFor(() => {
      expect(result.current.cart[0]?.product?.id).toBe('10');
      expect(result.current.cart[1]?.product?.id).toBe('20');
    });

    expect(result.current.cart).toHaveLength(2);
    expect(result.current.cart[0]).toMatchObject({
      product_id: 10,
      quantity: 2,
      product: { id: '10', name: 'Produit 10' },
    });
    expect(result.current.cart[1]).toMatchObject({
      product_id: 20,
      product: { id: '20', name: 'Produit 20' },
    });
    expect(result.current.loading).toBe(false);
  });

  it('Cas C — changement du panier : productsMap recalculé pour la nouvelle ligne', async () => {
    api.mockResolvedValue({ items: [makeProduct(10), makeProduct(20)] } as never);
    setCart([makeCartItem(10)]);

    const { result } = mount();
    await waitFor(() => {
      expect(result.current.cart[0]?.product?.id).toBe('10');
    });

    setCart([makeCartItem(10), makeCartItem(20)]);

    await waitFor(() => {
      expect(result.current.cart[1]?.product?.id).toBe('20');
    });
    expect(result.current.cart).toHaveLength(2);
    expect(result.current.cart[0]?.product?.id).toBe('10');
    expect(api).toHaveBeenCalledTimes(1);
  });

  it('Cas D — panier inchangé : aucune cascade de setState ni re-fetch', async () => {
    api.mockResolvedValue({ items: [makeProduct(10)] } as never);
    setCart([makeCartItem(10)]);

    let renders = 0;
    const view = renderHook(() => {
      renders++;
      return useCartWithProducts();
    });
    invalidateProductsCache = view.result.current.invalidateProductsCache;
    const { result, rerender } = view;

    await waitFor(() => {
      expect(result.current.cart[0]?.product?.id).toBe('10');
    });
    const settledRenders = renders;
    const settledCart = result.current.cart;

    rerender();
    rerender();
    await flush();

    // Les re-renders manuels ne doivent déclencher aucun setState supplémentaire :
    // le compteur ne doit croître que du nombre de `rerender()` explicites.
    expect(renders).toBe(settledRenders + 2);
    expect(result.current.cart).toBe(settledCart);
    expect(api).toHaveBeenCalledTimes(1);
  });
});
