import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrders, getOrderById } from '@/lib/api';
import OrderService from '../order.service';

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
  getOrders: vi.fn(),
  getOrderById: vi.fn(),
  createOrder: vi.fn(),
  cancelOrder: vi.fn(),
  confirmOrderDelivery: vi.fn(),
  updateOrderDelivery: vi.fn(),
  getOrderPayments: vi.fn(),
}));

const getOrdersMock = getOrders as unknown as ReturnType<typeof vi.fn>;
const getOrderByIdMock = getOrderById as unknown as ReturnType<typeof vi.fn>;

function order(id: number) {
  return { id, order_number: `CMD-${id}`, status: 'pending', payment_status: 'pending' };
}

describe('OrderService.getPaymentStatusLabel', () => {
  it('mappe les statuts de paiement connus', () => {
    expect(OrderService.getPaymentStatusLabel('pending')).toBe('En attente');
    expect(OrderService.getPaymentStatusLabel('processing')).toBe('En traitement');
    expect(OrderService.getPaymentStatusLabel('paid')).toBe('Payé');
    expect(OrderService.getPaymentStatusLabel('failed')).toBe('Échoué');
    expect(OrderService.getPaymentStatusLabel('refunded')).toBe('Remboursé');
  });

  it('couvre les statuts PayTech cancelled/completed/expired', () => {
    expect(OrderService.getPaymentStatusLabel('cancelled')).toBe('Annulé');
    expect(OrderService.getPaymentStatusLabel('completed')).toBe('Payé');
    expect(OrderService.getPaymentStatusLabel('expired')).toBe('Expiré');
  });

  it('retombe sur la valeur brute pour un statut inconnu', () => {
    expect(OrderService.getPaymentStatusLabel('mystery')).toBe('mystery');
  });
});

describe("OrderService.getOrderDetails — contrôle d'appartenance (règle 403)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("n'émet AUCUNE demande GET /orders/{id} pour une commande absente des commandes du client", async () => {
    getOrdersMock.mockResolvedValue([order(7), order(9)]);

    await expect(OrderService.getOrderDetails(1)).rejects.toMatchObject({
      status: 403,
      message: "Vous n'avez pas accès à cette commande.",
    });

    expect(getOrderByIdMock).not.toHaveBeenCalled();
    expect(getOrdersMock).toHaveBeenCalled();
  });

  it('demande le détail quand la commande figure bien dans la liste du client', async () => {
    getOrdersMock.mockResolvedValue([order(123), order(5)]);
    getOrderByIdMock.mockResolvedValue(order(123));

    const result = await OrderService.getOrderDetails(123);

    expect(result.id).toBe(123);
    expect(getOrderByIdMock).toHaveBeenCalledWith(123);
  });

  it("parcourt les pages de la liste jusqu'à trouver la commande du client", async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => order(1000 + i));
    getOrdersMock.mockImplementation((page: number) =>
      Promise.resolve(page === 0 ? firstPage : [order(500)])
    );
    getOrderByIdMock.mockResolvedValue(order(500));

    const result = await OrderService.getOrderDetails(500);

    expect(result.id).toBe(500);
    expect(getOrdersMock).toHaveBeenCalledTimes(2);
    expect(getOrdersMock).toHaveBeenNthCalledWith(2, 1, 100);
    expect(getOrderByIdMock).toHaveBeenCalledWith(500);
  });

  it("échec de la liste des commandes : aucune demande de détail n'est émise", async () => {
    getOrdersMock.mockRejectedValue({ status: 500, message: 'boom' });

    await expect(OrderService.getOrderDetails(300)).rejects.toMatchObject({
      message: 'Impossible de récupérer les détails de la commande',
    });

    expect(getOrderByIdMock).not.toHaveBeenCalled();
  });

  it("mémorise le contrôle : un second appel ne re-parcourt pas la liste", async () => {
    getOrdersMock.mockResolvedValue([order(4242)]);
    getOrderByIdMock.mockResolvedValue(order(4242));

    await OrderService.getOrderDetails(4242);
    await OrderService.getOrderDetails(4242);

    expect(getOrdersMock).toHaveBeenCalledTimes(1);
    expect(getOrderByIdMock).toHaveBeenCalledTimes(2);
  });
});
