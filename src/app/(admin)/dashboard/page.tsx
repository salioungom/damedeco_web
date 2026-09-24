'use client';

import { AdminDashboard } from '@/components/AdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';

const BRAND = {
  primary: tokens.colors.brand.main,
  dark: tokens.colors.surfaces.inverse,
  surface: tokens.colors.surfaces.default,
  muted: tokens.colors.text.secondary,
} as const;

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          gap: 2,
          bgcolor: BRAND.surface,
        }}
      >
        <CircularProgress sx={{ color: BRAND.primary }} size={48} />
        <Typography sx={{ color: BRAND.muted, fontWeight: 500 }}>
          Chargement du dashboard…
        </Typography>
      </Box>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return <AdminDashboard />;
}
