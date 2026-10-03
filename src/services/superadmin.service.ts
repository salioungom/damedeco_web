/**
 * @file /services/superadmin.service.ts
 * @description Service d'appel des endpoints dédiés au dashboard SuperAdmin
 * @version 1.0.0
 * @author DameDéco Team
 */

import { api } from '@/lib/api';

export interface SuperAdminStats {
  total_admins: number;
  active_admins: number;
  inactive_admins: number;
}

export class SuperAdminService {
  /** Statistiques administrateurs affichées sur les cards du dashboard SuperAdmin. */
  static async getStats(): Promise<SuperAdminStats> {
    const response = await api.get<SuperAdminStats>('/api/v1/admin/superadmin/stats');
    return response.data;
  }
}