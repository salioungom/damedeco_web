/**
 * @file /lib/api-url.ts
 * @description Source unique de l'URL de base de l'API.
 *
 * En production, `NEXT_PUBLIC_API_URL` est obligatoire : le build échoue
 * explicitement au lieu de produire un bundle qui pointerait silencieusement
 * vers `localhost`. En développement, le backend local reste la valeur par
 * défaut.
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

if (process.env.NODE_ENV === 'production' && !rawApiUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_URL est obligatoire pour un build de production. ' +
      'Définissez-la (URL https, sans localhost) avant `next build`.',
  );
}

/** URL de base de l'API, sans slash final. */
export const API_URL = (rawApiUrl || 'http://localhost:8000').replace(/\/+$/, '');
