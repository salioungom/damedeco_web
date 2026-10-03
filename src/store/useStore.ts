import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, User } from '@/lib/types';
import { cartService, CartItem } from '@/services/cart.service';
import { FavoriteService } from '@/services/favorite.service';
import { toast } from 'sonner';
import { withRetry } from '@/lib/retry';
import { cartLog, cartWarn, cartError } from '@/lib/cart-logger';

// ─── Constants ───────────────────────────────────────────────────────────────

const CART_CACHE_MAX_AGE_MS = 15_000;       // 15s — cache validity for loadCart
const DEBOUNCE_MS = 500;                     // debounce for updateQuantity
const OFFLINE_QUEUE_KEY = 'cart_pending_actions';
const MAX_QTY = 999;
const MIN_QTY = 1;

// ─── Offline queue helpers ───────────────────────────────────────────────────

interface PendingAction {
  id: string;
  type: 'add' | 'update' | 'remove' | 'clear';
  productId?: number;
  itemId?: number;
  quantity?: number;
  priceType?: string;
  timestamp: number;
}

function getOfflineQueue(): PendingAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setOfflineQueue(queue: PendingAction[]) {
  if (typeof window === 'undefined') return;
  try {
    if (queue.length === 0) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    } else {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch { /* noop */ }
}

function enqueueOffline(action: Omit<PendingAction, 'id' | 'timestamp'>) {
  const queue = getOfflineQueue();
  queue.push({
    ...action,
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });
  setOfflineQueue(queue);
  cartLog('Offline action queued', action.type);
}

// ─── Debounce maps (module-level) ───────────────────────────────────────────

const qtyDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Dedup lock ──────────────────────────────────────────────────────────────

let loadCartPromise: Promise<void> | null = null;


// ─── Store ───────────────────────────────────────────────────────────────────

interface StoreState {
    cart: CartItem[];
    isCartOpen: boolean;
    user: User | null;
    favorites: string[];
    isAdmin: boolean;
    userType: 'retail' | 'wholesale';
    isDark: boolean;
    cartLoading: boolean;
    cartError: string | null;
    sessionId: string;
    lastLoadedAt: number;
    isLoaded: boolean;

    loadCart: (silent?: boolean) => Promise<void>;
    loadFavorites: () => Promise<void>;
    addToCart: (product: Product, quantity?: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    toggleCart: (isOpen?: boolean) => void;
    setUser: (user: User | null) => void;
    toggleFavorite: (productId: string) => Promise<void>;
    toggleAdmin: () => void;
    setUserType: (type: 'retail' | 'wholesale') => void;
    toggleTheme: () => void;
    syncCartWithAPI: () => Promise<void>;
    getSessionId: () => string;
    initGuestSession: () => Promise<void>;
    flushOfflineQueue: () => Promise<void>;
}

function isGuest(state: { user: User | null }): boolean {
    if (state.user) return false;
    // Also check for a stored token — if none, definitely a guest
    try {
        return !(typeof window !== 'undefined' &&
            (localStorage.getItem('accessToken') || localStorage.getItem('token')));
    } catch {
        return true;
    }
}

function isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
}

function cartIsCacheValid(state: { lastLoadedAt: number; isLoaded: boolean }): boolean {
    if (!state.isLoaded) return false;
    return Date.now() - state.lastLoadedAt < CART_CACHE_MAX_AGE_MS;
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            cart: [],
            isCartOpen: false,
            user: null,
            favorites: [],
            isAdmin: false,
            userType: 'retail',
            isDark: false,
            cartLoading: false,
            cartError: null,
            sessionId: '',
            lastLoadedAt: 0,
            isLoaded: false,

            // ─── Session Management ────────────────────────────────────────

            getSessionId: () => get().sessionId,

            initGuestSession: async () => {
                if (get().user) return;
                if (get().sessionId) return;

                const stored = typeof window !== 'undefined'
                    ? localStorage.getItem('guest_session_id')
                    : null;

                if (stored) {
                    set({ sessionId: stored });
                    cartLog('Guest session restored', stored.slice(0, 8) + '...');
                    return;
                }

                try {
                    const { data, error } = await cartService.initGuestSession();
                    if (data && !error) {
                        const sid = data.session_id;
                        set({ sessionId: sid });
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('guest_session_id', sid);
                        }
                        cartLog('Guest session initialized', sid.slice(0, 8) + '...');
                    } else {
                        cartError('Guest session init failed', String(error));
                    }
                } catch (err) {
                    cartError('Guest session init error', String(err));
                }
            },

            // ─── Cart Load (with dedup + cache) ───────────────────────────

            loadCart: async (silent = false) => {
                // Dedup: if a load is already in-flight, reuse it
                if (loadCartPromise && !silent) {
                    cartLog('Load deduped — reusing existing request');
                    return loadCartPromise;
                }

                // Cache: skip if data is recent
                if (silent && cartIsCacheValid(get())) {
                    return;
                }

                const doLoad = async () => {
                    if (!silent) set({ cartLoading: true, cartError: null });

                    try {
                        let result;
                        if (isGuest(get())) {
                            let sid = get().getSessionId();
                            if (!sid) await get().initGuestSession();
                            const sid2 = get().getSessionId();
                            if (!sid2) {
                                set({ cart: [], cartLoading: false, isLoaded: true, lastLoadedAt: Date.now() });
                                return;
                            }
                            result = await cartService.getGuestCart();
                        } else {
                            result = await cartService.getCart();
                        }

                        if (result.error) {
                            set({ cartError: 'Impossible de charger le panier', cartLoading: false });
                            cartWarn('Load failed', String(result.error));
                            return;
                        }

                        if (result.data) {
                            let cartItems: CartItem[] = result.data.items || [];

                            // Preserve order on silent sync
                            if (silent) {
                                const previousCart = get().cart;
                                if (previousCart.length > 0) {
                                    const orderMap = new Map(previousCart.map((item, idx) => [item.product_id, idx]));
                                    cartItems = [...cartItems].sort((a, b) => {
                                        const ia = orderMap.get(a.product_id);
                                        const ib = orderMap.get(b.product_id);
                                        if (ia === undefined) return 1;
                                        if (ib === undefined) return -1;
                                        return ia - ib;
                                    });
                                }
                            }

                            set({
                                cart: cartItems,
                                cartLoading: false,
                                isLoaded: true,
                                lastLoadedAt: Date.now(),
                            });

                            if (!silent) {
                                cartLog('Cart loaded', `${cartItems.length} item(s)`);
                            }
                        } else {
                            set({
                                cart: [],
                                cartLoading: false,
                                isLoaded: true,
                                lastLoadedAt: Date.now(),
                            });
                        }
                    } catch (error) {
                        console.error('Erreur lors du chargement du panier:', error);
                        set({ cartError: 'Erreur lors du chargement du panier', cartLoading: false });
                        cartError('Load exception', String(error));
                    }
                };

                if (!silent) {
                    loadCartPromise = doLoad().finally(() => {
                        loadCartPromise = null;
                    });
                    return loadCartPromise;
                }

                return doLoad();
            },

            // ─── Favorites ─────────────────────────────────────────────────

            loadFavorites: async () => {
                try {
                    const favoritesData = await FavoriteService.getUserFavorites(0, 100);
                    const favoriteIds = favoritesData.items.map(f => f.product_id.toString());
                    set({ favorites: favoriteIds });
                } catch (error) {
                    console.error('Erreur lors du chargement des favoris:', error);
                }
            },

            // ─── Add to Cart ──────────────────────────────────────────────

            addToCart: async (product, quantity = 1) => {
                set({ cartError: null });

                if (!isOnline()) {
                    enqueueOffline({ type: 'add', productId: Number(product.id), quantity, priceType: get().userType });
                    toast.info('Action enregistrée. Synchronisation dès la reconnexion.');
                    return;
                }

                try {
                    let result;
                    if (isGuest(get())) {
                        let sid = get().getSessionId();
                        if (!sid) { await get().initGuestSession(); sid = get().getSessionId(); }
                        if (!sid) {
                            set({ cartError: 'Impossible d\'initialiser la session invité' });
                            return;
                        }
                        result = await withRetry(() =>
                            cartService.addToGuestCart(Number(product.id), quantity, get().userType),
                            { label: 'addToCart' },
                        );
                    } else {
                        result = await withRetry(() =>
                            cartService.addToCart(Number(product.id), quantity, get().userType),
                            { label: 'addToCart' },
                        );
                    }

                    if (result.error) {
                        set({ cartError: 'Impossible d\'ajouter au panier' });
                        cartWarn('Add to cart failed', String(result.error));
                        return;
                    }

                    set({ lastLoadedAt: 0 }); // invalidate cache
                    await get().loadCart(true);
                    set({ isCartOpen: true });
                    cartLog('Added to cart', `product ${product.id} x${quantity}`);
                } catch (error) {
                    console.error('Erreur lors de l\'ajout au panier:', error);
                    set({ cartError: 'Impossible d\'ajouter au panier' });
                    cartError('Add to cart exception', String(error));
                }
            },

            // ─── Update Quantity (optimistic + debounce + rollback) ────────

            updateQuantity: async (productId, quantity) => {
                if (quantity === 0) {
                    await get().removeFromCart(productId);
                    return;
                }

                // Validation
                const clampedQty = Math.max(MIN_QTY, Math.min(MAX_QTY, Math.floor(quantity)));
                if (clampedQty !== quantity) {
                    cartWarn('Qty clamped', `${quantity} → ${clampedQty}`);
                }

                const currentCart = get().cart;
                const productIdNum = Number(productId);
                const cartItem = currentCart.find(item => item.product_id === productIdNum);

                if (!cartItem) {
                    set({ cartError: 'Article non trouvé dans le panier' });
                    return;
                }

                const previousCart = currentCart;

                // Optimistic update
                set({
                    cart: currentCart.map(item =>
                        item.product_id === productIdNum ? { ...item, quantity: clampedQty } : item
                    ),
                });

                // Debounce: clear previous timer for this product
                const existing = qtyDebounceTimers.get(productId);
                if (existing) clearTimeout(existing);

                const p = new Promise<void>((resolve) => {
                    const timer = setTimeout(async () => {
                        qtyDebounceTimers.delete(productId);

                        if (!isOnline()) {
                            enqueueOffline({ type: 'update', itemId: cartItem.id, productId: productIdNum, quantity: clampedQty });
                            toast.info('Action enregistrée. Synchronisation dès la reconnexion.');
                            resolve();
                            return;
                        }

                        try {
                            let result;
                            if (isGuest(get())) {
                                result = await withRetry(() =>
                                    cartService.updateGuestCartItem(cartItem.id, clampedQty),
                                    { label: `updateQty(${productId})` },
                                );
                            } else {
                                result = await withRetry(() =>
                                    cartService.updateCartItem(cartItem.id, clampedQty),
                                    { label: `updateQty(${productId})` },
                                );
                            }

                            if (result.error) {
                                set({ cart: previousCart });
                                set({ cartError: 'Erreur lors de la mise à jour du panier' });
                                cartWarn('Update qty failed — rollback', String(result.error));
                                resolve();
                                return;
                            }

                            set({ lastLoadedAt: 0 });
                            await get().loadCart(true);
                            cartLog('Qty updated', `product ${productId} → ${clampedQty}`);
                            resolve();
                        } catch (error) {
                            console.error('Erreur lors de la mise à jour du panier:', error);
                            set({ cart: previousCart });
                            set({ cartError: 'Erreur lors de la mise à jour du panier' });
                            cartError('Update qty exception — rollback', String(error));
                            resolve();
                        }
                    }, DEBOUNCE_MS);

                    qtyDebounceTimers.set(productId, timer);
                });

                return p;
            },

            // ─── Remove from Cart (optimistic + rollback) ─────────────────

            removeFromCart: async (productId: string) => {
                const currentCart = get().cart;
                const productIdNum = Number(productId);
                const cartItem = currentCart.find(item => item.product_id === productIdNum);

                if (!cartItem) {
                    set({ cartError: 'Article non trouvé dans le panier' });
                    return;
                }

                const previousCart = currentCart;

                set({
                    cart: currentCart.filter(item => item.product_id !== productIdNum),
                });

                if (!isOnline()) {
                    enqueueOffline({ type: 'remove', itemId: cartItem.id, productId: productIdNum });
                    toast.info('Action enregistrée. Synchronisation dès la reconnexion.');
                    return;
                }

                try {
                    let result;
                    if (isGuest(get())) {
                        result = await withRetry(() =>
                            cartService.removeGuestCartItem(cartItem.id),
                            { label: `removeItem(${productId})` },
                        );
                    } else {
                        result = await withRetry(() =>
                            cartService.removeFromCart(cartItem.id),
                            { label: `removeItem(${productId})` },
                        );
                    }

                    if (result.error) {
                        set({ cart: previousCart });
                        set({ cartError: 'Erreur lors de la suppression du panier' });
                        cartWarn('Remove failed — rollback', String(result.error));
                        return;
                    }

                    set({ lastLoadedAt: 0 });
                    await get().loadCart(true);
                    cartLog('Item removed', `product ${productId}`);
                } catch (error) {
                    console.error('Erreur lors de la suppression du panier:', error);
                    set({ cart: previousCart });
                    set({ cartError: 'Erreur lors de la suppression du panier' });
                    cartError('Remove exception — rollback', String(error));
                }
            },

            // ─── Clear Cart (optimistic + rollback) ───────────────────────

            clearCart: async () => {
                const previousCart = get().cart;
                set({ cart: [], cartError: null });

                if (!isOnline()) {
                    enqueueOffline({ type: 'clear' });
                    toast.info('Action enregistrée. Synchronisation dès la reconnexion.');
                    return;
                }

                try {
                    let result;
                    if (isGuest(get())) {
                        result = await withRetry(() => cartService.clearGuestCart(), { label: 'clearCart' });
                    } else {
                        result = await withRetry(() => cartService.clearCart(), { label: 'clearCart' });
                    }

                    if (result.error) {
                        set({ cart: previousCart });
                        set({ cartError: 'Impossible de vider le panier' });
                        cartWarn('Clear cart failed — rollback', String(result.error));
                        return;
                    }

                    cartLog('Cart cleared');
                } catch (error) {
                    console.error('Erreur lors du vidage du panier:', error);
                    set({ cart: previousCart });
                    set({ cartError: 'Impossible de vider le panier' });
                    cartError('Clear cart exception — rollback', String(error));
                }
            },

            // ─── Flush offline queue ───────────────────────────────────────

            flushOfflineQueue: async () => {
                const queue = getOfflineQueue();
                if (queue.length === 0) return;

                cartLog('Flushing offline queue', `${queue.length} action(s)`);
                const remaining: PendingAction[] = [];

                for (const action of queue) {
                    try {
                        if (action.type === 'add' && action.productId != null) {
                            const sid = get().getSessionId();
                            if (!sid) { remaining.push(action); continue; }
                            const result = await cartService.addToGuestCart(action.productId, action.quantity ?? 1, (action.priceType as any) ?? 'retail');
                            if (result.error) remaining.push(action);
                        } else if (action.type === 'update' && action.itemId != null && action.quantity != null) {
                            const sid = get().getSessionId();
                            if (!sid) { remaining.push(action); continue; }
                            const result = await cartService.updateGuestCartItem(action.itemId, action.quantity);
                            if (result.error) remaining.push(action);
                        } else if (action.type === 'remove' && action.itemId != null) {
                            const sid = get().getSessionId();
                            if (!sid) { remaining.push(action); continue; }
                            const result = await cartService.removeGuestCartItem(action.itemId);
                            if (result.error) remaining.push(action);
                        } else if (action.type === 'clear') {
                            const sid = get().getSessionId();
                            if (!sid) { remaining.push(action); continue; }
                            const result = await cartService.clearGuestCart();
                            if (result.error) remaining.push(action);
                        }
                    } catch {
                        remaining.push(action);
                    }
                }

                setOfflineQueue(remaining);

                if (remaining.length < queue.length) {
                    set({ lastLoadedAt: 0 });
                    await get().loadCart(true);
                    cartLog('Offline queue synced', `${queue.length - remaining.length} action(s) applied`);
                }
            },

            // ─── Sync ─────────────────────────────────────────────────────

            syncCartWithAPI: async () => {
                await get().loadCart();
            },

            // ─── UI ───────────────────────────────────────────────────────

            toggleCart: (isOpen) =>
                set((state) => ({
                    isCartOpen: typeof isOpen === 'boolean' ? isOpen : !state.isCartOpen,
                })),

            // ─── User Changes ─────────────────────────────────────────────

            setUser: (user) => {
                const previousUser = get().user;
                const userChanged = previousUser?.id !== user?.id;
                set({ user });
                if (user) {
                    if (userChanged) {
                        set({ cart: [], isLoaded: false, lastLoadedAt: 0 });
                        get().loadFavorites();
                    }
                } else if (previousUser && !user) {
                    set({ cart: [], favorites: [], cartError: null, sessionId: '', isLoaded: false, lastLoadedAt: 0 });
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('guest_session_id');
                    }
                    get().initGuestSession();
                    cartLog('User logged out — cart cleared, guest session reset');
                }
            },

            // ─── Favorites ─────────────────────────────────────────────────

            toggleFavorite: async (productId) => {
                const user = get().user;
                if (!user) {
                    toast.error('Connectez-vous pour gérer vos favoris');
                    return;
                }

                const productIdStr = productId.toString();
                const isFavorite = get().favorites.includes(productIdStr);
                const previousFavorites = get().favorites;

                // Optimistic update
                if (isFavorite) {
                    set({ favorites: previousFavorites.filter(id => id !== productIdStr) });
                } else {
                    set({ favorites: [...previousFavorites, productIdStr] });
                }

                try {
                    if (isFavorite) {
                        await FavoriteService.removeFavorite(Number(productId));
                    } else {
                        await FavoriteService.addFavorite(Number(productId));
                    }
                    await get().loadFavorites();
                } catch (error) {
                    // Rollback on error
                    set({ favorites: previousFavorites });
                    toast.error(isFavorite
                        ? 'Impossible de retirer des favoris'
                        : 'Impossible d\'ajouter aux favoris',
                    );
                }
            },

            toggleAdmin: () => set((state) => ({ isAdmin: !state.isAdmin })),
            setUserType: (type) => set({ userType: type }),
            toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
        }),
        {
            name: 'ecommerce-store',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAdmin: state.isAdmin,
                userType: state.userType,
                isDark: state.isDark,
            }),
        }
    )
);
