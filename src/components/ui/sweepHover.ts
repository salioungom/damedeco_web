const SWEEP_DURATION = '0.5s';
const SWEEP_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

export interface SweepHoverOptions {
  /** Couleur du remplissage qui traverse le bouton de gauche à droite. */
  fill: string;
  /** Couleur du texte / icône une fois le bouton survolé. */
  hoverColor?: string;
  /** Couleur de bordure au survol (facultatif). */
  hoverBorderColor?: string;
}

/**
 * Même inversion « sweep » que `SweepButton` (remplissage `::before` de
 * gauche à droite), utilisable sur n'importe quel élément interactif
 * (IconButton, Box component="button", etc.).
 *
 * L'élément doit être positionné (`position: relative` ou `absolute`) pour
 * que le remplissage absolu couvre bien sa surface.
 */
export function sweepHoverSx({
  fill,
  hoverColor,
  hoverBorderColor,
}: SweepHoverOptions) {
  return {
    isolation: 'isolate',
    overflow: 'hidden',
    transition: `color ${SWEEP_DURATION} ${SWEEP_EASING}, border-color ${SWEEP_DURATION} ${SWEEP_EASING}`,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      zIndex: -1,
      backgroundColor: fill,
      transform: 'scaleX(0)',
      transformOrigin: 'left center',
      transition: `transform ${SWEEP_DURATION} ${SWEEP_EASING}`,
    },
    '@media (hover: hover)': {
      '&:hover': {
        ...(hoverColor ? { color: hoverColor } : {}),
        ...(hoverBorderColor ? { borderColor: hoverBorderColor } : {}),
        '&::before': {
          transform: 'scaleX(1)',
        },
      },
    },
    '&:active::before': {
      transform: 'scaleX(1)',
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&::before': {
        transition: 'none',
      },
    },
  };
}
