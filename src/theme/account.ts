/**
 * @file /theme/account.ts
 * @description Extensions visuelles propres à l'espace client (/account).
 *
 * Ces styles ne modifient pas le thème global : ils sont uniquement
 * consommés via la prop `sx` des composants de `src/components/account/`.
 * Toutes les couleurs utilisent des clés de palette du thème
 * (`primary.main`, `divider`, `background.paper`…) — aucune valeur codée en dur.
 */

import type { Theme } from '@mui/material/styles';

/**
 * Couleur d'accent d'un statut (commande). Le statut « default » n'a pas
 * d'entrée dans la palette : on retombe sur la couleur de texte secondaire.
 */
export function getStatusAccent(
  theme: Theme,
  status: 'success' | 'warning' | 'info' | 'default' | 'error',
): string {
  return status === 'default' ? theme.palette.text.secondary : theme.palette[status].main;
}

export const accountSx = {  /** Surface de base : carte, panneau, bloc de liste. */
  surface: {
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
  },

  /** En-tête d'un bloc de l'espace client. */
  blockHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    px: { xs: 2, sm: 2.5 },
    py: { xs: 1.5, sm: 1.75 },
    borderBottom: '1px solid',
    borderColor: 'divider',
  },

  /** Titre d'un bloc. */
  blockTitle: {
    fontWeight: 700,
    fontSize: { xs: '1rem', sm: '1.0625rem' },
    lineHeight: 1.3,
  },

  /** Sur-titre d'un bloc (libellé en capitales). */
  blockEyebrow: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'text.secondary',
  },

  /** Ligne de liste (commande, favori, suivi). */
  listItem: {
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.default',
    transition: 'border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease',
    '&:hover': {
      borderColor: 'primary.main',
      bgcolor: 'background.paper',
      transform: 'translateY(-2px)',
    },
  },
} as const;
