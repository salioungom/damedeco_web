'use client';

import * as React from 'react';
import { Button, ButtonProps, useTheme } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SweepButtonProps extends Omit<ButtonProps, 'variant'> {
  /** 'primary' : au survol, remplissage `background.default` (crème) traverse le bouton
   *  de gauche à droite ; texte + icône passent en `primary.main`.
   *  'outline' : au survol, remplissage `primary.main` traverse le bouton
   *  de gauche à droite ; texte + flèche passent en `common.white`. */
  variant?: 'primary' | 'outline';
}

const SWEEP_DURATION = '0.5s';
const SWEEP_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';
const SWEEP_FILL_TRANSITION = `transform ${SWEEP_DURATION} ${SWEEP_EASING}`;
const SWEEP_COLOR_TRANSITION = `transform ${SWEEP_DURATION} ${SWEEP_EASING}, color ${SWEEP_DURATION} ${SWEEP_EASING}`;

/**
 * Bouton MUI dont le survol déclenche un remplissage « sweep » de gauche à droite
 * (pseudo-élément `::before` + `transform: scaleX`, jamais `width`/`left`).
 * Au repos, le remplissage est replié (origin droite) ; au survol/focus, il
 * traverse le bouton (origin gauche). La couleur du remplissage passe par la
 * variable CSS `--sweep-bg` (définie par variante).
 */
export const SweepButton = React.forwardRef<HTMLButtonElement, SweepButtonProps>(function SweepButton(
  { variant = 'primary', disableRipple = true, sx, ...props },
  ref,
) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const isOutline = !primary;

  const fillColor = primary ? theme.palette.background.default : theme.palette.primary.main;
  const idleBg = primary ? theme.palette.primary.main : 'transparent';
  const idleColor = primary ? theme.palette.common.white : theme.palette.primary.main;
  const hoverBg = primary ? theme.palette.primary.main : 'transparent';
  const hoverColor = primary ? theme.palette.primary.main : theme.palette.common.white;
  const idleIconColor = primary ? theme.palette.common.white : theme.palette.primary.main;
  const hoverIconColor = primary ? theme.palette.primary.main : theme.palette.common.white;
  const borderColor = theme.palette.primary.main;

  const fill = {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    backgroundColor: fillColor,
    '--sweep-bg': fillColor,
    transform: 'scaleX(0)',
    transformOrigin: 'right',
    transition: SWEEP_FILL_TRANSITION,
  };

  const idleIconSx = {
    transition: SWEEP_COLOR_TRANSITION,
    color: idleIconColor,
  };

  const hoverIconSx = {
    transition: SWEEP_COLOR_TRANSITION,
    color: hoverIconColor,
    ...(isOutline ? { transform: 'translateX(4px)' } : {}),
  };

  const baseSx: SxProps<Theme> = {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
    height: '52px',
    borderRadius: '10px',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    border: '1px solid',
    borderColor,
    boxShadow: 'none',
    transform: 'none',
    bgcolor: idleBg,
    color: idleColor,
    transition: SWEEP_COLOR_TRANSITION,
    '&::before': fill,
    '& .MuiButton-endIcon': idleIconSx,
  };

  const hoverSx: SxProps<Theme> = {
    bgcolor: hoverBg,
    border: '1px solid',
    borderColor,
    color: hoverColor,
    transform: 'none',
    '&::before': {
      ...fill,
      transform: 'scaleX(1)',
      transformOrigin: 'left',
    },
    '& .MuiButton-endIcon': hoverIconSx,
  };

  const sweepSx: SxProps<Theme> = {
    ...baseSx,
    '@media (hover: hover)': {
      '&:hover': hoverSx,
      '&:focus-visible': {
        ...hoverSx,
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: '2px',
      },
    },
    '&:active': hoverSx,
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: '2px',
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&::before': {
        transition: 'none',
      },
    },
  };

  return (
    <Button
      ref={ref}
      variant={primary ? 'contained' : 'outlined'}
      disableRipple={disableRipple}
      sx={{ ...sweepSx, ...sx }}
      {...props}
    />
  );
});

SweepButton.displayName = 'SweepButton';

export default SweepButton;
