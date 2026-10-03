import { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { getProducts } from '@/lib/api';
import { Product } from '@/lib/types';
import { CartItem } from '@/services/cart.service';

export interface CartItemWithProduct extends CartItem {
  product: Product | null;
}

const PRODUCTS_CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function getCartSignature(cart: CartItem[]): string {
  return cart.map((i) => `${i.product_id}:${i.quantity}`).sort().join('|');
}

let productsCache: Product[] | null = null;
let productsCacheTimestamp = 0;
let productsCachePromise: Promise<Product[]> | null = null;

function isProductsCacheValid(): boolean {
  if (!productsCache) return false;
  return Date.now() - productsCacheTimestamp < PRODUCTS_CACHE_MAX_AGE_MS;
}

function invalidateProductsCache() {
  productsCache = null;
  productsCacheTimestamp = 0;
  productsCachePromise = null;
}

async function fetchProducts(): Promise<Product[]> {
  if (productsCache && isProductsCacheValid()) return productsCache;
  if (productsCachePromise) return productsCachePromise;

  productsCachePromise = getProducts()
    .then((res) => {
      const items = res?.items || [];
      productsCache = items;
      productsCacheTimestamp = Date.now();
      productsCachePromise = null;
      return items;
    })
    .catch((err) => {
      productsCachePromise = null;
      throw err;
    });

  return productsCachePromise;
}

export function useCartWithProducts() {
  const cart = useStore((s) => s.cart);
  const cartLoading = useStore((s) => s.cartLoading);
  const [productsMap, setProductsMap] = useState<Map<string, Product>>(new Map());
  const [productsLoading, setProductsLoading] = useState(false);
  const cartSignatureRef = useRef('');

  const cartSignature = useMemo(() => getCartSignature(cart), [cart]);

  useEffect(() => {
    if (!cart || cart.length === 0) {
      setProductsMap(new Map());
      return;
    }

    const cartIds = new Set(cart.map((i) => i.product_id.toString()));
    const cachedIds = new Set(productsMap.keys());
    const allCached = [...cartIds].every((id) => cachedIds.has(id));

    if (allCached && cartSignature === cartSignatureRef.current) return;

    // All products already in local state + cache not expired → no re-fetch
    if (allCached && isProductsCacheValid()) {
      const map = new Map<string, Product>();
      for (const [id, product] of productsMap) {
        if (cartIds.has(id)) map.set(id, product);
      }
      setProductsMap(map);
      cartSignatureRef.current = cartSignature;
      return;
    }

    // All products in module cache but local map needs rebuild
    if (allCached && productsCache) {
      const map = new Map<string, Product>();
      for (const p of productsCache) {
        if (cartIds.has(p.id.toString())) map.set(p.id.toString(), p);
      }
      setProductsMap(map);
      cartSignatureRef.current = cartSignature;
      return;
    }

    let cancelled = false;

    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const products = await fetchProducts();
        if (cancelled) return;
        const map = new Map<string, Product>();
        for (const p of products) {
          if (cartIds.has(p.id.toString())) map.set(p.id.toString(), p);
        }
        setProductsMap(map);
        cartSignatureRef.current = cartSignature;
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    };

    loadProducts();
    return () => { cancelled = true; };
  }, [cart, cartSignature]);

  const cartWithProducts = useMemo<CartItemWithProduct[]>(() => {
    if (!cart || cart.length === 0) return [];
    return cart.map((item) => ({
      ...item,
      product: productsMap.get(item.product_id.toString()) || null,
    }));
  }, [cart, productsMap]);

  const isSyncingProducts = cart.length > 0 && cartWithProducts.length === 0 && productsLoading;

  return {
    cart: cartWithProducts,
    loading: cartLoading || productsLoading || isSyncingProducts,
    invalidateProductsCache,
  };
}
