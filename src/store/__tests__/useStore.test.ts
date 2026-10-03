import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// ─── Import AFTER mocks ─────────────────────────────────────────────────────

import { useStore } from '../useStore';
import { cartService, type CartItem } from '@/services/cart.service';

const svc = vi.mocked(cartService);

const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 1,
  product_id: 10,
  quantity: 1,
  unit_price: '5000',
  price_type: 'retail',
  created_at: '',
  updated_at: '',
  ...overrides,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resetStore() {
  useStore.setState({
    cart: [],
    user: null,
    sessionId: '',
    lastLoadedAt: 0,
    isLoaded: false,
    cartLoading: false,
    cartError: null,
    isCartOpen: false,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useStore — Guest session', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('initGuestSession calls POST /guest/init and stores session_id', async () => {
    svc.initGuestSession.mockResolvedValue({
      data: { session_id: 'test-uuid-123' },
      error: null,
    });

    await useStore.getState().initGuestSession();

    expect(svc.initGuestSession).toHaveBeenCalled();
    expect(useStore.getState().sessionId).toBe('test-uuid-123');
  });

  it('initGuestSession skips if user is logged in', async () => {
    useStore.setState({ user: { id: '1', name: 'Test', email: '', role: 'client', type: 'retail' } as any });

    await useStore.getState().initGuestSession();

    expect(svc.initGuestSession).not.toHaveBeenCalled();
  });

  it('initGuestSession skips if sessionId already exists', async () => {
    useStore.setState({ sessionId: 'existing-id' });

    await useStore.getState().initGuestSession();

    expect(svc.initGuestSession).not.toHaveBeenCalled();
  });
});

describe('useStore — loadCart', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('loads guest cart when not authenticated', async () => {
    useStore.setState({ sessionId: 'guest-123' });
    svc.getGuestCart.mockResolvedValue({
      data: { items: [makeCartItem({ quantity: 2 })], total_items: 1, total_unique_products: 1 },
      error: null,
    });

    await useStore.getState().loadCart();

    expect(svc.getGuestCart).toHaveBeenCalled();
    expect(useStore.getState().cart).toHaveLength(1);
    expect(useStore.getState().isLoaded).toBe(true);
  });

  it('loads authenticated cart when user is set', async () => {
    useStore.setState({ user: { id: '1', name: 'Test', email: '', role: 'client', type: 'retail' } as any });
    svc.getCart.mockResolvedValue({
      data: { items: [], total_items: 0, total_unique_products: 0 },
      error: null,
    });

    await useStore.getState().loadCart();

    expect(svc.getCart).toHaveBeenCalled();
    expect(svc.getGuestCart).not.toHaveBeenCalled();
  });

  it('skips load when cache is valid and silent=true', async () => {
    useStore.setState({
      isLoaded: true,
      lastLoadedAt: Date.now(),
      sessionId: 'guest-123',
    });

    await useStore.getState().loadCart(true);

    expect(svc.getGuestCart).not.toHaveBeenCalled();
  });
});

describe('useStore — addToCart', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('adds to guest cart when not authenticated', async () => {
    useStore.setState({ sessionId: 'guest-123' });
    svc.addToGuestCart.mockResolvedValue({ data: makeCartItem(), error: null });
    svc.getGuestCart.mockResolvedValue({
      data: { items: [makeCartItem()], total_items: 1, total_unique_products: 1 },
      error: null,
    });

    await useStore.getState().addToCart({ id: 10, name: 'Test', price: 5000 } as any, 1);

    expect(svc.addToGuestCart).toHaveBeenCalledWith(10, 1, 'retail');
    expect(useStore.getState().isCartOpen).toBe(true);
  });

  it('adds to user cart when authenticated', async () => {
    useStore.setState({ user: { id: '1', name: 'Test', email: '', role: 'client', type: 'retail' } as any });
    svc.addToCart.mockResolvedValue({ data: makeCartItem(), error: null });
    svc.getCart.mockResolvedValue({
      data: { items: [makeCartItem()], total_items: 1, total_unique_products: 1 },
      error: null,
    });

    await useStore.getState().addToCart({ id: 10, name: 'Test', price: 5000 } as any, 1);

    expect(svc.addToCart).toHaveBeenCalledWith(10, 1, 'retail');
  });
});

describe('useStore — removeFromCart', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('optimistically removes item from local cart', async () => {
    useStore.setState({
      sessionId: 'guest-123',
      cart: [makeCartItem()],
    });

    svc.removeGuestCartItem.mockResolvedValue({ data: null, error: null });
    svc.getGuestCart.mockResolvedValue({
      data: { items: [], total_items: 0, total_unique_products: 0 },
      error: null,
    });

    await useStore.getState().removeFromCart('10');

    expect(useStore.getState().cart).toHaveLength(0);
  });

  it('rolls back on API error', async () => {
    useStore.setState({
      sessionId: 'guest-123',
      cart: [makeCartItem()],
    });

    svc.removeGuestCartItem.mockResolvedValue({ data: null, error: 'Network error' });

    await useStore.getState().removeFromCart('10');

    expect(useStore.getState().cart).toHaveLength(1);
    expect(useStore.getState().cartError).toBe('Erreur lors de la suppression du panier');
  });
});

describe('useStore — setUser', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('clears cart on logout and reinits guest session', async () => {
    useStore.setState({
      user: { id: '1', name: 'Test', email: '', role: 'client', type: 'retail' } as any,
      cart: [makeCartItem()],
    });

    svc.initGuestSession.mockResolvedValue({
      data: { session_id: 'new-uuid' },
      error: null,
    });

    useStore.getState().setUser(null);

    expect(useStore.getState().cart).toHaveLength(0);

    // initGuestSession is async, called from setUser — wait for it
    await vi.waitFor(() => {
      expect(useStore.getState().sessionId).toBe('new-uuid');
    });
  });

  it('clears cart when switching to different user', async () => {
    useStore.setState({
      user: { id: '1', name: 'Test', email: '', role: 'client', type: 'retail' } as any,
      cart: [makeCartItem()],
    });

    useStore.getState().setUser({ id: '2', name: 'Other', email: '', role: 'client', type: 'retail' } as any);

    expect(useStore.getState().cart).toHaveLength(0);
  });
});
