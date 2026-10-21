'use client';

/**
 * @file /components/account/DashboardSkeleton.tsx
 * @description Squelette affiché pendant le chargement de l'espace client.
 *
 * Deux variantes :
 * - `dashboard` : reproduit la mise en page de /account (bandeau, 4 cartes
 *   de statistiques, blocs de contenu) aux dimensions exactes des blocs
 *   finaux, pour éviter tout saut de mise en page à l'arrivée des données.
 * - `simple` : squelette neutre (titre + bloc de contenu), utilisé par les
 *   pages d'administration et de super-administration.
 *
 * Le squelette ne contient aucun texte : il ne doit jamais laisser apparaître
 * de contenu fictif.
 */

import { Box, Card, CardContent, Container, Grid, Skeleton, Stack } from '@mui/material';

export type DashboardSkeletonVariant = 'dashboard' | 'simple';

interface DashboardSkeletonProps {
  variant?: DashboardSkeletonVariant;
}

const statCardWidth = { xs: 12, sm: 6, md: 3 };

export function DashboardSkeleton({ variant = 'simple' }: DashboardSkeletonProps) {
  if (variant === 'simple') {
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 4, md: 8 }, mb: 8 }}>
        <Skeleton variant="text" width={220} height={40} sx={{ mb: 3 }} />
        <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="55%" />
              <Skeleton variant="text" width="80%" />
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 12, md: 16 }, mb: 4 }}>
      {/* Bandeau d'accueil */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          p: { xs: 2.5, sm: 3.5, md: 6 },
          mb: { xs: 3, sm: 4, md: 5 },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: { xs: 3, md: 4 },
          }}
        >
          <Skeleton
            variant="circular"
            sx={{
              width: { xs: 100, md: 120 },
              height: { xs: 100, md: 120 },
              bgcolor: 'var(--theme-white-20)',
              border: '3px solid var(--theme-white-50)',
              flexShrink: 0,
            }}
          />
          <Box sx={{ width: '100%', maxWidth: 600, textAlign: { xs: 'center', md: 'left' } }}>
            <Skeleton
              variant="text"
              height={48}
              sx={{ width: { xs: '70%', md: '45%' }, mb: 1, bgcolor: 'var(--theme-white-20)' }}
            />
            <Skeleton
              variant="text"
              sx={{ width: { xs: '95%', md: '85%' }, mb: 0.5, bgcolor: 'var(--theme-white-14)' }}
            />
            <Skeleton
              variant="text"
              sx={{ width: { xs: '80%', md: '60%' }, bgcolor: 'var(--theme-white-14)' }}
            />
          </Box>
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
        {[0, 1, 2, 3].map((index) => (
          <Grid size={statCardWidth} key={index}>
            <Card elevation={0} sx={{ height: '100%', borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Skeleton variant="text" width="55%" sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="70%" height={44} />
                  </Box>
                  <Skeleton
                    variant="circular"
                    sx={{ width: { xs: 48, sm: 56, md: 64 }, height: { xs: 48, sm: 56, md: 64 }, flexShrink: 0 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Contenu : bloc principal + colonne latérale */}
      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
              <Skeleton variant="text" width="35%" height={32} sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={72} />
                <Skeleton variant="rounded" height={72} />
                <Skeleton variant="rounded" height={72} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
              <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={140} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DashboardSkeleton;
