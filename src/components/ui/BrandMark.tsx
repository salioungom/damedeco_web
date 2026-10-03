'use client';

import { Box } from '@mui/material';

/**
 * Marque DameDéco — composant unique pour le header ET le footer.
 * Bleu de marque en aplat (jamais en dégradé), initiales blanches.
 */
export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Box
      role="img"
      aria-label="DameDéco"
      sx={{
        width: size === 'sm' ? 40 : size === 'lg' ? 56 : 48,
        height: size === 'sm' ? 40 : size === 'lg' ? 56 : 48,
        borderRadius: 12,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 'sm' ? 13 : size === 'lg' ? 17 : 15,
        fontWeight: 700,
        letterSpacing: '0.04em',
        flexShrink: 0,
      }}
    >
      DS
    </Box>
  );
}