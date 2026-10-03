'use client';

import { useState, useEffect } from 'react';
import { ProductDetailPage } from '@/components/ProductDetailPage';
import { useStore } from '@/store/useStore';
import { useRouter, useParams } from 'next/navigation';
import { productService } from '@/services/product.service';
import { Product } from '@/types/product';
import { Box, Typography, Container, Button, Skeleton, Stack, Paper } from '@mui/material';
import Link from 'next/link';

export default function Page() {
    const addToCart = useStore((s) => s.addToCart);
    const userType = useStore((s) => s.userType);
    const favorites = useStore((s) => s.favorites);
    const toggleFavorite = useStore((s) => s.toggleFavorite);
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                if (!id) return;
                setLoading(true);
                // Try to get by ID first, or Slug if ID format implies it. 
                // Currently assuming ID.
                const product = await productService.getProductById(id);
                
                // getProductById retourne directement le produit ou une erreur via handleApiError
                if (product) {
                    setProduct(product);
                    setError(null);
                } else {
                    setProduct(null);
                    setError('Produit non trouvé');
                }
            } catch (err: any) {
                console.error("Error fetching product", err);
                setError(err.message || 'Produit non trouvé');
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ bgcolor: '#F8FAFC', minHeight: '60vh', pb: { xs: 3, md: 5 }, pt: { xs: '92px', sm: 3, md: 5 } }}>
                <Container maxWidth="xl" sx={{ px: { xs: 2.5, sm: 4, md: 6 } }}>
                    <Skeleton width={280} height={24} sx={{ mb: 4, borderRadius: 1 }} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' }, gap: 5 }}>
                        <Skeleton variant="rounded" sx={{ borderRadius: '20px', aspectRatio: '1', maxHeight: 560 }} />
                        <Paper elevation={0} sx={{ p: 3.5, borderRadius: '20px', border: '1px solid #D4E6F7' }}>
                            <Stack spacing={2}>
                                <Skeleton width="40%" height={28} />
                                <Skeleton width="70%" height={40} />
                                <Skeleton width="100%" height={80} />
                                <Skeleton variant="rounded" height={52} />
                                <Skeleton variant="rounded" height={52} />
                            </Stack>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        );
    }

    if (error || !product) {
        return (
            <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#042C53', mb: 1 }}>
                    {error || 'Produit non trouvé'}
                </Typography>
                <Typography sx={{ color: '#64748B', mb: 3, fontSize: 15 }}>
                    Ce produit n&apos;existe pas ou n&apos;est plus disponible.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
                    <Button component={Link} href="/shop" variant="contained" sx={{ textTransform: 'none', fontWeight: 700 }}>
                        Voir la boutique
                    </Button>
                    <Button variant="outlined" onClick={() => router.back()} sx={{ textTransform: 'none' }}>
                        Retour
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <ProductDetailPage
            product={product}
            onAddToCart={addToCart}
            onBack={() => router.back()}
            userType={userType}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onViewProduct={(p) => router.push(`/product/${p.id}`)}
        />
    );
}
