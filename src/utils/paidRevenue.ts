export interface PaidOrderInput {
  created_at?: string | null;
  payment_status?: string | null;
  total_amount?: string | number | null;
}

export interface PaidDateRange {
  start_date?: string;
  end_date?: string;
}

export function isPaidOrder(order: PaidOrderInput): boolean {
  return order.payment_status === 'paid' || order.payment_status === 'completed';
}

export function computePaidRevenue(orders: PaidOrderInput[], range: PaidDateRange = {}): number {
  const start = range.start_date ? new Date(`${range.start_date}T00:00:00`).getTime() : -Infinity;
  const end = range.end_date ? new Date(`${range.end_date}T23:59:59.999`).getTime() : Infinity;

  return (orders || []).reduce((sum, order) => {
    if (!isPaidOrder(order)) return sum;
    const createdAt = order.created_at ? new Date(order.created_at).getTime() : NaN;
    if (!Number.isNaN(createdAt)) {
      if (createdAt < start || createdAt > end) return sum;
    }
    return sum + (Number(order.total_amount) || 0);
  }, 0);
}