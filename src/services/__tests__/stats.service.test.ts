import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '@/lib/api';
import { StatsService, type AccountOrder } from '../stats.service';
import type { Order } from '@/lib/types';

vi.mock('@/lib/api', () => {
  const mocked = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mocked,
    api: mocked,
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    getProductBySlug: vi.fn(),
    getProductStock: vi.fn(),
    searchProducts: vi.fn(),
    getCategories: vi.fn(),
    getCategoryById: vi.fn(),
    getOrders: vi.fn(),
    getAdminOrders: vi.fn(),
    getOrderById: vi.fn(),
    createOrder: vi.fn(),
    cancelOrder: vi.fn(),
    confirmOrderDelivery: vi.fn(),
    updateOrderStatus: vi.fn(),
    updateOrderDelivery: vi.fn(),
    getOrderPayments: vi.fn(),
  };
});

vi.mock('@/services/favorite.service', () => ({
  FavoriteService: {
    getFavoritesCount: vi.fn(async () => 3),
  },
}));

const mockedGet = api.get as unknown as ReturnType<typeof vi.fn>;

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    order_number: 'CMD-001',
    status: 'delivered',
    payment_status: 'paid',
    total_amount: '125000',
    currency: 'FCFA',
    created_at: '2026-10-21T10:00:00Z',
    items: [],
    ...overrides,
  } as Order;
}

describe('StatsService — tableau de bord client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    StatsService.clearOrdersFeedCache();
  });

  afterEach(() => {
    StatsService.clearOrdersFeedCache();
  });

  describe('calcul des statistiques', () => {
    it('compte les commandes payées dans le total dépensé et ignore les autres', async () => {
      mockedGet.mockResolvedValue({
        data: [
          makeOrder({ id: 1, total_amount: '100000', payment_status: 'paid' }),
          makeOrder({ id: 2, total_amount: '50000', payment_status: 'pending' }),
          makeOrder({ id: 3, total_amount: '25000', payment_status: 'failed' }),
        ],
      });

      const stats = await StatsService.getAccountStats('user-1');

      expect(stats.totalOrders).toBe(3);
      expect(stats.totalSpent).toBe(100000);
      expect(stats.totalFavorites).toBe(3);
    });

    it('compte les commandes en cours (pending, processing, shipped) et exclut les autres', async () => {
      mockedGet.mockResolvedValue({
        data: [
          makeOrder({ id: 1, status: 'pending' }),
          makeOrder({ id: 2, status: 'processing' }),
          makeOrder({ id: 3, status: 'shipped' }),
          makeOrder({ id: 4, status: 'delivered' }),
          makeOrder({ id: 5, status: 'cancelled' }),
        ],
      });

      const stats = await StatsService.getAccountStats('user-2');

      expect(stats.pendingOrders).toBe(3);
    });

    it('renvoie des statistiques à zéro quand le client n’a aucune commande', async () => {
      mockedGet.mockResolvedValue({ data: [] });

      const stats = await StatsService.getAccountStats('user-3');

      expect(stats).toEqual({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        totalFavorites: 3,
      });
    });
  });

  describe('suivi de commande', () => {
    it('positionne l’étape atteinte et laisse -1 quand aucune étape n’est validée', async () => {
      mockedGet.mockResolvedValue({
        data: [
          makeOrder({ id: 1, order_number: 'CMD-A', status: 'pending' }),
          makeOrder({ id: 2, order_number: 'CMD-B', status: 'confirmed' }),
          makeOrder({ id: 3, order_number: 'CMD-C', status: 'processing' }),
          makeOrder({ id: 4, order_number: 'CMD-D', status: 'shipped' }),
        ],
      });

      const trackings = await StatsService.getOrderTrackings('user-4');

      expect(trackings.map((tracking) => tracking.orderNumber)).toEqual([
        'CMD-A',
        'CMD-B',
        'CMD-C',
        'CMD-D',
      ]);
      expect(trackings.map((tracking) => tracking.step)).toEqual([-1, 0, 1, 2]);
    });

    it('exclut les commandes livrées, annulées et remboursées', async () => {
      mockedGet.mockResolvedValue({
        data: [
          makeOrder({ id: 1, status: 'delivered' }),
          makeOrder({ id: 2, status: 'cancelled' }),
          makeOrder({ id: 3, status: 'refunded' }),
          makeOrder({ id: 4, status: 'shipped' }),
        ],
      });

      const trackings = await StatsService.getOrderTrackings('user-5');

      expect(trackings).toHaveLength(1);
      expect(trackings[0].status).toBe('shipped');
    });
  });

  describe('chargement partagé des commandes', () => {
    it('ne déclenche qu’une seule requête pour deux appels concurrents', async () => {
      mockedGet.mockResolvedValue({ data: [makeOrder()] });

      const [stats, orders] = await Promise.all([
        StatsService.getAccountStats('user-6'),
        StatsService.getRecentOrders('user-6', 3),
      ]);

      expect(mockedGet).toHaveBeenCalledTimes(1);
      expect(stats.totalOrders).toBe(1);
      expect(orders).toHaveLength(1);
    });

    it('sert le résultat depuis le cache pour un second appel', async () => {
      mockedGet.mockResolvedValue({ data: [makeOrder()] });

      await StatsService.getCustomerOrdersFeed('user-7');
      await StatsService.getCustomerOrdersFeed('user-7');

      expect(mockedGet).toHaveBeenCalledTimes(1);
    });

    it('isole le cache entre deux utilisateurs', async () => {
      // L'API n'identifie l'utilisateur que par le jeton : la réponse varie
      // d'un appel à l'autre, c'est le cache qui doit séparer les comptes.
      let call = 0;
      mockedGet.mockImplementation(async () => {
        call += 1;
        return { data: [makeOrder({ id: call })] };
      });

      const first = await StatsService.getCustomerOrdersFeed('user-8');
      const second = await StatsService.getCustomerOrdersFeed('user-9');

      expect(mockedGet).toHaveBeenCalledTimes(2);
      expect(first[0].id).toBe(1);
      expect(second[0].id).toBe(2);
    });

    it('relance une requête neuve après l’annulation de la requête partagée', async () => {
      // La 1ʳᵉ requête reste en attente jusqu'à l'annulation (comme le fait
      // axios), la 2ᵉ aboutit.
      let call = 0;
      mockedGet.mockImplementation((_url: string, config?: { signal?: AbortSignal }) => {
        call += 1;
        if (call > 1) {
          return Promise.resolve({ data: [makeOrder()] });
        }
        return new Promise((_resolve, reject) => {
          config?.signal?.addEventListener(
            'abort',
            () => {
              const error = new Error('canceled');
              error.name = 'CanceledError';
              reject(error);
            },
            { once: true },
          );
        });
      });

      const controller = new AbortController();
      const annulee = StatsService.getCustomerOrdersFeed('user-12', 100, controller.signal);
      controller.abort();
      await expect(annulee).rejects.toBeTruthy();

      // Le remontage du composant (React StrictMode) doit repartir d'une
      // requête neuve, pas récupérer l'erreur de la requête annulée.
      const orders = await StatsService.getCustomerOrdersFeed('user-12', 100);

      expect(mockedGet).toHaveBeenCalledTimes(2);
      expect(orders).toHaveLength(1);
    });

    it('vide le cache d’un utilisateur sans toucher aux autres', async () => {
      mockedGet.mockResolvedValue({ data: [makeOrder()] });

      await StatsService.getCustomerOrdersFeed('user-10');
      await StatsService.getCustomerOrdersFeed('user-11');
      expect(mockedGet).toHaveBeenCalledTimes(2);

      StatsService.clearOrdersFeedCache('user-10');

      await StatsService.getCustomerOrdersFeed('user-10');
      await StatsService.getCustomerOrdersFeed('user-11');

      expect(mockedGet).toHaveBeenCalledTimes(3);
    });
  });

  describe('normalisation des commandes', () => {
    it('expose un statut et un paiement typés, le nombre d’articles et la miniature', () => {
      const order = makeOrder({
        id: 42,
        order_number: 'CMD-042',
        status: 'processing',
        payment_status: 'paid',
        total_amount: '125000',
        items_count: 3,
        items: [
          {
            id: 1,
            product_id: 7,
            quantity: 2,
            unit_price: '1000',
            total_price: '2000',
            product: {
              id: 7,
              name: 'Fauteuil Oslo',
              sku: 'SKU-7',
              cover_image_url: '/media/fauteuil.jpg',
              images: [],
            },
          },
        ],
      } as unknown as Order);

      const normalized: AccountOrder = StatsService.normalizeOrder(order);

      expect(normalized.orderNumber).toBe('CMD-042');
      expect(normalized.status).toBe('processing');
      expect(normalized.paymentStatus).toBe('paid');
      expect(normalized.totalAmount).toBe(125000);
      expect(normalized.itemsCount).toBe(3);
      expect(normalized.firstItemName).toBe('Fauteuil Oslo');
      expect(normalized.firstItemImage).toContain('/media/fauteuil.jpg');
    });

    it('retombe sur des statuts par défaut quand l’API renvoie une valeur inconnue', () => {
      const normalized = StatsService.normalizeOrder(
        makeOrder({ status: 'inconnu' as Order['status'], payment_status: 'inconnu' as Order['payment_status'] }),
      );

      expect(normalized.status).toBe('pending');
      expect(normalized.paymentStatus).toBe('pending');
    });
  });
});
