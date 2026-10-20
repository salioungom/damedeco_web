'use client';

/**
 * Squelette de la page d'accueil.
 *
 * Affiché par Next.js pendant la navigation vers `/` (le Server Component
 * attend les données du backend). Les dimensions reprennent celles du hero
 * (`HeroSection`) et de la grille de produits (`HomePage`) pour que la mise en
 * page ne bouge pas au moment où le contenu réel arrive.
 */

import { Box, Container, Skeleton, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import { NAVBAR_HEIGHT } from '@/components/Navigation';
import { tokens } from '@/theme/tokens';

const C = {
  surface: tokens.colors.surfaces.alt,
} as const;

export default function Loading() {
  const heroMinHeight = `calc(100dvh - ${NAVBAR_HEIGHT.md}px)`;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Box
        component="section"
        sx={{
          bgcolor: C.surface,
          minHeight: { xs: 'auto', lg: heroMinHeight },
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 2, sm: 3, md: 4 },
            pt: { xs: `calc(${NAVBAR_HEIGHT.xs}px + 20px)`, sm: 10, md: 11, lg: 13 },
            pb: { xs: 4, sm: 5, lg: 6 },
            maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: 'xl' },
          }}
        >
          <Grid
            container
            spacing={{ xs: 3, sm: 4, lg: 5 }}
            sx={{ alignItems: 'center', minHeight: { lg: `calc(${heroMinHeight} - 120px)` } }}
          >
            <Grid size={{ xs: 12, lg: 5 }} offset={{ lg: 1 }}>
              <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 725 } }}>
                {/* Pastille « lieu » */}
                <Skeleton
                  variant="rounded"
                  sx={{
                    width: { xs: 215, sm: 265 },
                    height: { xs: 34, sm: 38 },
                    borderRadius: '100px',
                    mb: { xs: 2.5, sm: 3, md: 3.5 },
                  }}
                />

                {/* Titre */}
                <Skeleton
                  variant="text"
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.75rem' },
                    fontWeight: 800,
                    width: '92%',
                    height: { xs: 44, sm: 54, md: 66 },
                    mb: { xs: 2.5, sm: 3 },
                  }}
                />

                {/* Paragraphe */}
                <Skeleton
                  variant="text"
                  sx={{ fontSize: { xs: 15, sm: 17, md: 18.75 }, width: '100%', mb: 0.5 }}
                />
                <Skeleton
                  variant="text"
                  sx={{
                    fontSize: { xs: 15, sm: 17, md: 18.75 },
                    width: '86%',
                    mb: { xs: 2.5, sm: 3, md: 3.5 },
                  }}
                />

                {/* Arguments */}
                <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 3.5, sm: 4.5 } }}>
                  {[0, 1, 2].map((index) => (
                    <Box key={index}>
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: { xs: 14, sm: 15.5, md: 16.875 }, width: '78%', mb: 0.5 }}
                      />
                      <Skeleton
                        variant="text"
                        sx={{ fontSize: { xs: 13, sm: 14, md: 14.5 }, width: '62%' }}
                      />
                    </Box>
                  ))}
                </Stack>

                {/* Boutons */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.25, sm: 1.5 }}
                  sx={{ mb: { xs: 3.5, sm: 4.5, md: 6 } }}
                >
                  <Skeleton
                    variant="rounded"
                    sx={{
                      width: { xs: '100%', sm: 205 },
                      height: { xs: 48, sm: 52 },
                      borderRadius: { xs: '10px', sm: '12.5px' },
                    }}
                  />
                  <Skeleton
                    variant="rounded"
                    sx={{
                      width: { xs: '100%', sm: 205 },
                      height: { xs: 48, sm: 52 },
                      borderRadius: { xs: '10px', sm: '12.5px' },
                    }}
                  />
                </Stack>
              </Box>
            </Grid>

            {/* Visuel */}
            <Grid size={{ xs: 12, lg: 6 }} sx={{ overflow: 'hidden', width: '100%' }}>
              <Box sx={{ mx: 'auto', width: '100%', maxWidth: { xs: '100%', sm: '90%', md: '85%', lg: 700 } }}>
                <Skeleton
                  variant="rounded"
                  sx={{
                    width: '100%',
                    aspectRatio: { xs: '4/3', sm: '16/9', md: '16/9' },
                    minHeight: { xs: 180, sm: 280, md: 325, lg: 375 },
                    borderRadius: { xs: '20px', sm: '25px', md: '30px' },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Produits populaires ──────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Skeleton variant="text" sx={{ fontSize: 12, width: 110, mb: { xs: 1, sm: 1.25 } }} />
          <Skeleton
            variant="text"
            sx={{
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.1rem' },
              fontWeight: 800,
              width: 280,
              mb: { xs: 1, sm: 1.25, md: 1.5 },
            }}
          />
          <Skeleton
            variant="text"
            sx={{ fontSize: { xs: 15, sm: 16.5, md: 18 }, width: { xs: '90%', sm: '55%' }, mb: 4 }}
          />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: { xs: 1.5, md: 2.5 },
            }}
          >
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} variant="rounded" height={475} sx={{ borderRadius: '17.5px' }} />
            ))}
          </Box>
        </Container>
      </Box>
    </>
  );
}
