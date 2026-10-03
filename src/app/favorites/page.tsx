'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Container,
    Typography,
    Skeleton,
    Alert,
    Button,
    useTheme,
    alpha,
} from '@mui/material';
import {
    FavoriteBorder,
    FavoriteRounded,
    ArrowForward,
    LockOutlined,
    Add,
} from '@mui/icons-material';
import Link from 'next/link';
import { FavoriteService, Favorite } from '@/services/favorite.service';
import { productService } from '@/services/product.service';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
    const theme = useTheme();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const addToCart = useStore((s) => s.addToCart);
    const userType = useStore((s) => s.userType);
    const storeFavorites = useStore((s) => s.favorites);
    const toggleFavorite = useStore((s) => s.toggleFavorite);
    const user = useStore((s) => s.user);
    const router = useRouter();
    const brandBlue = theme.palette.primary.main;

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const loadFavorites = async () => {
            try {
                setLoading(true);
                const favoritesData = await FavoriteService.getUserFavorites(0, 100);
                setFavorites(favoritesData.items);

                const productPromises = favoritesData.items.map(async (favorite) => {
                    try {
                        const product = await productService.getProductById(favorite.product.id.toString());
                        return product;
                    } catch {
                        return null;
                    }
                });

                const products = await Promise.all(productPromises);
                const validProducts = products.filter(p => p !== null) as Product[];
                setFavoriteProducts(validProducts);
            } catch {
                setError("Impossible de charger vos favoris.");
                setFavorites([]);
                setFavoriteProducts([]);
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [user]);

    // Sync local list when store favorites change (instant add/remove)
    const prevCountRef = useRef(0);
    useEffect(() => {
        if (!user || loading) return;
        const storeIds = storeFavorites ?? [];
        const prevCount = prevCountRef.current;
        prevCountRef.current = storeIds.length;

        if (storeIds.length < prevCount) {
            // Item removed: filter instantly without network call
            setFavoriteProducts(prev => prev.filter(p => storeIds.includes(String(p.id))));
            setFavorites(prev => prev.filter(f => storeIds.includes(String(f.product.id))));
        } else if (storeIds.length > prevCount) {
            // Item added from another page: re-fetch to get full product data
            const loadNew = async () => {
                try {
                    const data = await FavoriteService.getUserFavorites(0, 100);
                    setFavorites(data.items);
                    const products = await Promise.all(
                        data.items.map(async (fav) => {
                            try { return await productService.getProductById(fav.product.id.toString()); }
                            catch { return null; }
                        })
                    );
                    setFavoriteProducts(products.filter(Boolean) as Product[]);
                } catch { /* keep existing list */ }
            };
            loadNew();
        }
    }, [storeFavorites, user, loading]);



    const productCount = favoriteProducts?.length ?? 0;

    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Container maxWidth="lg" sx={{ pt: 14, pb: 8 }}>
                    <Skeleton variant="rounded" width={280} height={40} sx={{ mb: 2, borderRadius: 2 }} />
                    <Skeleton variant="rounded" width={180} height={24} sx={{ mb: 5, borderRadius: 2 }} />
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: 'repeat(2, 1fr)',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                                lg: 'repeat(3, 1fr)',
                                xl: 'repeat(3, 1fr)',
                            },
gap: { xs: 1.5, sm: 2.5, lg: 4 },
                        }}
                    >
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} variant="rounded" height={460} sx={{ borderRadius: 3 }} />
                        ))}
                    </Box>
                </Container>
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Container maxWidth="lg" sx={{ pt: 14, pb: 8 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 4,
                            background: `linear-gradient(135deg, ${alpha(brandBlue, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                            border: `1px solid ${alpha(brandBlue, 0.15)}`,
                            textAlign: 'center',
                            py: { xs: 10, md: 14 },
                            px: 4,
                        }}
                    >
                        <Box
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                mx: 'auto',
                                mb: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${alpha(brandBlue, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                                border: `2px solid ${alpha(brandBlue, 0.2)}`,
                            }}
                        >
                            <LockOutlined sx={{ fontSize: 44, color: brandBlue }} />
                        </Box>
                        <Typography
                            variant="h4"
                            fontWeight={700}
                            sx={{ mb: 1.5, color: 'text.primary' }}
                        >
                            Connexion requise
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 460, mx: 'auto', mb: 4, lineHeight: 1.7 }}
                        >
                            Connectez-vous à votre compte pour accéder à vos favoris et gérer votre collection de produits préférés.
                        </Typography>
                        <Button
                            variant="contained"
                            component={Link}
                            href="/login"
                            size="large"
                            sx={{
                                borderRadius: 3,
                                px: 5,
                                py: 1.5,
                                fontWeight: 600,
                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                        >
                            Se connecter
                        </Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    if (productCount === 0) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Container maxWidth="lg" sx={{ pt: 14, pb: 8 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 4,
                            background: `linear-gradient(135deg, ${alpha(brandBlue, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                            border: `1px solid ${alpha(brandBlue, 0.15)}`,
                            textAlign: 'center',
                            py: { xs: 10, md: 14 },
                            px: 4,
                        }}
                    >
                        <Box
                            sx={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                mx: 'auto',
                                mb: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${alpha(brandBlue, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
                                border: `2px solid ${alpha(brandBlue, 0.2)}`,
                            }}
                        >
                            <FavoriteBorder sx={{ fontSize: 44, color: brandBlue }} />
                        </Box>
                        <Typography
                            variant="h4"
                            fontWeight={700}
                            sx={{ mb: 1.5, color: 'text.primary' }}
                        >
                            Aucun favori pour le moment
                        </Typography>
                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 460, mx: 'auto', mb: 4, lineHeight: 1.7 }}
                        >
                            Parcourez notre catalogue et ajoutez vos coups de cœur à vos favoris
                            pour les retrouver en un clic.
                        </Typography>
                        <Button
                            variant="contained"
                            component={Link}
                            href="/shop"
                            size="large"
                            endIcon={<ArrowForward />}
                            sx={{
                                borderRadius: 3,
                                px: 5,
                                py: 1.5,
                                fontWeight: 600,
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
                    position: 'relative',
                    background: `linear-gradient(135deg, ${alpha(brandBlue, 0.06)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                    borderBottom: `1px solid ${alpha(brandBlue, 0.1)}`,
                    pt: { xs: 12, md: 14 },
                    pb: { xs: 4, md: 5 },
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="h3"
                                fontWeight={800}
                                sx={{
                                    fontSize: { xs: 28, md: 36 },
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Mes Favoris
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 0.5, fontSize: 15 }}
                            >
                                {productCount} produit{productCount > 1 ? 's' : ''} dans votre collection
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    px: 3,
                                    py: 1.25,
                                    borderRadius: 3,
                                    background: `linear-gradient(135deg, ${alpha(brandBlue, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                                    border: `1px solid ${alpha(brandBlue, 0.18)}`,
                                }}
                            >
                                <FavoriteRounded sx={{ fontSize: 20, color: brandBlue }} />
                                <Typography fontWeight={700} fontSize={18} color={brandBlue}>
                                    {productCount}
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                component={Link}
                                href="/shop"
                                startIcon={<Add />}
                                sx={{
                                    borderRadius: 3,
                                    px: 3,
                                    py: 1.25,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    boxShadow: `0 4px 16px ${alpha(brandBlue, 0.3)}`,
                                    bgcolor: brandBlue,
                                    '&:hover': {
                                        bgcolor: alpha(brandBlue, 0.85),
                                    },
                                }}
                            >
                                Produits
                            </Button>
                        </Box>
                    </Box>
                    {error && (
                        <Alert severity="warning" variant="outlined" sx={{ mt: 3, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                            {error}
                        </Alert>
                    )}
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: { xs: 4, md: 5 } }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: 'repeat(2, 1fr)',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(3, 1fr)',
                            xl: 'repeat(3, 1fr)',
                        },
                        gap: { xs: 2, sm: 2.5, lg: 4 },
                    }}
                >
                    {Array.isArray(favoriteProducts) && favoriteProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            onViewDetails={(p) => router.push(`/product/${p.id}`)}
                            userType={userType}
                            isFavorite={storeFavorites?.includes(String(product.id)) ?? false}
                            onToggleFavorite={toggleFavorite}
                        />
                    ))}
                </Box>
            </Container>
        </Box>
    );
}
