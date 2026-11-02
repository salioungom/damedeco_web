/**
 * Utilitaire pour la gestion des URLs d'images
 * Utilise les variables d'environnement pour la sécurité
 */

import { API_URL } from './api-url';

/**
 * Construit l'URL complète d'une image
 * @param imageUrl - URL de l'image (relative ou absolue)
 * @returns URL complète de l'image
 */
export function getImageUrl(imageUrl?: string): string {
  if (!imageUrl) {
    return '/placeholder-image.jpg';
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  if (cleanPath.startsWith('/media/')) return `${API_URL}${cleanPath}`;
  return `${API_URL}/media${cleanPath}`;
}

/**
 * Construit l'URL de l'API
 * @param endpoint - Endpoint de l'API (ex: '/api/v1/orders')
 * @returns URL complète de l'API
 */
export function getApiUrl(endpoint: string): string {
  return `${API_URL}${endpoint}`;
}

/**
 * Vérifie si une URL est valide
 * @param url - URL à vérifier
 * @returns true si l'URL est valide
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
