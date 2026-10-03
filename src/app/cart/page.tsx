'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Container,
    Typography,
    Box,
    Button,
    IconButton,
    Alert,
    useTheme,
    alpha,
    Chip,
    Skeleton,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Add as AddIcon,
    Remove as RemoveIcon,
    ShoppingBagOutlined,
    ArrowForward,
    KeyboardArrowLeft,
} from '@mui/icons-material';
import { useStore } from '@/store/useStore';
import { useCartWithProducts } from '@/hooks/useCartWithProducts';
import { getImageUrl } from '@/lib/imageUtils';
import { formatFcfa } from '@/lib/format';

export default function CartPage() {
    const theme = useTheme();
    const router = useRouter();
    const removeFromCart = useStore((s) => s.removeFromCart);
    const updateQuantity = useStore((s) => s.updateQuantity);
    const clearCart = useStore((s) => s.clearCart);
    const loadCart = useStore((s) => s.loadCart);
    const cartLoading = useStore((s) => s.cartLoading);
    const cartError = useStore((s) => s.cartError);
    const { cart: cartWithProducts, loading: productsLoading } = useCartWithProducts();
    const brandBlue = theme.palette.primary.main;

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const subtotal = useMemo(() =>
        (cartWithProducts || []).reduce((sum, item) => {
            const price = item.product
                ? (item.price_type === 'wholesale' ? (item.product.wholesale_price || 0) : (item.product.price || 0))
                : (Number(item.unit_price) || 0);
            return sum + price * item.quantity;
        }, 0),
    [cartWithProducts]);

    const itemCount = cartWithProducts?.length ?? 0;

    const handleCheckout = () => router.push('/checkout');

    const isLoading = cartLoading || productsLoading;

    if (isLoading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Container maxWidth="lg" sx={{ pt: { xs: 10, sm: 11, md: 14 }, pb: 8 }}>
                    <Skeleton variant="rounded" width={{ xs: 160, sm: 200, md: 240 }} height={{ xs: 32, md: 40 }} sx={{ mb: 1.5, borderRadius: 2 }} />
                    <Skeleton variant="rounded" width={{ xs: 120, md: 160 }} height={{ xs: 20, md: 24 }} sx={{ mb: { xs: 3, md: 5 }, borderRadius: 2 }} />
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="rounded" height={{ xs: 85, sm: 90, md: 100 }} sx={{ mb: 1.5, borderRadius: 3 }} />
                    ))}
                </Container>
            </Box>
        );
    }

    if (itemCount === 0) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Container maxWidth="lg" sx={{ pt: { xs: 10, sm: 11, md: 14 }, pb: 8 }}>
                    <Box
                        sx={{
                            textAlign: 'center',
                            py: { xs: 6, sm: 8, md: 14 },
                            px: { xs: 2, sm: 3, md: 4 },
                            borderRadius: 4,
                            background: `linear-gradient(135deg, ${alpha(brandBlue, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                            border: `1px solid ${alpha(brandBlue, 0.12)}`,
                        }}
                    >
                        <Box
                            sx={{
                                width: { xs: 72, sm: 86, md: 100 },
                                height: { xs: 72, sm: 86, md: 100 },
                                borderRadius: '50%',
                                mx: 'auto',
                                mb: { xs: 2, sm: 2.5, md: 3 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${alpha(brandBlue, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                                border: `2px solid ${alpha(brandBlue, 0.18)}`,
                            }}
                        >
                            <ShoppingBagOutlined sx={{ fontSize: { xs: 32, sm: 38, md: 44 }, color: brandBlue }} />
                        </Box>
                        <Typography variant="h4" fontWeight={700} sx={{ mb: 1.5, fontSize: { xs: 20, sm: 24, md: 28 } }}>
                            Votre panier est vide
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: { xs: 3, sm: 3.5, md: 4 }, lineHeight: 1.7, fontSize: { xs: 14, sm: 15, md: 16 } }}>
                            Parcourez notre catalogue et ajoutez vos articles préférés à votre panier.
                        </Typography>
                        <Button
                            variant="contained"
                            component={Link}
                            href="/shop"
                            size="large"
                            endIcon={<ArrowForward />}
                            sx={{
                                borderRadius: 3,
                                px: { xs: 3.5, sm: 4.5, md: 5 },
                                py: { xs: 1.25, sm: 1.4, md: 1.5 },
                                fontWeight: 600,
                                fontSize: { xs: 14, sm: 15, md: 16 },
                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                        >
                            Découvrir nos produits
                        </Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${alpha(brandBlue, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                    borderBottom: `1px solid ${alpha(brandBlue, 0.1)}`,
                    pt: { xs: 10, sm: 11, md: 13, lg: 14 },
                    pb: { xs: 3, sm: 3.5, md: 4, lg: 5 },
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
                        <Box>
                            <Typography
                                variant="h3"
                                fontWeight={800}
                                sx={{ fontSize: { xs: 24, sm: 26, md: 32, lg: 36 }, letterSpacing: '-0.02em' }}
                            >
                                Mon Panier
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: { xs: 0.35, sm: 0.4, md: 0.5 }, fontSize: { xs: 13.5, sm: 14, md: 15 } }}>
                                {itemCount} article{itemCount > 1 ? 's' : ''} dans votre panier
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: { xs: 0.75, sm: 1 },
                                px: { xs: 2, sm: 2.5, md: 3 },
                                py: { xs: 1, sm: 1.15, md: 1.25 },
                                borderRadius: { xs: 2.5, sm: 2.75, md: 3 },
                                background: `linear-gradient(135deg, ${alpha(brandBlue, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                                border: `1px solid ${alpha(brandBlue, 0.18)}`,
                            }}
                        >
                            <ShoppingBagOutlined sx={{ fontSize: { xs: 18, sm: 19, md: 20 }, color: brandBlue }} />
                            <Typography fontWeight={700} fontSize={{ xs: 16, sm: 17, md: 18 }} color={brandBlue}>
                                {itemCount}
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3.5, md: 4, lg: 5 } }}>
                {cartError && (
                    <Alert severity="error" variant="outlined" sx={{ mb: { xs: 2, sm: 2.5, md: 3 }, fontSize: { xs: 13, sm: 14, md: 15 }, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>{cartError}</Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
                    {cartWithProducts.map((item) => {
                        const price = item.product
                            ? (item.price_type === 'wholesale' ? (item.product.wholesale_price || 0) : (item.product.price || 0))
                            : (Number(item.unit_price) || 0);
                        const itemTotal = price * item.quantity;

                        return (
                            <Box
                                key={item.id}
                                sx={{
                                    display: 'flex',
                                    gap: { xs: 1.5, sm: 2, md: 3 },
                                    p: { xs: 1.25, sm: 1.75, md: 2.5 },
                                    borderRadius: { xs: 2.5, sm: 2.75, md: 3 },
                                    bgcolor: 'background.paper',
                                    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                                    '&:hover': {
                                        borderColor: alpha(brandBlue, 0.2),
                                        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.06)}`,
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: { xs: 65, sm: 72, md: 100 },
                                        height: { xs: 65, sm: 72, md: 100 },
                                        borderRadius: { xs: 1.5, sm: 1.75, md: 2 },
                                        overflow: 'hidden',
                                        bgcolor: 'action.hover',
                                        flexShrink: 0,
                                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                                    }}
                                >
                                    {item.product && (
                                        <Box
                                            component="img"
                                            src={getImageUrl(item.product.cover_image_url)}
                                            alt={item.product.name}
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: 14, sm: 15, md: 16 }, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {item.product?.name || `Produit #${item.product_id}`}
                                        </Typography>
                                        <Chip
                                            label={item.price_type === 'wholesale' ? 'Prix gros' : 'Prix détail'}
                                            size="small"
                                            sx={{
                                                mt: { xs: 0.35, sm: 0.4, md: 0.5 },
                                                height: { xs: 18, sm: 19, md: 20 },
                                                fontSize: { xs: 9, sm: 9.5, md: 10 },
                                                fontWeight: 600,
                                                bgcolor: alpha(brandBlue, 0.1),
                                                color: brandBlue,
                                                border: 'none',
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', gap: { xs: 0.75, sm: 1 }, mt: { xs: 0.75, sm: 1 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.35, sm: 0.5 } }}>
                                            <Typography variant="body2" fontWeight={700} color="primary" sx={{ mr: { xs: 0.5, sm: 0.75, md: 1 }, fontSize: { xs: 13, sm: 14, md: 15 } }}>
                                                {formatFcfa(price)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: { xs: 1.25, sm: 1.35, md: 1.5 } }}>
                                                <IconButton
                                                    size="small"
                                                    sx={{ borderRadius: { xs: 1.25, sm: 1.35, md: 1.5 }, p: { xs: 0.35, sm: 0.4, md: 0.5 } }}
                                                    onClick={() => updateQuantity(item.product_id.toString(), Math.max(1, item.quantity - 1))}
                                                >
                                                    <RemoveIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                                                </IconButton>
                                                <Typography variant="body2" sx={{ width: { xs: 24, sm: 26, md: 28 }, textAlign: 'center', fontWeight: 600, fontSize: { xs: 13, sm: 14, md: 15 } }}>
                                                    {item.quantity}
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    sx={{ borderRadius: { xs: 1.25, sm: 1.35, md: 1.5 }, p: { xs: 0.35, sm: 0.4, md: 0.5 } }}
                                                    onClick={() => updateQuantity(item.product_id.toString(), item.quantity + 1)}
                                                >
                                                    <AddIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, gap: { xs: 1, sm: 1.25, md: 1.5 } }}>
                                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: { xs: 14, sm: 14, md: 15 } }}>
                                                {formatFcfa(itemTotal)}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => removeFromCart(item.product_id.toString())}
                                                sx={{
                                                    bgcolor: alpha(theme.palette.error.main, 0.08),
                                                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.15) },
                                                    p: { xs: 0.5, sm: 0.6, md: 0.75 },
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>

                <Box
                    sx={{
                        mt: { xs: 3, sm: 3.5, md: 4 },
                        p: { xs: 2, sm: 2.5, md: 4 },
                        borderRadius: { xs: 2.5, sm: 2.75, md: 3 },
                        bgcolor: 'background.paper',
                        border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-end' }, gap: { xs: 2, sm: 2.25, md: 2 } }}>
                        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => clearCart()}
                                startIcon={<DeleteIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />}
                                sx={{ borderRadius: { xs: 2, sm: 2.25, md: 2.5 }, fontWeight: 500, width: { xs: '100%', md: 'auto' }, whiteSpace: 'nowrap', fontSize: { xs: 13, sm: 15, md: 16 } }}
                            >
                                Vider le panier
                            </Button>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: { xs: 1.5, sm: 1.75, md: 2 } }}>
                                <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: 14, sm: 15, md: 16 } }}>
                                    Sous-total
                                </Typography>
                                <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: 22, sm: 28, md: 32 } }}>
                                    {formatFcfa(subtotal)}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.25, md: 1.5 }, flexWrap: { xs: 'wrap', lg: 'nowrap' }, width: '100%' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => router.push('/shop')}
                                    startIcon={<KeyboardArrowLeft sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />}
                                    sx={{ borderRadius: { xs: 2, sm: 2.25, md: 2.5 }, fontWeight: 500, fontSize: { xs: 13, sm: 15, md: 16 }, width: { xs: '100%', lg: 'auto' }, whiteSpace: 'nowrap' }}
                                >
                                    Continuer mes achats
                                </Button>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleCheckout}
                                    endIcon={<ArrowForward sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />}
                                    sx={{
                                        borderRadius: { xs: 2, sm: 2.25, md: 2.5 },
                                        px: { xs: 3, sm: 3.5, md: 4 },
                                        py: { xs: 1.15, sm: 1.25, md: 1.35 },
                                        fontWeight: 600,
                                        fontSize: { xs: 13, sm: 15, md: 16 },
                                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                        width: { xs: '100%', lg: 'auto' },
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Passer la commande
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
