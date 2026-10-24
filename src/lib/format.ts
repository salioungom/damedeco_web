/**
 * @file /lib/format.ts
 * @description Formatage monétaire centralisé : unique implémentation pour
 * tous les affichages de montants de l'application (FCFA, 0 décimale).
 *
 * Le backend fournit les montants tels quels (aucun calcul côté frontend) :
 * cette fonction ne sert qu'à l'affichage. Elle accepte les valeurs
 * `string | number | null | undefined` issues des réponses API.
 */

const FCFA_NUMBER_FMT = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/**
 * Formate un montant en FCFA sans décimale (ex. 12900 -> "12 900 FCFA").
 *
 * - Utilise Intl.NumberFormat('fr-FR') à 0 décimale (séparateur de milliers
 *   en espace fine insécable).
 * - Ajoute le suffixe " FCFA".
 * - Retourne "—" pour null, undefined, chaîne vide ou toute valeur non
 *   numérique (la donnée n'est simplement pas affichable).
 */
export function formatFcfa(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  const numeric = typeof amount === 'number' ? amount : Number(amount);

  if (!Number.isFinite(numeric)) {
    return '—';
  }

  return `${FCFA_NUMBER_FMT.format(numeric)} FCFA`;
}

/** Format de date long français : « 21 octobre 2026 ». */
const FR_DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Format de date et heure français : « 21 octobre 2026 à 14:05 ». */
const FR_DATETIME_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Formate une date au format français long (« 21 octobre 2026 »).
 * Retourne « — » si la date est absente ou illisible.
 */
export function formatDateFr(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  return date ? FR_DATE_FMT.format(date) : '—';
}

/**
 * Formate une date et l'heure au format français (« 21 octobre 2026 à 14:05 »).
 * Retourne « — » si la date est absente ou illisible.
 */
export function formatDateTimeFr(value: string | number | Date | null | undefined): string {
  const date = toDate(value);
  return date ? FR_DATETIME_FMT.format(date) : '—';
}

export default formatFcfa;