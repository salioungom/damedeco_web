'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Container, Paper, CircularProgress } from '@mui/material';
import { securityAPI } from '@/lib/security';

export default function AdminSecurityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await securityAPI.getSecuritySummary();
        setLoading(false);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Erreur de chargement');
        }
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Rediriger vers le vrai dashboard admin
  router.push('/admin/dashboard');
  
  return (
    <Container>
      <Typography>Chargement...</Typography>
    </Container>
  );
}
