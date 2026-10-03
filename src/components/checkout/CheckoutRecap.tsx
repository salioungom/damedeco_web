'use client';

import { useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Divider,
  Stack,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  DeleteOutlined as Trash2,
  Add,
  Remove,
  ShoppingCartOutlined,
  ArrowForward,
} from '@mui/icons-material';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { ClientOnly } from '@/components/ClientOnly';
import { CartItemWithProduct } from '@/hooks/useCartWithProducts';
import { useStore } from '@/store/useStore';
import { getImageUrl } from '@/lib/imageUtils';
import { formatFcfa } from '@/lib/format';

interface CheckoutRecapProps {
  items: CartItemWithProduct[];
  onContinue: () => void;
  onBackToCart: () => void;
  shippingLoading: boolean;
  checkingAuth?: boolean;
}

export function CheckoutRecap({ items, onContinue, onBackToCart, shippingLoading, checkingAuth = false }: CheckoutRecapProps) {
  const theme = useTheme();
  const brandBlue = theme.palette.primary.main;
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (!item.product) return sum;
        const price =
          item.price_type === 'wholesale'
            ? item.product.wholesale_price
            : item.product.price;
        return sum + (price || 0) * item.quantity;
      }, 0),
    [items]
  );

  const total = subtotal;

  const handleQuantityChange = async (item: CartItemWithProduct, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    await updateQuantity(item.product_id.toString(), newQty);
  };

  const handleRemove = async (item: CartItemWithProduct) => {
    await removeFromCart(item.product_id.toString());
  };

  if (items.length === 0) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', px: 2 }}>
          <ShoppingCartOutlined sx={{ fontSize: { xs: 60, sm: 70, md: 80 }, color: 'text.disabled', mb: { xs: 1.5, sm: 2 } }} />
          <Typography variant="h6" fontWeight={600} color="text.secondary" gutterBottom sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }}>
            Votre panier est vide
          </Typography>
          <Button variant="contained" onClick={onBackToCart} sx={{ borderRadius: { xs: 2, sm: 2.25, md: 2.5 }, mt: { xs: 1, sm: 1.25 }, fontSize: { xs: 14, sm: 15, md: 16 } }}>
            Retour à la boutique
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3.5, md: 4, lg: 5 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 3, sm: 3.5, md: 4 } }}>
          {/* Liste des articles */}
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: { xs: 2, sm: 2.5, md: 3 }, fontSize: { xs: 18, sm: 19, md: 20 } }}>
              {items.length} article{items.length > 1 ? 's' : ''}
            </Typography>

            <Stack spacing={{ xs: 1.5, sm: 2 }}>
              {items.map((item) => {
                if (!item.product) return null;
                const price =
                  item.price_type === 'wholesale'
                    ? item.product.wholesale_price
                    : item.product.price;
                const lineTotal = (price || 0) * item.quantity;

                return (
                  <Box
                    key={item.id || item.product_id}
                    sx={{
                      display: 'flex',
                      gap: { xs: 1.5, sm: 2 },
                      p: { xs: 2, sm: 2.25, md: 2.5 },
                      borderRadius: { xs: 2.5, sm: 2.75, md: 3 },
                      bgcolor: 'background.paper',
                      border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: alpha(brandBlue, 0.3),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 80, sm: 95, md: 112.5 },
                        height: { xs: 80, sm: 95, md: 112.5 },
                        borderRadius: { xs: 1.5, sm: 1.75, md: 2 },
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                        flexShrink: 0,
                        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                      }}
                    >
                      <ImageWithFallback
                        src={getImageUrl(item.product.cover_image_url || item.product.images?.[0]?.image_url)}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: { xs: 0.75, sm: 1 } }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }}>
                            {item.product.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleRemove(item)}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08) },
                          }}
                        >
                          <Trash2 fontSize="small" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: { xs: 1, sm: 1.25, md: 1.5 } }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 0.35, sm: 0.5 },
                            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                            borderRadius: { xs: 1.25, sm: 1.35, md: 1.5 },
                            overflow: 'hidden',
                          }}
                        >
                          <ClientOnly>
                            <IconButton
                              aria-label="Diminuer la quantité"
                              size="small"
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={item.quantity <= 1}
                              sx={{ width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 }, borderRadius: 0 }}
                            >
                              <Remove fontSize="small" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                            </IconButton>
                          </ClientOnly>
                          <Typography variant="body2" fontWeight={600} sx={{ px: { xs: 1, sm: 1.25, md: 1.5 }, minWidth: { xs: 24, sm: 27, md: 30 }, textAlign: 'center', fontSize: { xs: 13, sm: 14, md: 15 } }}>
                            {item.quantity}
                          </Typography>
                          <ClientOnly>
                            <IconButton
                              aria-label="Augmenter la quantité"
                              size="small"
                              onClick={() => handleQuantityChange(item, 1)}
                              sx={{ width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 }, borderRadius: 0 }}
                            >
                              <Add fontSize="small" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                            </IconButton>
                          </ClientOnly>
                        </Box>

                        <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }}>
                          {formatFcfa(lineTotal)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* Résumé */}
          <Box>
            <Box
              sx={{
                p: { xs: 2.5, sm: 3, md: 3.5 },
                borderRadius: { xs: 2.5, sm: 2.75, md: 3 },
                bgcolor: 'background.paper',
                border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                position: { lg: 'sticky' },
                top: { lg: 100 },
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ mb: { xs: 2, sm: 2.5, md: 3 }, fontSize: { xs: 18, sm: 19, md: 20 } }}>
                Résumé
              </Typography>

              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 13, sm: 14, md: 15 } }}>
                    Sous-total
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: 13, sm: 14, md: 15 } }}>
                    {formatFcfa(subtotal)}
                  </Typography>
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ fontSize: { xs: 16, sm: 17, md: 18 } }}>
                    Total
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="primary" sx={{ fontSize: { xs: 16, sm: 17, md: 18 } }}>
                    {formatFcfa(total)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexDirection: 'column', pt: { xs: 0.75, sm: 1 } }}>
                  <Button
                    variant="outlined"
                    onClick={onBackToCart}
                    sx={{
                      borderRadius: { xs: 2, sm: 2.25, md: 2.5 },
                      py: { xs: 1.15, sm: 1.25, md: 1.3 },
                      fontWeight: 600,
                      borderColor: alpha(theme.palette.divider, 0.8),
                      fontSize: { xs: 14, sm: 15, md: 16 },
                    }}
                  >
                    Modifier le panier
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={onContinue}
                    disabled={checkingAuth}
                    endIcon={checkingAuth ? <CircularProgress size={{ xs: 18, sm: 20 }} color="inherit" /> : <ArrowForward sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />}
                    sx={{
                      borderRadius: { xs: 2, sm: 2.25, md: 2.5 },
                      py: { xs: 1.35, sm: 1.45, md: 1.6 },
                      fontWeight: 700,
                      fontSize: { xs: 15.5, sm: 17, md: 18.75 },
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}
                  >
                    {checkingAuth ? 'Vérification...' : 'Continuer'}
                  </Button>
                </Box>

                <Typography
                  variant="caption"
                  align="center"
                  color="text.secondary"
                  sx={{ display: 'block', lineHeight: { xs: 1.4, sm: 1.45, md: 1.5 }, pt: { xs: 0.35, sm: 0.4, md: 0.5 }, fontSize: { xs: 11, sm: 11.5, md: 12 } }}
                >
                  En continuant, vous acceptez nos conditions de vente
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
