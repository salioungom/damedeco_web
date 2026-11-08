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
import { NAVBAR_HEIGHT, CONTENT_CONTAINER_SX } from '@/components/Navigation';
import { tokens } from '@/theme/tokens';

const C = {
  surface: tokens.colors.surfaces.alt,
} as const;

function ProductGridSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(3, minmax(0, 1fr))',
          md: 'repeat(4, minmax(0, 1fr))',
        },
        gap: { xs: '12px', sm: '16px', md: '24px' },
        alignItems: 'stretch',
      }}
    >
      {[0, 1, 2, 3].map((index) => (
        <Box
          key={index}
          sx={{
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '14px',
            bgcolor: 'background.paper',
          }}
        >
          <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '4 / 5' }} />
          <Box sx={{ p: '10px 12px 12px' }}>
            <Skeleton variant="text" sx={{ fontSize: 10, width: '72%' }} />
            <Skeleton variant="text" sx={{ fontSize: 14, width: '88%', mt: 0.5 }} />
            <Skeleton variant="text" sx={{ fontSize: 14, width: '64%' }} />
            <Skeleton variant="text" sx={{ fontSize: 15, width: '55%', mt: 1 }} />
            <Stack direction="row" sx={{ mt: 1, justifyContent: 'space-between' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="circular" width={40} height={40} />
            </Stack>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

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
          maxWidth={false}
          disableGutters
          sx={{
            ...CONTENT_CONTAINER_SX,
            position: 'relative',
            zIndex: 1,
            pt: 6,
            pb: 6,
            minHeight: { lg: heroMinHeight },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Grid
            container
            spacing={{ xs: 3, sm: 4, lg: 5 }}
            sx={{ alignItems: 'center', minHeight: { lg: `calc(${heroMinHeight} - 120px)` } }}
          >
            <Grid size={{ xs: 12, lg: 5 }}>
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
            <Grid size={{ xs: 12, lg: 7 }} sx={{ overflow: 'hidden', width: '100%' }}>
              <Box sx={{ mx: 'auto', width: '100%', maxWidth: { xs: '100%', sm: '90%', md: '85%', lg: 800 } }}>
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

      {/* ── Nouveautés ──────────────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 5, md: 8 }, bgcolor: C.surface }}>
        <Container
          maxWidth={false}
          disableGutters
          sx={{ ...CONTENT_CONTAINER_SX, px: { xs: '20px', sm: 3.2, lg: 4.8, xl: 6.4 } }}
        >
          <Skeleton variant="text" sx={{ fontSize: 11, width: 110, mb: 1 }} />
          <Skeleton
            variant="text"
            sx={{ fontSize: { xs: '1.375rem', sm: '1.75rem', md: '2.1rem' }, width: '75%', mb: 3 }}
          />
          <ProductGridSkeleton />
        </Container>
      </Box>

      {/* ── Produits populaires ──────────────────────────────────────────── */}
      <Box component="section" sx={{ py: { xs: 5, md: 8 }, bgcolor: 'background.paper' }}>
        <Container
          maxWidth={false}
          disableGutters
          sx={{ ...CONTENT_CONTAINER_SX, px: { xs: '20px', sm: 3.2, lg: 4.8, xl: 6.4 } }}
        >
          <Skeleton variant="text" sx={{ fontSize: 11, width: 110, mb: 1 }} />
          <Skeleton
            variant="text"
            sx={{
              fontSize: { xs: '1.375rem', sm: '1.75rem', md: '2.1rem' },
              fontWeight: 800,
              width: 280,
              mb: { xs: 1, sm: 1.25, md: 1.5 },
            }}
          />
          <Skeleton
            variant="text"
            sx={{ fontSize: { xs: 15, sm: 16.5, md: 18 }, width: { xs: '90%', sm: '55%' }, mb: 4 }}
          />

          <ProductGridSkeleton />
        </Container>
      </Box>
    </>
  );
}
