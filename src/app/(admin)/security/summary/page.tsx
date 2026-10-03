'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Security,
  People,
  Warning,
  Timeline,
} from '@mui/icons-material';
import { securityAPI } from '@/lib/security';
import { RequireRole } from '@/components/RequireRole';

interface SecuritySummary {
  totalUsers: number;
  activeSessions: number;
  recentEvents: number;
  securityAlerts: number;
}

export default function SecuritySummaryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<SecuritySummary | null>(null);

  useEffect(() => {
    const fetchSecuritySummary = async () => {
      try {
        const response = await securityAPI.getSecuritySummary();
        setSummary(response.data);
        setLoading(false);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError(err.response?.data?.message || 'Erreur de chargement');
        }
        setLoading(false);
      }
    };

    fetchSecuritySummary();
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" variant="outlined" sx={{ animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <RequireRole allowedRoles={['admin', 'superadmin']}>
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Tableau de Bord Sécurité
      </Typography>
      
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Utilisateurs
                  </Typography>
                  <Typography variant="h5">
                    {summary?.totalUsers || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Security color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Sessions Actives
                  </Typography>
                  <Typography variant="h5">
                    {summary?.activeSessions || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Timeline color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Événements Récents
                  </Typography>
                  <Typography variant="h5">
                    {summary?.recentEvents || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Alertes Sécurité
                  </Typography>
                  <Typography variant="h5">
                    {summary?.securityAlerts || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
    </RequireRole>
  );
}
