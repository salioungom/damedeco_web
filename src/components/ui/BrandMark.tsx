'use client';

import { Box } from '@mui/material';
import { tokens } from '@/theme/tokens';

/**
 * Marque DameDéco — composant unique pour le header ET le footer.
 * Bleu de marque en aplat (jamais en dégradé), initiales blanches.
 * Variante `inverse` (footer) : cercle blanc, initiales en bleu de marque,
 * pour rester lisible sur le fond navy profond.
 */
export function BrandMark({
  size = 'md',
  variant = 'default',
}: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inverse';
}) {
  const inverse = variant === 'inverse';
  return (
    <Box
      role="img"
      aria-label="DameDéco"
      sx={{
        width: size === 'sm' ? 40 : size === 'lg' ? 56 : 48,
        height: size === 'sm' ? 40 : size === 'lg' ? 56 : 48,
        borderRadius: inverse ? '50%' : 12,
        bgcolor: inverse ? tokens.colors.white : 'primary.main',
        color: inverse ? tokens.colors.brand.mark : 'primary.contrastText',
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
