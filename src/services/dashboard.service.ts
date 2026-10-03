/**
 * @file /services/dashboard.service.ts
 * @description Service d'appel des endpoints dédiés au dashboard admin (Vue d'ensemble)
 * @version 1.0.0
 * @author DameDéco Team
 */

import { api } from '@/lib/api';

export interface OrderStatusCount {
  status: string;
  count: number;
}

export interface DashboardOverview {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_products: number;
  total_clients: number;
  orders_by_status: OrderStatusCount[];
}

export interface RecentOrderItem {
  id: number;
  order_number?: string;
  customer_name?: string | null;
  email?: string | null;
  items_count?: number;
  status?: string;
  total_amount?: number;
  created_at?: string;
}

export interface DashboardDateRange {
  start_date: string;
  end_date: string;
}

export class DashboardService {
  /** Vue d'ensemble (toutes les données, ou période filtrée si start_date/end_date fournis). */
  static async getOverview(startDate?: string, endDate?: string): Promise<DashboardOverview> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get<DashboardOverview>('/api/v1/admin/dashboard/overview', { params });
    return response.data;
  }

  /** Répartition par statut — réutilisée depuis orders_by_status de l'overview. */
  static async getOrdersByStatus(startDate?: string, endDate?: string): Promise<OrderStatusCount[]> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get<OrderStatusCount[]>('/api/v1/admin/dashboard/orders-by-status', { params });
    return response.data;
  }

  /** Commandes les plus récentes, toutes confondues. */
  static async getRecentOrders(limit = 5): Promise<RecentOrderItem[]> {
    const response = await api.get<RecentOrderItem[]>('/api/v1/admin/dashboard/recent-orders', { params: { limit } });
    return response.data;
  }
}