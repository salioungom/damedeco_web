'use client';

import { useEffect, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Remove as Minus,
  Add as Plus,
  Delete as Trash2,
  ShoppingBag,
  Close as CloseIcon,
  ArrowForward,
} from '@mui/icons-material';
import { useStore } from '@/store/useStore';
import { useCartWithProducts } from '@/hooks/useCartWithProducts';
import { useRouter } from 'next/navigation';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/lib/imageUtils';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/delivery';
import { formatFcfa } from '@/lib/format';


export function CartDrawer() {
  const isCartOpen = useStore((s) => s.isCartOpen);
  const toggleCart = useStore((s) => s.toggleCart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const cartLoading = useStore((s) => s.cartLoading);
  const cartError = useStore((s) => s.cartError);
  const loadCart = useStore((s) => s.loadCart);
  const { cart: cartWithProducts } = useCartWithProducts();
  const router = useRouter();
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();

  const golden = theme.palette.golden?.main || theme.palette.primary.main;

  useEffect(() => {
    if (isCartOpen && cartWithProducts.length === 0) {
      loadCart();
    }
  }, [isCartOpen, cartWithProducts.length, loadCart]);

  const subtotal = useMemo(() =>
    (cartWithProducts || []).reduce((sum: number, item) => {
      const price = item.product 
        ? (item.price_type === 'wholesale' ? (item.product.wholesale_price || 0) : (item.product.price || 0))
        : (Number(item.unit_price) || 0);
      return sum + price * item.quantity;
    }, 0),
  [cartWithProducts]);

  const itemCount = cartWithProducts?.length ?? 0;

  const handleCheckout = () => {
    if (itemCount === 0) return;
    toggleCart(false);
    router.push('/checkout');
  };

  return (
    <Drawer
      anchor="right"
      open={isCartOpen}
      onClose={() => toggleCart(false)}
      slotProps={{
        paper: {
          sx: { width: '100%', maxWidth: 562.5, border: 'none' },
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            bgcolor: 'background.paper',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>Panier</Typography>
            <Typography variant="body2" color="text.secondary">
              {itemCount} article{itemCount > 1 ? 's' : ''}
            </Typography>
          </Box>
          <IconButton onClick={() => toggleCart(false)} sx={{ borderRadius: 2.5 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {cartError && (
          <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.error.main, 0.08) }}>
            <Typography variant="body2" color="error" fontWeight={500}>{cartError}</Typography>
          </Box>
        )}

        {itemCount === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2.5, p: 4 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              }}
            >
              <ShoppingBag sx={{ fontSize: 45, color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="body1" fontWeight={600}>
              {cartLoading ? 'Chargement...' : 'Votre panier est vide'}
            </Typography>
            {!cartLoading && (
              <Button 
                variant="contained"
                onClick={() => {
                  toggleCart(false);
                  window.location.href = '/shop';
                }}
                sx={{ borderRadius: 2.5, fontWeight: 600 }}
              >
                Continuer mes achats
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
              <Stack spacing={2}>
                {cartWithProducts.map((item) => {
                  const price = item.product 
                    ? (item.price_type === 'wholesale' ? (item.product.wholesale_price || 0) : (item.product.price || 0))
                    : (Number(item.unit_price) || 0);

                  return (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2.5,
                        bgcolor: 'background.paper',
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        transition: 'border-color 0.2s ease',
                        '&:hover': { borderColor: alpha(golden, 0.2) },
                      }}
                    >
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          borderRadius: 1.875,
                          overflow: 'hidden',
                          bgcolor: 'action.hover',
                          flexShrink: 0,
                          border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                        }}
                      >
                        {item.product ? (
                          <ImageWithFallback
                            src={getImageUrl(item.product.cover_image_url)}
                            alt={item.product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingBag sx={{ fontSize: 35, color: 'text.disabled' }} />
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {item.product ? item.product.name : `Produit #${item.product_id}`}
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="primary" sx={{ mt: 0.25 }}>
                          {formatFcfa(price)}
                        </Typography>
                        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1.875 }}>
                            <IconButton
                              size="small"
                              sx={{ borderRadius: 1.875, p: 0.5 }}
                              onClick={() => updateQuantity(item.product_id.toString(), Math.max(1, item.quantity - 1))}
                            >
                              <Minus fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ width: 30, textAlign: 'center', fontWeight: 600 }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              sx={{ borderRadius: 1.875, p: 0.5 }}
                              onClick={() => updateQuantity(item.product_id.toString(), item.quantity + 1)}
                            >
                              <Plus fontSize="small" />
                            </IconButton>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => removeFromCart(item.product_id.toString())}
                            sx={{
                              color: alpha(theme.palette.error.main, 0.6),
                              bgcolor: alpha(theme.palette.error.main, 0.06),
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12) },
                            }}
                          >
                            <Trash2 fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            <Box sx={{ px: 2.5, py: 2.5, bgcolor: 'background.paper', borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Sous-total</Typography>
                  <Typography fontWeight={700}>{formatFcfa(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography color="text.secondary">Livraison</Typography>
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <Typography variant="body2" fontWeight={700} sx={{ color: theme.palette.success?.main || '#2e7d32' }}>
                      Gratuite
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: 13 }}>
                      Frais calculés selon le mode de livraison
                    </Typography>
                  )}
                </Box>
                {subtotal < FREE_SHIPPING_THRESHOLD && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.warning?.main || '#ed6c02', 0.06),
                    border: `1px solid ${alpha(theme.palette.warning?.main || '#ed6c02', 0.15)}`,
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      Les frais seront gratuits pour les commandes supérieures à
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="warning.main">
                       {formatFcfa(FREE_SHIPPING_THRESHOLD)}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" fontWeight={800}>Total</Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="primary">
                    {formatFcfa(subtotal)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleCheckout}
                  sx={{
                    borderRadius: 2.5,
                    py: 1.5,
                    fontWeight: 700,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  Passer la commande
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => toggleCart(false)}
                  sx={{ borderRadius: 2.5, fontWeight: 600 }}
                >
                  Continuer mes achats
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
}
