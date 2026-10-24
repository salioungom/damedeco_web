/**
 * @file /lib/pricing.ts
 * @description Lecture du prix d'origine (prix barré) indépendamment de la
 * forme du payload renvoyé par l'API.
 *
 * Le backend expose ce champ sous `compare_price` (nom du modèle produit),
 * mais le résumé produit renvoyé par certains endpoints est sérialisé en
 * camelCase (`imageUrl`) et les montants peuvent arriver sous forme de
 * chaînes. Ces helpers centralisent la lecture afin que la boutique et les
 * favoris affichent le même prix barré et la même réduction.
 */

/** Alias possibles du prix d'origine dans les payloads de l'API. */
const ORIGINAL_PRICE_KEYS = [
  'compare_price',
  'comparePrice',
  'original_price',
  'originalPrice',
  'compare_at_price',
  'compareAtPrice',
  'old_price',
  'oldPrice',
  'regular_price',
  'regularPrice',
] as const;

/**
 * Convertit une valeur API (`number` ou `string`) en nombre.
 * Retourne `null` pour une valeur absente, vide ou non numérique.
 */
export function toPriceNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Prix d'origine lu dans un payload brut, quel que soit l'alias utilisé
 * (priorité au nom API `compare_price`).
 * Retourne `null` si aucun alias ne contient un montant exploitable.
 */
export function readOriginalPrice(source: unknown): number | null {
  if (!source || typeof source !== 'object') {
    return null;
  }
  const record = source as Record<string, unknown>;
  for (const key of ORIGINAL_PRICE_KEYS) {
    const value = toPriceNumber(record[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

/**
 * Prix d'origine retenu pour l'affichage d'un produit.
 *
 * - Prend le premier alias valide (nombre ou chaîne) parmi ceux exposés par
 *   l'API et le convertit en nombre.
 * - Retourne `null` si aucun montant n'est supérieur au prix actuel : le prix
 *   barré, le badge de réduction et l'économie ne s'affichent alors pas.
 */
export function resolveOriginalPrice(product: unknown, currentPrice: number): number | null {
  if (!product || typeof product !== 'object') {
    return null;
  }
  const record = product as Record<string, unknown>;
  for (const key of ORIGINAL_PRICE_KEYS) {
    const value = toPriceNumber(record[key]);
    if (value !== null && value > currentPrice) {
      return value;
    }
  }
  return null;
}
