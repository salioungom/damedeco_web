'use client';

import { useRouter } from 'next/navigation';
import { Box, Button, Typography } from '@mui/material';
import NextLink from 'next/link';
import { FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 3, sm: 4 },
        py: { xs: 8, md: 10 },
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 520, mx: 'auto' }}>
        <Typography
          component="p"
          sx={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: tokens.colors.laiton,
            mb: 3,
          }}
        >
          DameDéco · Erreur 404
        </Typography>

        <Typography
          sx={{
            fontFamily: FONT_FRAUNCES,
            fontSize: { xs: 110, sm: 140, md: 170 },
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: 'text.primary',
            mb: 3,
          }}
        >
          404
        </Typography>

        <Box
          sx={{
            width: 48,
            height: 2,
            bgcolor: tokens.colors.laiton,
            mx: 'auto',
            mb: 3,
            borderRadius: 1,
          }}
        />

        <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: 32, sm: 40 } }}>
          Page introuvable.
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <Button
            component={NextLink}
            href="/"
            variant="contained"
            color="primary"
            sx={{ height: 48, px: 4 }}
          >
            Retour à l&apos;accueil
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => router.back()}
            sx={{ height: 48, px: 4 }}
          >
            Revenir en arrière
          </Button>
        </Box>
      </Box>
    </Box>
  );
}