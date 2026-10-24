'use client';

/**
 * @file /components/account/FavoritesList.tsx
 * @description Favoris du client : image, prix, disponibilité et ajout au
 * panier (même action que la page boutique).
 *
 * Le bloc est entièrement masqué lorsqu'aucun favori n'existe : pas de tuiles
 * vides.
 */

import Image from 'next/image';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { FavoriteBorderOutlined, ShoppingCartOutlined } from '@mui/icons-material';
import { useAccountFavorites } from '@/hooks/useAccountFavorites';
import { useStore } from '@/store/useStore';
import { formatFcfa } from '@/lib/format';
import { resolveOriginalPrice } from '@/lib/pricing';
import { accountSx } from '@/theme/account';

export function FavoritesList() {
  const { data, loading, error, retry } = useAccountFavorites(8);
  const addToCart = useStore((state) => state.addToCart);
  const theme = useTheme();
  const userType = useStore((state) => state.user?.type || 'retail');

  const fmt = (value: number) => formatFcfa(value);

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
        Impossible de charger vos favoris pour le moment.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ mb: { xs: 2.5, sm: 3, md: 3.5 } }}>
        <Skeleton variant="text" width={180} height={32} sx={{ mb: 1.5 }} />
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {[0, 1, 2, 3].map((index) => (
            <Grid size={{ xs: 6, md: 3 }} key={index}>
              <Skeleton variant="rounded" height={148} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Aucun favori : le bloc est masqué (pas de tuiles vides).
  if (data.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: { xs: 2.5, sm: 3, md: 3.5 } }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.error.main, 0.1),
            color: 'error.main',
          }}
        >
          <FavoriteBorderOutlined fontSize="small" />
        </Box>
        <Typography variant="h6" sx={accountSx.blockTitle}>
          Mes favoris
        </Typography>
      </Stack>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {data.map((favorite) => {
          const product = favorite.product;

          // Prix d'origine (prix barré) : lu sous tous les alias possibles
          // renvoyés par l'API (`compare_price`, `original_price`, ...) et
          // converti en nombre. `null` si l'API n'expose pas de prix
          // d'origine ou si celui-ci n'est pas supérieur au prix actuel.
          const originalPrice = resolveOriginalPrice(product, Number(product.price));

          const discountPercentage =
            originalPrice && originalPrice > Number(product.price)
              ? Math.round(
                  ((originalPrice - Number(product.price)) / originalPrice) * 100,
                )
              : 0;

          const savingsAmount =
            originalPrice && originalPrice > Number(product.price)
              ? originalPrice - Number(product.price)
              : 0;

          return (
            <Grid size={{ xs: 6, md: 3 }} key={favorite.id}>
              <Card elevation={0} sx={[accountSx.surface, { height: '100%' }]}>
                <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, '&:last-child': { pb: { xs: 1.25, sm: 1.5 } } }}>
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4 / 3',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: alpha(theme.palette.text.disabled, 0.08),
                      mb: 1.25,
                    }}
                  >
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 600px) 45vw, (max-width: 1200px) 22vw, 300px"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.disabled',
                        }}
                      >
                        <ShoppingCartOutlined />
                      </Box>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35, mb: 0.5 }} noWrap>
                    {product.name}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline', columnGap: 1.25, rowGap: 0, minWidth: 0, mb: 1.25 }}>
            {originalPrice && originalPrice > Number(product.price) && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ textDecoration: 'line-through', mb: 0, fontWeight: 500, fontSize: { xs: '0.78rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
              >
                {fmt(originalPrice)}
              </Typography>
            )}
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700 }}
                    >
                      {formatFcfa(product.price)}
                    </Typography>
                  </Box>

                  {originalPrice && originalPrice > Number(product.price) && userType !== 'wholesale' && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        columnGap: 1,
                        rowGap: 0.5,
                        flexWrap: 'wrap',
                        mb: 1.25,
                        minWidth: 0,
                      }}
                    >
                      <Chip
                        label={`-${discountPercentage}%`}
                        size="small"
                        color="error"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', height: 25, flexShrink: 0 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap', color: '#067647' }}
                      >
                        Économisez {fmt(savingsAmount)}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    fullWidth
                    size="small"
                    variant="contained"
                    disableElevation
                    startIcon={<ShoppingCartOutlined fontSize="small" />}
                    onClick={() => void addToCart({ id: product.id }, 1)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 13 }}
                  >
                    Ajouter au panier
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

export default FavoritesList;
