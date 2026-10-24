'use client';

/**
 * @file /components/account/QuickActions.tsx
 * @description Actions rapides de l'espace client, liées aux routes réelles.
 */

import Link from 'next/link';
import { Box, Card, CardActionArea, CardContent, Grid, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
  LocalShippingOutlined,
  PersonOutlined,
  PlaceOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import { accountSx } from '@/theme/account';

const QUICK_ACTIONS = [
  {
    label: 'Suivre une commande',
    description: 'Suivre mes livraisons',
    href: '/account/orders',
    icon: LocalShippingOutlined,
  },
  {
    label: 'Mon profil',
    description: 'Mes informations',
    href: '/account/profile',
    icon: PersonOutlined,
  },
  {
    label: 'Mes adresses',
    description: 'Où me faire livrer',
    href: '/account/addresses',
    icon: PlaceOutlined,
  },
  {
    label: 'Paramètres',
    description: 'Mot de passe et sécurité',
    href: '/settings/profile',
    icon: SettingsOutlined,
  },
];

export function QuickActions() {
  const theme = useTheme();

  return (
    <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2.5, sm: 3, md: 3.5 } }}>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;

        return (
          <Grid size={{ xs: 6, sm: 3 }} key={action.href}>
            <Card
              elevation={0}
              sx={[
                accountSx.surface,
                {
                  height: '100%',
                  transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 24px -16px ${alpha(theme.palette.primary.main, 0.45)}`,
                  },
                },
              ]}
            >
              <CardActionArea
                component={Link}
                href={action.href}
                sx={{ height: '100%', alignItems: 'stretch', p: { xs: 1.5, sm: 2 } }}
              >
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        flexShrink: 0,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {action.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {action.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default QuickActions;
