'use client';

/**
 * @file /components/account/StatsCards.tsx
 * @description Quatre indicateurs de l'espace client (commandes, total dépensé,
 * commandes en cours, favoris).
 *
 * Les valeurs proviennent exclusivement du hook `useAccountStats` : aucun
 * calcul n'est refait ici.
 */

import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ScheduleOutlined,
  ShoppingBagOutlined,
  StarBorderOutlined,
  TrendingUp,
} from '@mui/icons-material';
import { useAccountStats } from '@/hooks/useAccountStats';
import { formatFcfa } from '@/lib/format';
import { accountSx } from '@/theme/account';

export function StatsCards() {
  const { data, loading, error, retry } = useAccountStats();
  const theme = useTheme();

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{ mb: { xs: 2.5, sm: 3, md: 3.5 } }}
        action={
          <Button color="inherit" size="small" onClick={retry}>
            Réessayer
          </Button>
        }
      >
        Impossible de charger vos statistiques pour le moment.
      </Alert>
    );
  }

  const cards = [
    {
      label: 'Vos commandes',
      value: data ? String(data.totalOrders) : '0',
      href: '/account/orders',
      icon: <ShoppingBagOutlined fontSize="small" />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Total dépensé',
      value: data ? formatFcfa(data.totalSpent) : formatFcfa(0),
      href: '/account/orders',
      icon: <TrendingUp fontSize="small" />,
      color: theme.palette.success.main,
    },
    {
      label: 'En cours',
      value: data ? String(data.pendingOrders) : '0',
      href: '/account/orders',
      icon: <ScheduleOutlined fontSize="small" />,
      color: theme.palette.warning.main,
    },
    {
      label: 'Favoris',
      value: data ? String(data.totalFavorites) : '0',
      href: '/favorites',
      icon: <StarBorderOutlined fontSize="small" />,
      color: theme.palette.info.main,
    },
  ];

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2.5, sm: 3, md: 3.5 } }}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.label}>
          <Card
            elevation={0}
            sx={[
              accountSx.surface,
              {
                height: '100%',
                transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  borderColor: card.color,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 24px -16px ${alpha(theme.palette.primary.main, 0.45)}`,
                },
              },
            ]}
          >
            <CardActionArea
              component={Link}
              href={card.href}
              sx={{ height: '100%', alignItems: 'stretch', p: { xs: 1.75, sm: 2.25 } }}
            >
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="overline"
                      sx={{ ...accountSx.blockEyebrow, display: 'block' }}
                    >
                      {card.label}
                    </Typography>
                    {loading ? (
                      <Skeleton variant="text" width={72} height={32} />
                    ) : (
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: { xs: '1.25rem', sm: '1.375rem' } }}
                      >
                        {card.value}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: alpha(card.color, 0.1),
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default StatsCards;
