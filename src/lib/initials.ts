/**
 * @file /lib/initials.ts
 * @description Initiales d'un utilisateur, toujours en majuscules.
 */

/**
 * Calcule les initiales affichées dans un avatar.
 *
 * - « Awa Ngom » → « AN » (prénom + nom)
 * - « Awa » → « AW »
 * - sans nom → les deux premières lettres de l'adresse e-mail
 * - sans nom ni e-mail → chaîne vide (aucune initiale affichée)
 */
export function getInitials(fullName?: string | null, email?: string | null): string {
  const words = (fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  const fromEmail = (email ?? '').trim();
  return fromEmail ? fromEmail.slice(0, 2).toUpperCase() : '';
}

/**
 * Premier prénom d'un nom complet, avec une majuscule initiale.
 * « awa ngom » → « Awa ». Retourne une chaîne vide si le nom est absent.
 */
export function getFirstName(fullName?: string | null): string {
  const first = (fullName ?? '').trim().split(/\s+/).filter(Boolean)[0] ?? '';
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
}
