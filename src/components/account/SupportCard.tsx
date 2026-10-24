'use client';

/**
 * @file /components/account/SupportCard.tsx
 * @description Carte d'assistance : oriente vers la page de contact.
 */

import Link from 'next/link';
import { Box, Button, Stack, Typography, alpha, useTheme } from '@mui/material';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import { accountSx } from '@/theme/account';

export function SupportCard() {
  const theme = useTheme();

  return (
    <Box
      sx={[
        accountSx.surface,
        {
          position: 'relative',
          overflow: 'hidden',
          p: { xs: 2, sm: 2.5 },
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.light, 0.12)} 100%)`,
        },
      ]}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -30,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: alpha(theme.palette.info.main, 0.05),
        }}
      />

      <Stack direction="row" spacing={1.5} sx={{ position: 'relative', alignItems: 'flex-start' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: 'background.paper',
            color: 'info.main',
            boxShadow: theme.shadows[2],
          }}
        >
          <HeadsetMicOutlinedIcon fontSize="small" />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5 }}>
            Besoin d&apos;assistance ?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.55 }}>
            Notre équipe de support client est disponible pour répondre à vos questions 7j/7.
          </Typography>
          <Button
            component={Link}
            href="/contact"
            variant="contained"
            color="info"
            disableElevation
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 13 }}
          >
            Contacter le support
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default SupportCard;
