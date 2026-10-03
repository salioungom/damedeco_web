import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const replace = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push, prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams('orderId=123'),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { id: '1', name: 'Client', email: 'client@test.sn', role: 'client' },
  }),
}));

vi.mock('@/store/useStore', () => ({
  useStore: () => ({ cart: [] }),
}));

vi.mock('@/hooks/useCartWithProducts', () => ({
  useCartWithProducts: () => ({ cart: [], loading: false }),
}));

import OrderService from '@/services/order.service';
import CheckoutFinalizePage from '@/app/checkout/finalize/page';

const baseOrder = {
  id: 123,
  order_id: 123,
  order_number: 'CMD-001',
  status: 'pending',
  payment_status: 'pending',
  total_amount: '10000',
  currency: 'FCFA',
  items: [],
  created_at: '2026-01-01T00:00:00Z',
} as never;

describe('Test 5 — /checkout/finalize : commande annulée', () => {
  beforeEach(() => {
    replace.mockClear();
    push.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('affiche « Commande annulée », sans appel initiatePayment ni bouton de paiement', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue({
      ...(baseOrder as object),
      status: 'cancelled',
      payment_status: 'pending',
    } as never);
    const initiatePayment = vi.spyOn(OrderService, 'initiatePayment').mockResolvedValue({});

    render(<CheckoutFinalizePage />);

    expect(await screen.findByText(/Commande annulée/)).toBeInTheDocument();
    expect(initiatePayment).not.toHaveBeenCalled();
    expect(screen.queryByText(/Reprendre le paiement/)).toBeNull();
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining('/checkout/success'));
  });

  it('une commande remboursée est aussi non payable', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue({
      ...(baseOrder as object),
      status: 'refunded',
      payment_status: 'refunded',
    } as never);
    const initiatePayment = vi.spyOn(OrderService, 'initiatePayment').mockResolvedValue({});

    render(<CheckoutFinalizePage />);

    expect(await screen.findByText(/Commande remboursée/)).toBeInTheDocument();
    expect(initiatePayment).not.toHaveBeenCalled();
    expect(screen.queryByText(/Reprendre le paiement/)).toBeNull();
  });

  it('§6 — commande annulée MAIS payée : « Paiement effectué », jamais « Remboursée »', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue({
      ...(baseOrder as object),
      status: 'cancelled',
      payment_status: 'paid',
    } as never);
    const initiatePayment = vi.spyOn(OrderService, 'initiatePayment').mockResolvedValue({});

    render(<CheckoutFinalizePage />);

    expect(await screen.findByText(/Commande annulée/)).toBeInTheDocument();
    expect(await screen.findByText(/Paiement effectué/)).toBeInTheDocument();
    expect(initiatePayment).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining('/checkout/success'));
  });

  it('§3 — commande pending déjà payée (paid/completed) : redirection /checkout/success', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue({
      ...(baseOrder as object),
      payment_status: 'completed',
    } as never);

    render(<CheckoutFinalizePage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/checkout/success?orderId=123');
    });
  });

  it('session PayTech live (processing) : aucun bouton de paiement, panel « Paiement en cours »', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue({
      ...(baseOrder as object),
      payment_status: 'processing',
    } as never);
    const initiatePayment = vi.spyOn(OrderService, 'initiatePayment').mockResolvedValue({});

    render(<CheckoutFinalizePage />);

    expect(await screen.findByText(/Paiement en cours/)).toBeInTheDocument();
    expect(screen.queryByText(/Reprendre le paiement/)).toBeNull();
    expect(initiatePayment).not.toHaveBeenCalled();
  });
});
