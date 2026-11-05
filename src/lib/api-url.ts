/**
 * @file /lib/api-url.ts
 * @description Source unique de l'URL de base de l'API.
 *
 * En production, `NEXT_PUBLIC_API_URL` est obligatoire : le build échoue
 * explicitement au lieu de produire un bundle qui pointerait silencieusement
 * vers `localhost`. En développement, le backend local reste la valeur par
 * défaut.
 *
 * `API_URL_SERVER` (optionnel) permet de surcharger l'URL pour les appels
 * serveur (SSR/ISR) — utile dans Docker où `localhost` est le conteneur.
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const rawServerApiUrl = process.env.API_URL_SERVER;

// Validation uniquement pour le build réel, pas pour typegen ou autres commandes
const isRealBuild = process.argv?.some(arg => arg.includes('next') && arg.includes('build'));

if (process.env.NODE_ENV === 'production' && !rawApiUrl && isRealBuild) {
  throw new Error(
    'NEXT_PUBLIC_API_URL est obligatoire pour un build de production. ' +
      'Définissez-la (URL https, sans localhost) avant `next build`.',
  );
}

/** URL de base de l'API côté client (navigateur), sans slash final. */
export const API_URL = (rawApiUrl || 'http://localhost:8000').replace(/\/+$/, '');

/** URL de base de l'API côté serveur (SSR/ISR), sans slash final. */
export const API_URL_SERVER = (rawServerApiUrl || rawApiUrl || 'http://localhost:8000').replace(/\/+$/, '');
