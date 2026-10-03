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

export default formatFcfa;