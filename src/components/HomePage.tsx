'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Chip,
  Skeleton,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowForward as ArrowRight,
  Inventory2 as Package,
  LocalShipping as Truck,
  Security as Shield,
  VerifiedUser,
  Place as PlaceIcon,
  CheckCircle,
  Add as AddIcon,
  RequestQuote as RequestQuoteIcon,
} from '@mui/icons-material';
import { NAVBAR_HEIGHT } from './Navigation';

import { homeService } from '../services/home.service';
import { productService } from '../services/product.service';
import { getImageUrl } from '@/lib/imageUtils';
import { formatFcfa } from '@/lib/format';
import ProductCard from './ProductCard';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from './ui/carousel';
import { Product, Category } from '../lib/types';
import { PaymentIcons } from './PaymentIcons';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/error-handler';
import { BRAND_BLUE, FONT_POPPINS } from '@/theme';

const C = {
  primary: BRAND_BLUE,
  dark: '#042C53',
  light: '#E6F1FB',
  surface: '#F8FAFC',
  border: '#D4E6F7',
  mid: '#85B7EB',
  muted: '#64748B',
  text: '#475569',
} as const;

const HERO_IMAGE = '/banner.jpg';

const formatPrice = (amount: number) => formatFcfa(amount);

const sectionLabelSx = {
  fontSize: { xs: 12, sm: 13, md: 14, lg: 15 },
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: C.primary,
  mb: { xs: 1, sm: 1.25, md: 1.5 },
};

const sectionTitleSx = {
  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.1rem', lg: '2.5rem' },
  fontWeight: 800,
  color: C.dark,
  fontFamily: FONT_POPPINS,
  letterSpacing: '-0.03em',
  lineHeight: { xs: 1.2, sm: 1.18, md: 1.15 },
  mb: { xs: 1, sm: 1.25, md: 1.5 },
};

const sectionDescSx = {
  fontSize: { xs: 15, sm: 16.5, md: 18, lg: 20 },
  color: C.text,
  lineHeight: { xs: 1.6, sm: 1.7, md: 1.75 },
  maxWidth: { xs: '100%', sm: 550, md: 650 },
};

const FEATURES = [
  {
    num: '01',
    icon: Package,
    title: 'Qualité premium',
    description:
      'Chaque article est contrôlé à la source : matériaux, finitions et conformité avant expédition depuis la Chine.',
  },
  {
    num: '02',
    icon: Truck,
    title: 'Livraison express',
    description:
      'Expédition 24–48h sur Dakar et banlieue, suivi en temps réel et livraison dans tout le Sénégal.',
  },
  {
    num: '03',
    icon: Shield,
    title: 'Paiement sécurisé',
    description:
      'Transactions protégées et moyens de paiement locaux pour acheter en toute confiance.',
    paymentMethods: true,
  },
] as const;

function SectionHeader({
  label,
  title,
  description,
  action,
  centered = false,
}: {
  label: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: centered ? 'center' : { xs: 'flex-start', sm: 'flex-end' },
        gap: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 4, sm: 5, md: 6 },
        textAlign: centered ? 'center' : 'left',
      }}
    >
      <Box sx={{ maxWidth: centered ? { xs: '100%', sm: 800 } : { xs: '100%', sm: 700 }, ...(centered && { mx: 'auto' }) }}>
        <Typography sx={sectionLabelSx}>{label}</Typography>
        <Typography component="h2" sx={sectionTitleSx}>
          {title}
        </Typography>
        {description && <Typography sx={{ ...sectionDescSx, ...(centered && { mx: 'auto' }) }}>{description}</Typography>}
      </Box>
      {action}
    </Box>
  );
}

function HeroProductThumb({ name, coverImage }: { name?: string; coverImage?: string }) {
  const initial = (name?.trim().charAt(0) || 'D').toUpperCase();
  const imgSrc = coverImage ? getImageUrl(coverImage) : null;

  return (
    <Box
      sx={{
        width: 70,
        height: 70,
        borderRadius: '15px',
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: imgSrc ? 'transparent' : `linear-gradient(145deg, ${C.primary} 0%, ${C.dark} 100%)`,
        color: '#fff',
        fontWeight: 800,
        fontSize: 27.5,
        letterSpacing: '-0.02em',
        boxShadow: imgSrc
          ? `0 4px 14px ${alpha(C.dark, 0.2)}`
          : `0 4px 14px ${alpha(C.primary, 0.35)}`,
      }}
    >
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={name || 'Produit'}
          width={70}
          height={70}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initial
      )}
    </Box>
  );
}

interface HomePageProps {
  onNavigate?: (page: string, category?: string) => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onViewCategory?: (categoryId: string) => void;
  userType: 'retail' | 'wholesale';
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
}

export function HomePage({
  onNavigate,
  onAddToCart,
  onViewProduct,
  onViewCategory,
  userType,
  favorites,
  onToggleFavorite,
}: HomePageProps) {
  const router = useRouter();
  const autoplayPlugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: false }));
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [categoriesMap, setCategoriesMap] = useState<Map<number, string>>(new Map());

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesResult, productsResult] = await Promise.all([
        homeService.getActiveCategories(),
        productService.getProducts({ limit: 8 }),
      ]);

      const categoryMap = new Map<number, string>();

      if (categoriesResult.error) {
        setError(categoriesResult.error);
        setCategories([]);
      } else {
        const cats = categoriesResult.data || [];
        setCategories(cats);
        cats.forEach((cat: Category) => {
          categoryMap.set(Number(cat.id), cat.name);
        });
        setCategoriesMap(categoryMap);
      }

      if (productsResult.error) {
        if (!categoriesResult.error) setError(productsResult.error);
        setPopularProducts([]);
      } else {
        const items = productsResult.data?.items || [];
        setPopularProducts(
          items.map((product: Product) => ({
            ...product,
            category_name: categoryMap.get(product.category_id) || undefined,
          })),
        );
      }
    } catch (err) {
      console.error('Error loading home data:', err);
      setError({
        message: 'Erreur lors du chargement des données',
        isNetworkError: false,
        isTimeout: false,
        isServerError: false,
        isClientError: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path === 'home' ? '/' : `/${path}`);
    }
  };

  const featuredProduct = useMemo(() => {
    const featured = popularProducts.find((p) => p.is_featured);
    return featured ?? popularProducts[0] ?? null;
  }, [popularProducts]);

  const heroCategoryTags = useMemo(() => {
    if (categories.length > 0) {
      return categories.slice(0, 6);
    }
    return [] as Category[];
  }, [categories]);

  const featuredDiscount =
    featuredProduct?.compare_price && featuredProduct.compare_price > featuredProduct.price
      ? Math.round(((featuredProduct.compare_price - featuredProduct.price) / featuredProduct.compare_price) * 100)
      : null;

  const heroMinHeight = `calc(100dvh - ${NAVBAR_HEIGHT.md}px)`;

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', bgcolor: 'background.default' }}>
      {/* ── HERO PREMIUM ── */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: C.surface,
          minHeight: { xs: 'auto', lg: heroMinHeight },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 80% 60% at 0% 0%, ${alpha(C.primary, 0.12)} 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 100% 100%, ${alpha(C.mid, 0.15)} 0%, transparent 50%),
              linear-gradient(180deg, ${C.surface} 0%, #fff 100%)
            `,
            pointerEvents: 'none',
          }}
        />

        <Container
          maxWidth="xl"
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 2, sm: 3, md: 4 },
            pt: { xs: `calc(${NAVBAR_HEIGHT.xs}px + 20px)`, sm: 10, md: 11, lg: 13 },
            pb: { xs: 4, sm: 5, lg: 6 },
            maxWidth: { xs: '100%', sm: '100%', md: '100%', lg: 'xl' },
          }}
        >
          <Grid
            container
            spacing={{ xs: 3, sm: 4, lg: 5 }}
            sx={{ alignItems: 'center', minHeight: { lg: `calc(${heroMinHeight} - 120px)` } }}
          >
            <Grid size={{ xs: 12, lg: 6 }}>
              <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 725 } }}>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    alignItems: 'center',
                    gap: { xs: 0.75, sm: 1 },
                    bgcolor: alpha(C.primary, 0.04),
                    border: `1px solid ${alpha(C.primary, 0.15)}`,
                    borderRadius: '100px',
                    px: { xs: 1.25, sm: 1.5, md: 1.75 },
                    py: { xs: 0.5, sm: 0.625 },
                    mb: { xs: 2.5, sm: 3, md: 3.5 },
                    boxShadow: '0 2px 12px rgba(4, 44, 83, 0.06)',
                  }}
                >
                  <Box sx={{ width: { xs: 7, sm: 8, md: 8.75 }, height: { xs: 7, sm: 8, md: 8.75 }, borderRadius: '50%', bgcolor: '#22c55e', flexShrink: 0 }} />
                  <PlaceIcon sx={{ fontSize: { xs: 16, sm: 17, md: 18.75 }, color: C.primary }} />
                  <Typography sx={{ fontSize: { xs: 13, sm: 14, md: 15 }, fontWeight: 600, color: C.dark, letterSpacing: '0.04em' }}>
                    Dakar, Sénégal · Import premium direct depuis la Chine 🇨🇳 → 🇸🇳
                  </Typography>
                </Box>

                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    fontFamily: FONT_POPPINS,
                    fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.75rem', lg: '3.15rem', xl: '3.5rem' },
                    lineHeight: { xs: 1.15, sm: 1.1, md: 1.08 },
                    letterSpacing: '-0.035em',
                    color: C.dark,
                    mb: { xs: 2.5, sm: 3 },
                  }}
                >
                  L&apos;art de{' '}
                  <Box
                    component="span"
                    sx={{
                      color: C.primary,
                      background: `linear-gradient(135deg, ${C.primary} 0%, #2a7bc4 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    sublimer
                  </Box>{' '}
                  votre intérieur
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: 15, sm: 17, md: 18.75, lg: 20 },
                    color: C.text,
                    lineHeight: { xs: 1.6, sm: 1.7, md: 1.75 },
                    mb: { xs: 2.5, sm: 3, md: 3.5 },
                    maxWidth: { xs: '100%', sm: 550, md: 600 },
                  }}
                >
                  Mobilier d'exception, décoration tendance et textiles haut de gamme sélectionnés par DameDéco — import direct usine sans intermédiaire, qualité rigoureusement contrôlée, livraison express à Dakar & banlieue.
                </Typography>

                <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 3.5, sm: 4.5 } }}>
                  {[
                    {
                      title: 'Sélection rigoureuse chez des fournisseurs certifiés ISO/CE',
                      sub: 'Inspection vidéo systématique en usine à Guangzhou & Ningbo',
                    },
                    {
                      title: 'Tarifs dégressifs pour revendeurs & professionnels',
                      sub: 'Avantages exclusifs pour hôtels, villas & décorateurs',
                    },
                    {
                      title: 'Suivi de commande transparent & livraison express',
                      sub: 'Expédition sous 24/48h avec option paiement à la livraison',
                    },
                  ].map((pt) => (
                    <Stack
                      key={pt.title}
                      spacing={{ xs: 0.5, sm: 0.75 }}
                      sx={{ alignItems: 'flex-start' }}
                    >
                      <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} sx={{ alignItems: 'flex-start' }}>
                        <CheckCircle sx={{ fontSize: { xs: 18, sm: 20, md: 21.25 }, color: C.primary, mt: { xs: 0.15, sm: 0.25 }, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: { xs: 14, sm: 15.5, md: 16.875 }, color: C.dark, fontWeight: 600, lineHeight: { xs: 1.4, sm: 1.5 } }}>
                          {pt.title}
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: { xs: 13, sm: 14, md: 14.5 }, color: C.muted, lineHeight: { xs: 1.4, sm: 1.5 }, ml: { xs: 3.25, sm: 4.25 } }}>
                        {pt.sub}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.25, sm: 1.5 }}
                  sx={{ mb: { xs: 3.5, sm: 4.5, md: 6 } }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowRight />}
                    onClick={() => handleNavigate('shop')}
                    sx={{
                      bgcolor: C.primary,
                      color: '#fff',
                      borderRadius: { xs: '10px', sm: '12.5px' },
                      px: { xs: 1.75, sm: 2.5, md: 3.5 },
                      py: { xs: 1.25, sm: 1.15, md: 1.25 },
                      fontSize: { xs: 14.5, sm: 15.5, md: 17.5 },
                      fontWeight: 700,
                      textTransform: 'none',
                      width: { xs: '100%', sm: 'auto' },
                      whiteSpace: 'normal',
                      boxShadow: `0 8px 28px ${alpha(C.primary, 0.35)}`,
                      '&:hover': {
                        bgcolor: C.dark,
                        boxShadow: `0 12px 32px ${alpha(C.primary, 0.4)}`,
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Explorer la Boutique →
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<RequestQuoteIcon />}
                    onClick={() => handleNavigate('contact')}
                    sx={{
                      borderColor: C.border,
                      color: C.primary,
                      bgcolor: '#fff',
                      borderRadius: { xs: '10px', sm: '12.5px' },
                      px: { xs: 1.75, sm: 2.5, md: 3 },
                      py: { xs: 1.25, sm: 1.15, md: 1.25 },
                      fontSize: { xs: 14.5, sm: 15.5, md: 17.5 },
                      fontWeight: 600,
                      textTransform: 'none',
                      width: { xs: '100%', sm: 'auto' },
                      whiteSpace: 'normal',
                      '&:hover': { bgcolor: C.light, borderColor: C.mid },
                    }}
                  >
                    Demander un Devis
                  </Button>
                </Stack>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }} sx={{ overflow: 'hidden', width: '100%' }}>
              <Box sx={{ mx: 'auto', width: '100%', maxWidth: { xs: '100%', sm: '90%', md: '85%', lg: 700 } }}>
                <Box sx={{ position: 'relative', width: '100%' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: { xs: '20px', sm: '25px', md: '30px' },
                      overflow: 'hidden',
                      aspectRatio: { xs: '4/3', sm: '16/9', md: '16/9' },
                      minHeight: { xs: 180, sm: 280, md: 325, lg: 375 },
                      maxHeight: { lg: 425 },
                      bgcolor: C.light,
                      boxShadow: { xs: '0 8px 24px rgba(4, 44, 83, 0.12)', md: '0 24px 80px rgba(4, 44, 83, 0.18)' },
                      border: `1px solid ${C.border}`,
                      width: '100%',
                    }}
                  >
                    <Image
                      src={HERO_IMAGE}
                      alt="Intérieur premium — DameDéco Import"
                      fill
                      priority
                      sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, 560px"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(to top, ${alpha(C.dark, 0.35)} 0%, transparent 40%)`,
                      }}
                    />
                    <Paper
                      elevation={0}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        display: { xs: 'none', sm: 'flex' },
                        alignItems: 'center',
                        gap: 1,
                        px: 1.75,
                        py: 1,
                        borderRadius: '15px',
                        bgcolor: C.dark,
                        color: '#fff',
                        boxShadow: '0 8px 24px rgba(4, 44, 83, 0.3)',
                      }}
                    >
                      <Truck sx={{ fontSize: 21.25, color: C.mid }} />
                      <Box>
                        <Typography sx={{ fontSize: 11.25, color: alpha('#fff', 0.65), lineHeight: 1.2 }}>Livraison express</Typography>
                        <Typography sx={{ fontSize: 13.75, fontWeight: 700 }}>Dakar & banlieue</Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: { xs: 0.75, sm: 1 },
                    mt: { xs: 1.5, sm: 2 },
                  }}
                >
                  {heroCategoryTags.map((cat) => (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => (onViewCategory ? onViewCategory(cat.id) : handleNavigate('shop'))}
                      clickable
                      sx={{
                        px: { xs: 1, sm: 1.5 },
                        py: { xs: 0.5, sm: 0.75 },
                        borderRadius: '12.5px',
                        bgcolor: '#fff',
                        border: `1px solid ${C.border}`,
                        color: C.dark,
                        fontSize: { xs: 13, sm: 14.375 },
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        boxShadow: `0 4px 12px ${alpha(C.dark, 0.12)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: C.light,
                          borderColor: C.primary,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 6px 16px ${alpha(C.primary, 0.18)}`,
                        },
                      }}
                    />
                  ))}
                  <Chip
                    label="Plus"
                    icon={<AddIcon sx={{ fontSize: { xs: 15, sm: 17.5 }, color: C.primary }} />}
                    onClick={() => handleNavigate('shop')}
                    clickable
                    sx={{
                      px: { xs: 1, sm: 1.5 },
                      py: { xs: 0.5, sm: 0.75 },
                      borderRadius: '12.5px',
                      bgcolor: alpha(C.primary, 0.06),
                      border: `1px dashed ${alpha(C.primary, 0.3)}`,
                      color: C.primary,
                      fontSize: { xs: 13, sm: 14.375 },
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(C.primary, 0.1),
                        borderColor: C.primary,
                      },
                    }}
                  />
                </Box>

                <Paper
                  elevation={0}
                  onClick={() => featuredProduct && onViewProduct(featuredProduct)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (featuredProduct && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onViewProduct(featuredProduct);
                    }
                  }}
                  role={featuredProduct ? 'button' : undefined}
                  tabIndex={featuredProduct ? 0 : -1}
                  aria-label={featuredProduct ? `Voir le produit ${featuredProduct.name ?? ''}`.trim() : undefined}
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: '25px',
                    bgcolor: '#fff',
                    border: `1px solid ${C.border}`,
                    boxShadow: `0 12px 40px ${alpha(C.dark, 0.1)}`,
                    cursor: featuredProduct ? 'pointer' : 'default',
                    outline: 'none',
                    transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                    '&:focus-visible': {
                      borderColor: C.primary,
                      boxShadow: `0 0 0 2px ${C.primary}`,
                    },
                    ...(featuredProduct && {
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: `0 16px 48px ${alpha(C.dark, 0.14)}`,
                      },
                    }),
                  }}
                >
                  {loading ? (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Skeleton variant="rounded" width={70} height={70} sx={{ borderRadius: '15px' }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="50%" height={12.5} sx={{ mb: 1 }} />
                        <Skeleton width="75%" height={20} sx={{ mb: 0.75 }} />
                        <Skeleton width="35%" height={17.5} />
                      </Box>
                    </Stack>
                  ) : featuredProduct ? (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <HeroProductThumb name={featuredProduct.name} coverImage={featuredProduct.cover_image_url} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.primary }}>
                            Sélection du moment
                          </Typography>
                          {featuredDiscount != null && (
                            <Chip label={`-${featuredDiscount}%`} size="small" sx={{ height: 22.5, fontSize: 12.5, fontWeight: 800, bgcolor: '#fef2f2', color: '#b91c1c' }} />
                          )}
                        </Stack>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: 18.75,
                            color: C.dark,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textTransform: 'capitalize',
                          }}
                        >
                          {featuredProduct.name}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 0.5 }}>
                          <Typography sx={{ fontSize: 18.75, fontWeight: 800, color: C.primary }}>
                            {formatPrice(featuredProduct.price)}
                          </Typography>
                          {featuredProduct.compare_price && featuredProduct.compare_price > featuredProduct.price && (
                            <Typography sx={{ fontSize: 15, color: C.muted, textDecoration: 'line-through' }}>
                              {formatPrice(featuredProduct.compare_price)}
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                      <Box
                        sx={{
                          width: 45,
                          height: 45,
                          borderRadius: '12.5px',
                          bgcolor: C.light,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ArrowRight sx={{ color: C.primary, fontSize: 25 }} />
                      </Box>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: '15px',
                          flexShrink: 0,
                          bgcolor: C.light,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Package sx={{ fontSize: 32, color: C.primary }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.primary, mb: 0.5 }}>
                          Sélection du moment
                        </Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: 17, color: C.dark, lineHeight: 1.3 }}>
                          Notre sélection arrive prochainement
                        </Typography>
                        <Typography sx={{ fontSize: 13.5, color: C.muted, mt: 0.5 }}>
                          Parcourez la boutique dès maintenant.
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>

      </Box>

      {/* Avantages */}
      <Box
        id="features"
        component="section"
        sx={{
          pt: { xs: 6, md: 8 },
          pb: { xs: 10, md: 13 },
          background: `linear-gradient(180deg, #fff 0%, ${C.light} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -220,
            left: -180,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(C.primary, 0.06)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -160,
            width: 460,
            height: 460,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(C.mid, 0.12)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              mb: { xs: 5, md: 7 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              gap: { xs: 2.5, md: 8 },
            }}
          >
            <Box sx={{ maxWidth: { xs: '100%', sm: 560 } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: { xs: 1.5, md: 2 } }}>
                <Box sx={{ width: 34, height: 2, borderRadius: '2px', bgcolor: C.primary }} />
                <Typography
                  sx={{
                    fontSize: { xs: 12, sm: 13, md: 14 },
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: C.primary,
                  }}
                >
                  Nos avantages
                </Typography>
              </Stack>
              <Typography
                component="h2"
                sx={{
                  fontFamily: FONT_POPPINS,
                  fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.25rem', lg: '2.6rem' },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                  color: C.dark,
                }}
              >
                Pourquoi nous choisir&nbsp;?
              </Typography>
            </Box>
            <Typography
              sx={{
                maxWidth: { xs: '100%', sm: 420 },
                fontSize: { xs: 15, md: 16.5 },
                color: C.text,
                lineHeight: { xs: 1.65, md: 1.75 },
              }}
            >
              Une expérience d'achat pensée pour le Sénégal : sélection premium, logistique réactive et paiements de confiance.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: { xs: 2.5, sm: 3, md: 4 },
            }}
          >
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Box
                  key={feature.num}
                  sx={{
                    position: 'relative',
                    p: { xs: 2.5, sm: 3, md: 3.5 },
                    height: '100%',
                    borderRadius: { xs: '20px', md: '24px' },
                    bgcolor: '#fff',
                    border: `1px solid ${alpha(C.border, 0.7)}`,
                    boxShadow: `0 2px 20px ${alpha(C.dark, 0.05)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: alpha(C.primary, 0.35),
                      boxShadow: `0 22px 48px ${alpha(C.dark, 0.1)}`,
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                      transition: 'none',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: { xs: 2, md: 2.5 } }}
                  >
                    <Box
                      sx={{
                        width: { xs: 52, sm: 56, md: 60 },
                        height: { xs: 52, sm: 56, md: 60 },
                        borderRadius: { xs: '16px', md: '18px' },
                        bgcolor: alpha(C.light, 0.7),
                        border: `1px solid ${alpha(C.border, 0.7)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: { xs: 26, md: 28 }, color: C.primary }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: FONT_POPPINS,
                        fontSize: { xs: 15, md: 16 },
                        fontWeight: 700,
                        color: alpha(C.muted, 0.55),
                        letterSpacing: '0.04em',
                      }}
                    >
                      {feature.num}
                    </Typography>
                  </Stack>

                  <Typography
                    component="h3"
                    sx={{
                      fontFamily: FONT_POPPINS,
                      fontSize: { xs: 18, sm: 19, md: 20.5, lg: 22 },
                      fontWeight: 700,
                      color: C.dark,
                      letterSpacing: '-0.015em',
                      mb: { xs: 0.75, md: 1 },
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 14.5, sm: 15, md: 15.5, lg: 16 },
                      color: C.muted,
                      lineHeight: { xs: 1.65, md: 1.7 },
                      flex: 1,
                    }}
                  >
                    {feature.description}
                  </Typography>

                  {'paymentMethods' in feature && feature.paymentMethods && (
                    <Box
                      sx={{
                        mt: { xs: 2.5, md: 3 },
                        pt: { xs: 2, md: 2.25 },
                        borderTop: `1px dashed ${alpha(C.border, 0.8)}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: 11, md: 11.5 },
                          fontWeight: 700,
                          color: C.primary,
                          mb: 1.25,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                        }}
                      >
                        Moyens acceptés
                      </Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          p: { xs: 1, md: 1.25 },
                          borderRadius: '16px',
                          bgcolor: alpha(C.light, 0.45),
                          border: `1px solid ${alpha(C.border, 0.5)}`,
                        }}
                      >
                        <PaymentIcons size="sm" />
                      </Box>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Container>
      </Box>

      {/* Catégories */}
      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: C.surface }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <SectionHeader
            label="Catalogue"
            title="Nos catégories"
            description="Parcourez nos univers — meubles, décoration, mode, électronique et bien plus."
            action={
              <Button
                variant="outlined"
                endIcon={<ArrowRight />}
                onClick={() => handleNavigate('shop')}
                sx={{
                  borderColor: C.border,
                  color: C.primary,
                  borderRadius: { xs: '10px', sm: '12.5px' },
                  px: { xs: 2, sm: 2.25, md: 2.5 },
                  py: { xs: 0.85, sm: 0.95, md: 1 },
                  fontSize: { xs: 14.5, sm: 15.5, md: 16.25 },
                  fontWeight: 600,
                  textTransform: 'none',
                  flexShrink: 0,
                  bgcolor: '#fff',
                  '&:hover': { bgcolor: C.light, borderColor: C.mid },
                }}
              >
                Tout le catalogue
              </Button>
            }
          />

          {loading ? (
            <Carousel
              opts={{ align: 'start', loop: false }}
              sx={{ position: 'relative' }}
            >
              <CarouselContent>
                {[1, 2, 3, 4].map((i) => (
                  <CarouselItem key={i} sx={{ flex: { xs: '0 0 50%', sm: '0 0 50%', md: '0 0 33.333%', lg: '0 0 25%' } }}>
                    <Skeleton variant="rounded" sx={{ borderRadius: '22.5px', aspectRatio: '16/10' }} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : categories.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: '22.5px',
                border: `1px dashed ${C.border}`,
                bgcolor: '#fff',
              }}
            >
              <Typography sx={{ color: C.muted, fontSize: 17.5 }}>Les catégories seront bientôt disponibles.</Typography>
            </Paper>
          ) : (
            <Box
              sx={{ position: 'relative' }}
              onMouseEnter={() => autoplayPlugin.current?.stop()}
              onMouseLeave={() => autoplayPlugin.current?.play()}
            >
              <Carousel
                opts={{ align: 'start', loop: true }}
                plugins={[autoplayPlugin.current]}
                sx={{ position: 'relative' }}
              >
                <CarouselContent>
                  {categories.map((category: Category) => (
                    <CarouselItem
                      key={category.id}
                      sx={{
                        flex: { xs: '0 0 50%', sm: '0 0 50%', md: '0 0 33.333%', lg: '0 0 25%' },
                      }}
                    >
                      <Box
                        onClick={() => (onViewCategory ? onViewCategory(category.id) : handleNavigate('shop'))}
                        sx={{
                          position: 'relative',
                          borderRadius: '22.5px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          aspectRatio: '16/10',
                          bgcolor: C.dark,
                          border: `1px solid ${alpha(C.dark, 0.08)}`,
                          boxShadow: `0 8px 32px ${alpha(C.dark, 0.1)}`,
                          '&:hover .cat-img': { transform: 'scale(1.06)' },
                          '&:hover .cat-cta': { opacity: 1, transform: 'translateX(0)' },
                          '&:hover .cat-overlay': {
                            background: `linear-gradient(to top, ${alpha(C.dark, 0.88)} 0%, ${alpha(C.dark, 0.25)} 55%, transparent 100%)`,
                          },
                        }}
                      >
                        {category.image ? (
                          <Box
                            component="img"
                            src={getImageUrl(category.image)}
                            alt={category.name}
                            className="cat-img"
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              objectPosition: 'center',
                              transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                              display: 'block',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              background: `linear-gradient(135deg, ${C.dark} 0%, ${C.primary} 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography sx={{ fontSize: '3rem' }}>{category.icon}</Typography>
                          </Box>
                        )}

                        <Box
                          className="cat-overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(to top, ${alpha(C.dark, 0.75)} 0%, ${alpha(C.dark, 0.1)} 55%, transparent 100%)`,
                            transition: 'background 0.35s ease',
                          }}
                        />

                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2.5, zIndex: 2 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography
                                sx={{
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: { xs: 20, md: 22.5 },
                                  letterSpacing: '-0.02em',
                                  lineHeight: 1.25,
                                }}
                              >
                                {category.name}
                              </Typography>
                              {category.product_count !== undefined && (
                                <Typography sx={{ color: alpha('#fff', 0.72), fontSize: 15, mt: 0.5 }}>
                                  {category.product_count} produit{category.product_count > 1 ? 's' : ''}
                                </Typography>
                              )}
                            </Box>
                            <Typography
                              className="cat-cta"
                              sx={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#fff',
                                opacity: 0,
                                transform: 'translateX(-8px)',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Explorer →
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  sx={{
                    left: { xs: -12, md: -20 },
                    bgcolor: '#fff',
                    border: `1px solid ${C.border}`,
                    color: C.dark,
                    boxShadow: `0 4px 16px ${alpha(C.dark, 0.12)}`,
                    width: { xs: 45, md: 52.5 },
                    height: { xs: 45, md: 52.5 },
                    '&:hover': { bgcolor: C.light },
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                />
                <CarouselNext
                  sx={{
                    right: { xs: -12, md: -20 },
                    bgcolor: '#fff',
                    border: `1px solid ${C.border}`,
                    color: C.dark,
                    boxShadow: `0 4px 16px ${alpha(C.dark, 0.12)}`,
                    width: { xs: 45, md: 52.5 },
                    height: { xs: 45, md: 52.5 },
                    '&:hover': { bgcolor: C.light },
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                />
              </Carousel>
            </Box>
          )}
        </Container>
      </Box>

      {/* Produits populaires */}
      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: '#fff' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <SectionHeader
            label="Sélection"
            title="Produits populaires"
            description="Les articles les plus appréciés par nos clients — qualité vérifiée, prix compétitifs."
            action={
              <Button
                variant="contained"
                endIcon={<ArrowRight />}
                onClick={() => handleNavigate('shop')}
                sx={{
                  bgcolor: C.primary,
                  borderRadius: '12.5px',
                  px: 2.5,
                  py: 1,
                  fontSize: 16.25,
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: `0 6px 20px ${alpha(C.primary, 0.3)}`,
                  flexShrink: 0,
                  '&:hover': { bgcolor: C.dark },
                }}
              >
                Voir tout
              </Button>
            }
          />

          {loading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={475} sx={{ borderRadius: '17.5px' }} />
              ))}
            </Box>
          ) : popularProducts.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: '22.5px',
                border: `1px dashed ${C.border}`,
                bgcolor: C.surface,
              }}
            >
              <Typography sx={{ color: C.muted, fontSize: 17.5 }}>Aucun produit à afficher pour le moment.</Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: { xs: 1.5, md: 2.5 },
              }}
            >
              {popularProducts.map((product: Product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onViewDetails={onViewProduct}
                  userType={userType}
                  isFavorite={favorites.includes(product.id.toString())}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* CTA grossiste */}
      <Box component="section" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 0, md: 2 } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              borderRadius: '25px',
              overflow: 'hidden',
              position: 'relative',
              bgcolor: C.dark,
              px: { xs: 3, sm: 3.5, md: 5 },
              py: { xs: 4, sm: 5, md: 7 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 3, md: 4 },
              border: `1px solid ${alpha(C.mid, 0.2)}`,
              background: `linear-gradient(135deg, ${C.dark} 0%, #0a3d6e 50%, ${C.primary} 120%)`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-80px',
                right: '-40px',
                width: 400,
                height: 400,
                borderRadius: '50%',
                background: alpha(C.mid, 0.2),
                filter: 'blur(70px)',
                pointerEvents: 'none',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 675 }}>
              <Typography sx={{ ...sectionLabelSx, color: C.mid, mb: { xs: 1, md: 1.5 } }}>Achat en gros</Typography>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.15rem' },
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  mb: 1.5,
                }}
              >
                Vous commandez en grande quantité ?
              </Typography>
              <Typography sx={{ fontSize: { xs: 17.5, md: 18.75 }, color: alpha('#fff', 0.72), lineHeight: 1.75, maxWidth: 600 }}>
                Tarifs dégressifs pour les professionnels, devis personnalisé sous 24h et accompagnement dédié.
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: { xs: 2.5, md: 3 } }}>
                {['Devis sous 24h', 'Tarifs négociés', 'Support prioritaire'].map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      bgcolor: alpha('#fff', 0.1),
                      color: alpha('#fff', 0.9),
                      fontWeight: 600,
                      fontSize: { xs: 12.5, sm: 13.25, md: 13.75 },
                      border: `1px solid ${alpha('#fff', 0.18)}`,
                      height: { xs: 28, md: 32 },
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0, display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight />}
                onClick={() => handleNavigate('contact')}
                sx={{
                  bgcolor: C.primary,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: { xs: 15, sm: 16, md: 17.5 },
                  px: { xs: 3, sm: 3.5, md: 4 },
                  py: { xs: 1.5, sm: 1.6, md: 1.75 },
                  borderRadius: '15px',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  width: { xs: '100%', md: 'auto' },
                  border: `2px solid ${alpha('#fff', 0.25)}`,
                  boxShadow: `0 8px 32px ${alpha(C.primary, 0.5)}, inset 0 1px 0 ${alpha('#fff', 0.2)}`,
                  '&:hover': {
                    bgcolor: C.dark,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(C.primary, 0.6)}`,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Demander un devis
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
