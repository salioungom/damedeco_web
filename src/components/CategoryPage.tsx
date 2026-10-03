'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
    Box,
    Container,
    Grid,
    Typography,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Breadcrumbs,
    Link,
    Alert,
    Chip,
} from '@mui/material';
import { ChevronLeft, GridView as GridViewIcon } from '@mui/icons-material';
import ProductCard from './ProductCard';
import { useCategories } from '../hooks/useCategories';
import { LoadingSpinner } from './common/LoadingSpinner';
import type { Product } from '../lib/types';
import { productService } from '../services/product.service';
import { getImageUrl } from '@/lib/imageUtils';

interface CategoryPageProps {
    onAddToCart: (product: Product) => void;
    onViewProduct: (product: Product) => void;
    userType: 'retail' | 'wholesale';
    favorites: string[];
    onToggleFavorite: (productId: string) => void;
}

export function CategoryPage({
    onAddToCart,
    onViewProduct,
    userType,
    favorites,
    onToggleFavorite,
}: CategoryPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const categorySlug = searchParams.get('slug');
    const [sortBy, setSortBy] = useState<string>('popular');
    const { categories, loading: categoriesLoading, error: categoriesError, getCategoryBySlug } = useCategories();
    const [currentCategory, setCurrentCategory] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [coverError, setCoverError] = useState(false);

    useEffect(() => {
        if (!categorySlug) return;

        const loadCategoryAndProducts = async () => {
            try {
                setLoading(true);
                const category = await getCategoryBySlug(categorySlug);
                setCurrentCategory(category);

                if (category) {
                    const response = await productService.getProducts({
                        category_id: Number(category.id),
                        limit: 100,
                    });

                    if (response.error) {
                        console.error('Error fetching products:', response.error);
                        setProducts([]);
                    } else {
                        setProducts(response.data?.items || []);
                    }
                }

                setError(null);
            } catch (err) {
                setError('Erreur lors du chargement de la catégorie');
                console.error(err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        loadCategoryAndProducts();
    }, [categorySlug, getCategoryBySlug]);

    if (categoriesLoading || loading) return <LoadingSpinner />;

    if (categoriesError || error) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                <Alert severity="error" variant="outlined" sx={{ mb: 2, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>{categoriesError || error}</Alert>
                <Button variant="outlined" startIcon={<ChevronLeft />} onClick={() => router.back()}>
                    Retour
                </Button>
            </Container>
        );
    }

    if (!currentCategory) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
                <Alert severity="warning" variant="outlined" sx={{ mb: 2, animation: 'slideUp 0.35s ease-out', '@keyframes slideUp': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>Catégorie non trouvée</Alert>
                <Button variant="outlined" startIcon={<ChevronLeft />} onClick={() => router.back()}>
                    Retour
                </Button>
            </Container>
        );
    }

    const filteredProducts = [...(products || [])].sort((a, b) => {
        if (sortBy === 'price-asc') {
            const pA = userType === 'wholesale' && a.wholesale_price ? a.wholesale_price : a.price;
            const pB = userType === 'wholesale' && b.wholesale_price ? b.wholesale_price : b.price;
            return pA - pB;
        }
        if (sortBy === 'price-desc') {
            const pA = userType === 'wholesale' && a.wholesale_price ? a.wholesale_price : a.price;
            const pB = userType === 'wholesale' && b.wholesale_price ? b.wholesale_price : b.price;
            return pB - pA;
        }
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'popular') return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        return 0;
    });

    // L'image de couverture de la catégorie (adapte le champ à ton type réel)
    const coverImage: string | undefined =
        currentCategory?.cover_image_url ||
        currentCategory?.image_url ||
        currentCategory?.image ||
        undefined;

    const hasCover = !!coverImage && !coverError;

    return (
        <Box sx={{ width: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>

            {/* ── HERO BANNIÈRE CATÉGORIE ── */}
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 275, sm: 375, md: 475 },
                    overflow: 'hidden',
                    bgcolor: '#0f1923', // fallback sombre si pas d'image
                }}
            >
                {/* Image de couverture — full-bleed */}
                {hasCover && (
                    <Box
                        component="img"
                        src={getImageUrl(coverImage)}
                        alt={currentCategory.name}
                        onError={() => setCoverError(true)}
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            filter: 'brightness(0.65)',  // assombrit pour faire ressortir le texte
                            transition: 'transform 0.6s ease',
                            '&:hover': { transform: 'scale(1.03)' },
                        }}
                    />
                )}

                {/* Gradient overlay en bas pour lisibilité du texte */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: hasCover
                            ? 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.10) 100%)'
                            : 'linear-gradient(135deg, #042C53 0%, #185FA5 100%)',
                    }}
                />

                {/* Contenu texte sur la bannière */}
                <Container
                    maxWidth="xl"
                    sx={{
                        position: 'relative',
                        zIndex: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        pb: { xs: 3, md: 4 },
                        px: { xs: 2, sm: 3, md: 4 },
                    }}
                >
                    {/* Breadcrumb blanc */}
                    <Breadcrumbs
                        sx={{
                            mb: 1.5,
                            '& .MuiBreadcrumbs-separator': { color: 'rgba(255,255,255,0.5)' },
                        }}
                    >
                        <Link
                            component="button"
                            onClick={() => router.back()}
                            sx={{
                                color: 'rgba(255,255,255,0.7)',
                                textDecoration: 'none',
                                fontSize: 16.25,
                                cursor: 'pointer',
                                '&:hover': { color: '#fff' },
                            }}
                        >
                            Boutique
                        </Link>
                        <Typography sx={{ color: '#fff', fontSize: 16.25, fontWeight: 500 }}>
                            {currentCategory.name}
                        </Typography>
                    </Breadcrumbs>

                    {/* Titre catégorie */}
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { xs: 32.5, sm: 42.5, md: 52.5 },
                            fontWeight: 700,
                            color: '#fff',
                            lineHeight: 1.15,
                            letterSpacing: '-0.625px',
                            mb: 1,
                            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
                        }}
                    >
                        {currentCategory.name}
                    </Typography>

                    {/* Description + compteur */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        {currentCategory.description && (
                            <Typography
                                sx={{
                                    color: 'rgba(255,255,255,0.82)',
                                    fontSize: { xs: 16.25, md: 18.75 },
                                    lineHeight: 1.6,
                                    maxWidth: 750,
                                    textShadow: '0 1px 6px rgba(0,0,0,0.3)',
                                }}
                            >
                                {currentCategory.description}
                            </Typography>
                        )}
                        <Chip
                            icon={<GridViewIcon sx={{ fontSize: '17.5px !important', color: '#fff !important' }} />}
                            label={`${filteredProducts.length} produit${filteredProducts.length > 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.18)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#fff',
                                fontWeight: 500,
                                fontSize: 15,
                                height: 35,
                            }}
                        />
                    </Box>
                </Container>

                {/* Bouton retour flottant en haut à gauche */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: { xs: 12, md: 20 },
                        left: { xs: 12, md: 24 },
                        zIndex: 3,
                    }}
                >
                    <Button
                        startIcon={<ChevronLeft />}
                        onClick={() => router.back()}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: '#fff',
                            fontWeight: 500,
                            fontSize: 16.25,
                            px: 2,
                            py: 0.75,
                            borderRadius: '10px',
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.28)',
                            },
                        }}
                    >
                        Retour
                    </Button>
                </Box>
            </Box>
            {/* ── FIN HERO BANNIÈRE ── */}

            {/* ── BARRE TRI + GRILLE PRODUITS ── */}
            <Container maxWidth="xl" sx={{ mt: 4, mb: 6, px: { xs: 2, sm: 3, md: 4 } }}>

                {/* Barre de tri */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    <Typography sx={{ fontSize: 17.5, color: 'text.secondary' }}>
                        <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {filteredProducts.length}
                        </Box>{' '}
                        produit{filteredProducts.length > 1 ? 's' : ''} dans cette catégorie
                    </Typography>

                    <FormControl variant="outlined" size="small" sx={{ minWidth: 250 }}>
                        <InputLabel id="sort-by-label">Trier par</InputLabel>
                        <Select
                            labelId="sort-by-label"
                            value={sortBy}
                            onChange={(e: SelectChangeEvent) => setSortBy(e.target.value as string)}
                            label="Trier par"
                            sx={{ borderRadius: '10px' }}
                        >
                            <MenuItem value="popular">Populaires</MenuItem>
                            <MenuItem value="price-asc">Prix croissant</MenuItem>
                            <MenuItem value="price-desc">Prix décroissant</MenuItem>
                            <MenuItem value="name">Nom (A-Z)</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                {/* Grille produits */}
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                    {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <Grid key={product.id} size={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 3 }}>
                                <ProductCard
                                    product={product}
                                    onAddToCart={onAddToCart}
                                    onViewDetails={() => onViewProduct(product)}
                                    userType={userType}
                                    isFavorite={favorites.includes(product.id.toString())}
                                    onToggleFavorite={onToggleFavorite}
                                />
                            </Grid>
                        ))
                    ) : (
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                    Aucun produit trouvé dans cette catégorie
                                </Typography>
                                <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                                    Les produits seront bientôt disponibles
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<ChevronLeft />}
                                    onClick={() => router.back()}
                                >
                                    Retour à la boutique
                                </Button>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </Container>
        </Box>
    );
}