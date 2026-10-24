'use client';

/**
 * @file /components/account/RecentOrders.tsx
 * @description Dernières commandes du client.
 *
 * Les données proviennent du hook `useRecentOrders` ; le composant ne fait
 * aucun calcul. Si la miniature n'est pas disponible, une icône de repli est
 * affichée (jamais d'image cassée).
 */

import Link from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ChevronRight,
  Inventory2Outlined,
  ShoppingBagOutlined,
} from '@mui/icons-material';
import { useRecentOrders } from '@/hooks/useRecentOrders';
import { formatDateFr, formatFcfa } from '@/lib/format';
import { OrderService } from '@/services/order.service';
import { accountSx, getStatusAccent } from '@/theme/account';

export function RecentOrders() {
  const { data, loading, error, retry } = useRecentOrders(3);
  const theme = useTheme();

  return (
    <Box
      sx={[
        accountSx.surface,
        {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        },
      ]}
    >
      <Box sx={accountSx.blockHeader}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
            <Inventory2Outlined fontSize="small" />
          </Avatar>
          <Typography variant="h6" sx={accountSx.blockTitle}>
            Commandes récentes
          </Typography>
        </Stack>
        <Button
          component={Link}
          href="/account/orders"
          size="small"
          endIcon={<ChevronRight />}
          sx={{ flexShrink: 0, fontWeight: 600, textTransform: 'none', fontSize: 13 }}
        >
          Voir tout
        </Button>
      </Box>

      <Box sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1 }}>
        {error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={retry}>
                Réessayer
              </Button>
            }
          >
            Impossible de charger vos commandes pour le moment.
          </Alert>
        ) : loading ? (
          <Stack spacing={1.25}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} variant="rounded" height={78} />
            ))}
          </Stack>
        ) : data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 1.5,
                bgcolor: alpha(theme.palette.text.disabled, 0.08),
                color: 'text.secondary',
              }}
            >
              <ShoppingBagOutlined sx={{ fontSize: 30 }} />
            </Avatar>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Aucune commande trouvée
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Votre historique de commandes est vide.
            </Typography>
            <Button component={Link} href="/shop" variant="contained" disableElevation>
              Commencer à acheter
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            {data.map((order) => {
              const statusColor = OrderService.getStatusColor(order.status);

              return (
                <Card
                  key={order.id}
                  elevation={0}
                  sx={accountSx.listItem}
                >
                  <CardActionArea
                    component={Link}
                    href={`/account/orders/${order.id}`}
                    sx={{ p: { xs: 1.25, sm: 1.5 } }}
                  >
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                      <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, sm: 5 }}>
                          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
                            {order.firstItemImage ? (
                              <Avatar
                                src={order.firstItemImage}
                                alt=""
                                variant="rounded"
                                sx={{ width: 44, height: 44, flexShrink: 0 }}
                              />
                            ) : (
                              <Avatar
                                variant="rounded"
                                sx={{
                                  width: 44,
                                  height: 44,
                                  flexShrink: 0,
                                  bgcolor: alpha(theme.palette.text.disabled, 0.08),
                                  color: 'text.secondary',
                                }}
                              >
                                <Inventory2Outlined fontSize="small" />
                              </Avatar>
                            )}
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.65rem' }}
                              >
                                Commande
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                                {order.orderNumber}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        <Grid size={{ xs: 4, sm: 3 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.65rem' }}
                          >
                            Date
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                            {formatDateFr(order.createdAt)}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 4, sm: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.65rem' }}
                          >
                            Montant
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {formatFcfa(order.totalAmount)}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 4, sm: 2 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, fontSize: '0.65rem' }}
                          >
                            Statut
                          </Typography>
                          <Chip
                            size="small"
                            label={OrderService.getStatusLabel(order.status)}
                            sx={{
                              mt: 0.25,
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: 1,
                              bgcolor: alpha(getStatusAccent(theme, statusColor), 0.1),
                              color: getStatusAccent(theme, statusColor),
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default RecentOrders;
