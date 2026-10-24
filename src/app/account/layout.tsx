'use client';

/**
 * @file /app/account/layout.tsx
 * @description Ossature de l'espace client.
 *
 * Le contenu des pages est rendu via `children` (aucune donnée n'est chargée
 * ici).
 */

import { Box } from '@mui/material';
import { AccountHeader } from '@/components/account/AccountHeader';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box>
      <AccountHeader />
      <Box>{children}</Box>
    </Box>
  );
}
