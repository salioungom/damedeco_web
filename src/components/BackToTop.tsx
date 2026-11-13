'use client';

import { KeyboardArrowUp } from '@mui/icons-material';
import { Box } from '@mui/material';
import { backToTopCompactSx, backToTopSx } from './footerStyles';

interface BackToTopProps {
  compact?: boolean;
}

export function BackToTop({ compact = false }: BackToTopProps) {
  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <Box
      component="button"
      type="button"
      onClick={handleClick}
      aria-label="Revenir en haut de la page"
      sx={compact ? backToTopCompactSx : backToTopSx}
    >
      <KeyboardArrowUp aria-hidden="true" />
      {!compact && <span>Haut de page</span>}
    </Box>
  );
}
