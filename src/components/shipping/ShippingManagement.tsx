'use client';

import { Box, Paper, Typography } from '@mui/material';
import { LocalShippingOutlined } from '@mui/icons-material';
import ShippingSettingsForm from './ShippingSettingsForm';
import { BRAND_BLUE } from '@/theme';

const BRAND = {
  primary: BRAND_BLUE,
  dark: '#042C53',
  light: '#E6F1FB',
  border: '#D4E8F7',
  muted: '#5F6B7A',
} as const;

export interface ShippingManagementProps {
  onSaved?: () => void;
}

export default function ShippingManagement({ onSaved }: ShippingManagementProps = {}) {
  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: { xs: 2, sm: 2.5 },
          borderRadius: '20px',
          border: `1px solid ${BRAND.border}`,
          bgcolor: BRAND.light,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 55,
            height: 55,
            borderRadius: '15px',
            bgcolor: 'rgba(24, 95, 165, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: BRAND.primary,
          }}
        >
          <LocalShippingOutlined />
        </Box>
        <Box>
          <Typography sx={{ fontSize: { xs: 25, sm: 30 }, fontWeight: 700, color: BRAND.dark }}>
            Frais de livraison
          </Typography>
          <Typography sx={{ fontSize: 17.5, color: BRAND.muted }}>
            Configurez le seuil de livraison gratuite et les tarifs standard
          </Typography>
        </Box>
      </Paper>
      <ShippingSettingsForm onSaved={onSaved} />
    </Box>
  );
}
