'use client';

/**
 * @file /components/account/AccountHeader.tsx
 * @description Barre interne de l'espace client : titre de la section courante.
 *
 * Aucun badge de notifications : l'API correspondante n'existe pas encore et
 * aucun compteur fictif ne doit être affiché.
 */

import { usePathname } from 'next/navigation';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { NAVBAR_HEIGHT } from '@/components/Navigation';

/** Titres affichés, du chemin le plus précis au plus général. */
const SECTION_TITLES: ReadonlyArray<{ href: string; title: string }> = [
  { href: '/account/orders', title: 'Mes commandes' },
  { href: '/account/addresses', title: 'Mes adresses' },
  { href: '/account/profile', title: 'Mon profil' },
  { href: '/settings', title: 'Paramètres' },
  { href: '/favorites', title: 'Mes favoris' },
  { href: '/account', title: 'Mon tableau de bord' },
];

export function AccountHeader() {
  const pathname = usePathname();
  const theme = useTheme();

  const title =
    SECTION_TITLES.find((section) =>
      section.href === '/account' ? pathname === section.href : pathname.startsWith(section.href),
    )?.title ?? 'Mon espace';

  return (
    <Box
      sx={{
        position: 'sticky',
        top: { xs: NAVBAR_HEIGHT.xs, sm: NAVBAR_HEIGHT.sm, md: NAVBAR_HEIGHT.md },
        zIndex: theme.zIndex.appBar - 1,
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: { xs: 1.5, sm: 2.5, lg: 4 },
        py: { xs: 1.25, sm: 1.5 },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.0625rem', sm: '1.1875rem' } }}>
          {title}
        </Typography>
      </Stack>
    </Box>
  );
}

export default AccountHeader;
