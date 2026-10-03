/**
 * @file /services/address.service.ts
 * @description Service dédié à la gestion des adresses utilisateur avec API v1
 * @version 2.2.0
 * @author DameDéco Team
 */

import { api } from '@/lib/api';

/**
 * Extrait un message lisible d'une erreur axios en conservant le `detail`
 * renvoyé par le backend (422 champ manquant/invalide, 404 adresse d'un autre
 * utilisateur, 400 numéro invalide). À utiliser côté UI : les services
 * relancent l'erreur d'origine, jamais une version dégradée.
 */
export function parseErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const detail = anyErr?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: any) => e?.msg || e?.message || JSON.stringify(e))
      .join(', ');
  }
  return (
    anyErr?.response?.data?.message ||
    anyErr?.message ||
    'Une erreur est survenue'
  );
}

// Types pour les adresses (réponses backend — format snake_case côté lecture)
export interface Address {
  id: number;
  user_id: number;
  address_type: "billing" | "shipping";
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  is_default: boolean;
  first_name: string;
  last_name: string;
  phone: string;
  delivery_instructions?: string;
  created_at: string;
  updated_at: string;
}

// Interface pour la réponse paginée
export interface AddressListResponse {
  items: Address[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Interface pour la création d'adresse (snake_case — utilisé par d'autres pages)
export interface CreateAddressData {
  address_type?: "billing" | "shipping";
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  first_name: string;
  last_name: string;
  phone: string;
  delivery_instructions?: string;
  is_default?: boolean;
}

// Interface pour la mise à jour d'adresse.
// Le backend réutilise `AddressCreate` sur le PUT : les mêmes champs sont
// obligatoires, un payload partiel renvoie 422. Les champs restent alignés sur
// `CreateAddressData` (type uniquement, aucun changement de comportement).
export interface UpdateAddressData extends CreateAddressData {}

// Payload camelCase STRICT pour le profil utilisateur.
// Aucune clé `name`, aucun `user_id` — l'identité est résolue via le JWT.
// `phone` doit respecter le format Sénégal (+221) ou Gambie (+220).
export interface ProfileAddressPayload {
  addressType: "billing" | "shipping";
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  firstName: string;
  lastName: string;
  phone: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

// Service de gestion des adresses
export class AddressService {
  private static readonly API_BASE = '/api/v1/addresses';

  /**
   * Créer OU mettre à jour l'adresse du profil, puis forcer le défaut si demandé.
   * camelCase STRICT (aucune clé `name`, aucun `user_id` — résolu via JWT).
   * - Adresse existante → PUT /addresses/{id}
   * - Nouvelle adresse  → POST /addresses/
   * - isDefault         → PATCH /addresses/{id}/default
   * L'erreur d'origine est relancée : la page parse `err.response?.data?.detail`.
   */
  static async saveProfileAddress(
    existing: Address | null,
    payload: ProfileAddressPayload
  ): Promise<Address | null> {
    // Frontière API : le backend attend snake_case (mêmes clés que CreateAddressData).
    // Le type frontend reste camelCase ; conversion effectuée ici uniquement.
    const body: CreateAddressData = {
      address_type: payload.addressType,
      address_line_1: payload.addressLine1,
      address_line_2: payload.addressLine2,
      city: payload.city,
      state: payload.state,
      first_name: payload.firstName,
      last_name: payload.lastName,
      phone: payload.phone,
      delivery_instructions: payload.deliveryInstructions,
      is_default: payload.isDefault,
    };

    let saved: Address;
    if (existing?.id) {
      const response = await api.put<Address>(`${this.API_BASE}/${existing.id}`, body);
      saved = response.data;
    } else {
      const response = await api.post<Address>(`${this.API_BASE}/`, body);
      saved = response.data;
    }
    if (payload.isDefault && saved.id) {
      await api.patch(`${this.API_BASE}/${saved.id}/default`);
    }
    return saved;
  }

  /**
   * Récupérer la liste des adresses de l'utilisateur avec pagination
   */
  static async getUserAddresses(skip = 0, limit = 20): Promise<AddressListResponse> {
    const response = await api.get<AddressListResponse>(
      `${this.API_BASE}/?skip=${skip}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Récupérer une adresse par son ID
   */
  static async getAddressById(id: number): Promise<Address> {
    const response = await api.get<Address>(`${this.API_BASE}/${id}`);
    return response.data;
  }

  /**
   * Créer une nouvelle adresse
   */
  static async createAddress(addressData: CreateAddressData): Promise<Address> {
    const response = await api.post<Address>(`${this.API_BASE}/`, addressData);
    return response.data;
  }

  /**
   * Mettre à jour une adresse existante
   */
  static async updateAddress(id: number, addressData: UpdateAddressData): Promise<Address> {
    const response = await api.put<Address>(`${this.API_BASE}/${id}`, addressData);
    return response.data;
  }

  /**
   * Supprimer une adresse
   */
  static async deleteAddress(id: number): Promise<void> {
    await api.delete(`${this.API_BASE}/${id}`);
  }

  /**
   * Définir une adresse comme adresse par défaut
   */
  static async setDefaultAddress(id: number): Promise<Address> {
    const response = await api.patch<Address>(`${this.API_BASE}/${id}/default`);
    return response.data;
  }

  /**
   * Récupérer l'adresse par défaut de l'utilisateur
   */
  static async getDefaultAddress(): Promise<Address | null> {
    try {
      const response = await this.getUserAddresses(0, 100);
      return response.items.find(addr => addr.is_default) || null;
    } catch (error) {
      console.error('Erreur récupération adresse par défaut:', error);
      return null;
    }
  }

  /**
   * Formater l'adresse pour l'affichage
   */
  static formatAddress(address: Address): string {
    let parts = [address.address_line_1];
    if (address.address_line_2) parts.push(address.address_line_2);
    parts.push(address.city);
    if (address.state) parts.push(address.state);
    return parts.join(', ');
  }

  /**
   * Formater le nom complet pour l'affichage
   */
  static formatFullName(address: Address): string {
    return `${address.first_name} ${address.last_name}`;
  }

  /**
   * Formater l'adresse complète avec nom et téléphone
   */
  static formatFullAddress(address: Address): string {
    return `${this.formatFullName(address)}\n${address.phone}\n${this.formatAddress(address)}${address.delivery_instructions ? `\nInstructions: ${address.delivery_instructions}` : ''}`;
  }
}
