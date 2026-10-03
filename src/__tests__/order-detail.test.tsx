import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ id: '123' }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Client', email: 'client@test.sn', role: 'client' },
    loading: false,
  }),
}));

vi.mock('@/components/RequireRole', () => ({
  RequireRole: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import OrderService from '@/services/order.service';
import OrderDetailPage from '@/app/account/orders/[id]/page';

const pendingOrder = {
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

function payment(status: string) {
  return {
    id: 1,
    order_id: 123,
    payment_method: null,
    amount: '10000',
    currency: 'FCFA',
    status,
    created_at: '2026-01-02T00:00:00Z',
  };
}

describe('Matrice §15 — bouton « Payer » selon l\'état de paiement', () => {
  beforeEach(() => {
    push.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('paiement pending : bouton « Payer la commande » DISPONIBLE (matrice ligne 1)', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue(pendingOrder);
    vi.spyOn(OrderService, 'getOrderPayments').mockResolvedValue([payment('pending')] as never);
    const initiatePayment = vi.spyOn(OrderService, 'initiatePayment').mockResolvedValue({});

    render(<OrderDetailPage />);

    const button = await screen.findByRole('button', { name: /^Payer la commande$/ });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(initiatePayment).toHaveBeenCalled();
  }, 30000);

  it('paiement processing : bouton désactivé et aucun second paiement déclenché', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue({
      ...(pendingOrder as object),
      payment_status: 'processing',
    } as never);
    vi.spyOn(OrderService, 'getOrderPayments').mockResolvedValue([payment('processing')] as never);
    const initiatePayment = vi.spyOn(OrderService, 'initiatePayment').mockResolvedValue({});

    render(<OrderDetailPage />);

    const button = await screen.findByRole('button', { name: /Paiement en cours/ });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(initiatePayment).not.toHaveBeenCalled();
  }, 30000);

  it('Test 7 — paiement annulé + commande active : bouton « Payer à nouveau » disponible (spec §11)', async () => {
    vi.spyOn(OrderService, 'getOrderDetails').mockResolvedValue({
      ...(pendingOrder as object),
      payment_status: 'cancelled',
    } as never);
    vi.spyOn(OrderService, 'getOrderPayments').mockResolvedValue([payment('cancelled')] as never);

    render(<OrderDetailPage />);

    const button = await screen.findByRole('button', { name: /^Payer à nouveau$/ });
    expect(button).toBeEnabled();
  }, 30000);
});
