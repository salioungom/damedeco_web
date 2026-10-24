'use client';

/**
 * @file /components/account/OrderTracker.tsx
 * @description Suivi des commandes en cours (non livrées) : une étape par
 * commande, avec la date de création de la commande.
 *
 * Les étapes non atteintes ne portent aucune date : l'API ne fournit pas
 * d'horodatage par étape.
 */

import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { formatDateFr } from '@/lib/format';
import { OrderService } from '@/services/order.service';
import { TRACKING_STEPS } from '@/services/stats.service';
import { accountSx, getStatusAccent } from '@/theme/account';

export function OrderTracker() {
  const { data, loading, error, retry } = useOrderTracking();
  const theme = useTheme();

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            Réessayer
          </Button>
        }
      >
        Impossible de charger le suivi de vos commandes pour le moment.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={[accountSx.surface, { p: { xs: 2, sm: 2.5 } }]}>
        <Skeleton variant="text" width={160} height={28} sx={{ mb: 1.5 }} />
        <Skeleton variant="rounded" height={96} />
      </Box>
    );
  }

  // Aucune commande en cours : le bloc est masqué (pas de tuiles vides).
  if (data.length === 0) {
    return null;
  }

  return (
    <Box sx={[accountSx.surface, { p: { xs: 2, sm: 2.5 } }]}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
          }}
        >
          <LocalShippingOutlinedIcon fontSize="small" />
        </Box>
        <Typography variant="h6" sx={accountSx.blockTitle}>
          Suivi de mes commandes
        </Typography>
      </Stack>

      <Stack spacing={2.5}>
        {data.map((tracking) => {
          const activeStep = Math.max(tracking.step, 0);
          const statusColor = OrderService.getStatusColor(tracking.status);

          return (
            <Box key={tracking.orderId}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 1 }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                    {tracking.orderNumber}
                  </Typography>
                  <Chip
                    size="small"
                    label={OrderService.getStatusLabel(tracking.status)}
                    sx={{
                      height: 22,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      borderRadius: 1,
                      bgcolor: alpha(getStatusAccent(theme, statusColor), 0.1),
                      color: getStatusAccent(theme, statusColor),
                    }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Commandée le {formatDateFr(tracking.createdAt)}
                </Typography>
              </Stack>

              <Stepper
                activeStep={activeStep}
                alternativeLabel
                sx={{ '& .MuiStepLabel-label': { fontSize: { xs: 10, sm: 12 } } }}
              >
                {TRACKING_STEPS.map((step) => (
                  <Step key={step.value}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Button
                component={Link}
                href={`/account/orders/${tracking.orderId}`}
                size="small"
                sx={{ mt: 0.5, px: 0, fontWeight: 600, textTransform: 'none', fontSize: 13 }}
              >
                Voir le détail de la commande
              </Button>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export default OrderTracker;
