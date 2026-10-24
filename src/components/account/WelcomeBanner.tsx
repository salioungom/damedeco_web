'use client';

/**
 * @file /components/account/WelcomeBanner.tsx
 * @description Bandeau d'accueil de l'espace client : salutation (Bonjour avant
 * 18 h, Bonsoir ensuite), prénom et initiales.
 */

import { useEffect, useState } from 'react';
import { Avatar, Box, Stack, Typography, alpha, useTheme } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/initials';

function getGreeting(): string {
  return new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';
}

export function WelcomeBanner() {
  const { user } = useAuth();
  const theme = useTheme();

  // La salutation dépend de l'heure locale : elle est ajustée après le montage
  // pour que le HTML rendu par le serveur et le premier rendu client concordent
  // (aucune erreur d'hydratation).
  const [greeting, setGreeting] = useState('Bonjour');
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const fullName = user?.full_name;
  const initials = getInitials(user?.full_name, user?.email);

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        p: { xs: 2.5, sm: 3.5, md: 4 },
        mb: { xs: 2.5, sm: 3, md: 3.5 },
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.dark, 0.92)} 100%)`,
        color: 'primary.contrastText',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -40,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: alpha(theme.palette.common.white, 0.06),
        }}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, sm: 2.5 }}
        sx={{ position: 'relative', alignItems: { xs: 'center', sm: 'center' }, textAlign: { xs: 'center', sm: 'left' } }}
      >
        <Avatar
          sx={{
            width: { xs: 72, sm: 84 },
            height: { xs: 72, sm: 84 },
            bgcolor: alpha(theme.palette.common.white, 0.16),
            border: `2px solid ${alpha(theme.palette.common.white, 0.35)}`,
            color: 'inherit',
            fontWeight: 700,
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
          }}
        >
          {initials}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            {greeting}
            {fullName ? `, ${fullName}` : ''}
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 0.75, opacity: 0.9, maxWidth: 560, fontSize: { xs: 13.5, sm: 14.5, md: 15.5 }, lineHeight: 1.6 }}
          >
            Bienvenue sur votre espace personnel. Gérez vos commandes, vos favoris et vos paramètres en
            toute simplicité.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export default WelcomeBanner;
