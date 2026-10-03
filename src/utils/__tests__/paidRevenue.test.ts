import { describe, expect, it } from 'vitest';
import { computePaidRevenue, isPaidOrder } from '@/utils/paidRevenue';

const order = (overrides: Record<string, unknown> = {}) => ({
  created_at: '2026-09-15T10:00:00Z',
  payment_status: 'paid',
  total_amount: '5000',
  ...overrides,
});

describe('isPaidOrder', () => {
  it('considère paid et completed comme payées', () => {
    expect(isPaidOrder({ payment_status: 'paid' })).toBe(true);
    expect(isPaidOrder({ payment_status: 'completed' })).toBe(true);
  });

  it('exclut pending, processing, failed, cancelled, refunded', () => {
    for (const s of ['pending', 'processing', 'failed', 'cancelled', 'refunded']) {
      expect(isPaidOrder({ payment_status: s })).toBe(false);
    }
  });
});

describe('computePaidRevenue', () => {
  it('somme uniquement les commandes payées', () => {
    const orders = [
      order({ payment_status: 'paid', total_amount: '5000' }),
      order({ payment_status: 'completed', total_amount: 3000 }),
      order({ payment_status: 'pending', total_amount: '99999' }),
      order({ payment_status: 'refunded', total_amount: '99999' }),
    ];
    expect(computePaidRevenue(orders)).toBe(8000);
  });

  it('gère les montants manquants sans planter', () => {
    expect(
      computePaidRevenue([order({ total_amount: null }), order({ total_amount: undefined })])
    ).toBe(0);
  });

  it('gère une liste vide', () => {
    expect(computePaidRevenue([])).toBe(0);
  });

  it('filtre par période quand start_date/end_date sont fournis', () => {
    const orders = [
      order({ created_at: '2026-09-10T12:00:00Z', total_amount: '1000' }),
      order({ created_at: '2026-09-20T12:00:00Z', total_amount: '2000' }),
      order({ created_at: '2026-10-01T12:00:00Z', total_amount: '4000' }),
    ];
    expect(computePaidRevenue(orders, { start_date: '2026-09-01', end_date: '2026-09-30' })).toBe(3000);
  });

  it('sans période : prend tout', () => {
    const orders = [
      order({ created_at: '2025-01-01T00:00:00Z', total_amount: '100' }),
      order({ created_at: '2026-09-20T12:00:00Z', total_amount: '400' }),
    ];
    expect(computePaidRevenue(orders, {})).toBe(500);
  });
});