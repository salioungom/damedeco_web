'use client';

/**
 * @file /src/services/user.service.ts
 * @description Service dédié au profil courant (identité) côté client.
 *   → `/users/me` n'a PAS d'alias camelCase : réponses ET requêtes en snake_case.
 *   → Ne JAMAIS envoyer `user_id` : il est résolu par le backend via le JWT.
 *   → Le type du formulaire reste camelCase ; la conversion vit ici, à la
 *     frontière API.
 * @version 1.1.0
 */

import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Réponse backend de GET /users/me (snake_case, contrat OpenAPI). */
export interface CurrentUserProfile {
  id?: number;
  full_name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

/** Body PATCH /users/me — snake_case strict, 4 champs déclarés uniquement. */
interface UserUpdatePayload {
  full_name: string;
  username: string;
  email: string;
  phone: string;
}

/** Payload « identité » du formulaire de profil (camelCase, type du front). */
export interface ProfileIdentityForm {
  fullName: string;
  username: string;
  email: string;
  phone: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export class UserService {
  private static readonly API_BASE = '/api/v1/users';

  /**
   * Récupérer le profil courant (GET). L'identité est résolue côté backend via
   * le JWT — aucun user_id à fournir.
   */
  static async getCurrentProfile(): Promise<CurrentUserProfile> {
    const response = await apiClient.get<CurrentUserProfile>(`${this.API_BASE}/me`);
    return response.data;
  }

  /**
   * Mettre à jour l'identité (PATCH /users/me).
   * Frontière API : le body est snake_case STRICT. Le type du formulaire reste
   * camelCase — la conversion a lieu ici, et nulle part ailleurs.
   * — JAMAIS `fullName`, `name`, `createdAt` ni `address` dans le body :
   *   le backend les ignorerait (200 trompeur) puis les refuserait en 422
   *   dès le passage en `extra="forbid"`.
   */
  static async updateProfile(data: ProfileIdentityForm): Promise<CurrentUserProfile> {
    const body: UserUpdatePayload = {
      full_name: data.fullName,
      username: data.username,
      email: data.email,
      phone: data.phone,
    };
    const response = await apiClient.patch<CurrentUserProfile>(`${this.API_BASE}/me`, body);
    return response.data;
  }
}
