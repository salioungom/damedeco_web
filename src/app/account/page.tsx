'use client';

/**
 * @file /app/account/page.tsx
 * @description Tableau de bord client : bandeau d'accueil, actions rapides,
 * statistiques, commandes récentes, suivi, favoris et assistance.
 *
 * Chaque bloc consomme son propre hook (useAccountStats, useRecentOrders,
 * useOrderTracking, useAccountFavorites) : une erreur sur un bloc n'affecte
 * aucun autre.
 */

import { Box, Container, Grid } from '@mui/material';
import { RequireRole } from '@/components/RequireRole';
import { FavoritesList } from '@/components/account/FavoritesList';
import { OrderTracker } from '@/components/account/OrderTracker';
import { QuickActions } from '@/components/account/QuickActions';
import { RecentOrders } from '@/components/account/RecentOrders';
import { StatsCards } from '@/components/account/StatsCards';
import { SupportCard } from '@/components/account/SupportCard';
import { WelcomeBanner } from '@/components/account/WelcomeBanner';

function AccountPageContent() {
  return (
    <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2.5, sm: 3, md: 4 } }}>
      <WelcomeBanner />

      <QuickActions />

      <StatsCards />

      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: { xs: 2.5, sm: 3, md: 3.5 } }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <RecentOrders />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5 } }}>
            <OrderTracker />
            <SupportCard />
          </Box>
        </Grid>
      </Grid>

      <FavoritesList />
    </Container>
  );
}

export default function AccountPage() {
  return (
    <RequireRole allowedRoles={['client']} variant="dashboard">
      <AccountPageContent />
    </RequireRole>
  );
}
