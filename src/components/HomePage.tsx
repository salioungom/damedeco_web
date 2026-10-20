'use client';

import { useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowForward as ArrowRight,
  Inventory2 as Package,
  LocalShipping as Truck,
  Security as Shield,
  VerifiedUser,
  Schedule,
  LocalOffer,
  SupportAgent,
} from '@mui/icons-material';
import { getImageUrl } from '@/lib/imageUtils';
import ProductCard from './ProductCard';
import HeroSection from '@/features/home/hero/HeroSection';
import Reveal from './motion/Reveal';
import { SectionLabel } from './ui/SectionLabel';
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
import type { ApiError } from '@/lib/error-handler';
import { BRAND_BLUE, FONT_POPPINS } from '@/theme';
import { tokens } from '@/theme/tokens';
import styles from './HomePage.module.css';

const C = {
  primary: tokens.colors.brand.main,
  dark: tokens.colors.surfaces.inverse,
  light: tokens.colors.brand.soft,
  surface: tokens.colors.surfaces.alt,
  border: tokens.colors.border.light,
  mid: tokens.colors.brand.soft,
  muted: tokens.colors.text.secondary,
  text: tokens.colors.text.secondary,
  laiton: tokens.colors.accent.main,
  laitonOnDark: tokens.colors.accent.onDark,
  laitonOnLight: tokens.colors.accent.onLight,
  ink: tokens.colors.surfaces.inverse,
  onInverse: tokens.colors.text.onInverse,
  onInverseMuted: tokens.colors.text.onInverseMuted,
} as const;

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

const CTA_BENEFITS = [
  {
    icon: Schedule,
    title: 'Devis sous 24 h',
    desc: 'Réponse chiffrée et personnalisée, y compris le week-end.',
  },
  {
    icon: LocalOffer,
    title: 'Tarifs négociés',
    desc: 'Baisse automatique du prix dès 10 pièces commandées.',
  },
  {
    icon: SupportAgent,
    title: 'Accompagnement dédié',
    desc: 'Un interlocuteur unique, du devis à la livraison.',
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
  const theme = useTheme();
  const mobileQuery = theme.breakpoints.down(768);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: centered ? 'center' : { xs: 'flex-start', sm: 'flex-end' },
        gap: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 4, sm: 5, md: 6 },
        [mobileQuery]: { gap: '12px', mb: '30px' },
        textAlign: centered ? 'center' : 'left',
      }}
    >
      <Box sx={{ maxWidth: centered ? { xs: '100%', sm: 800 } : { xs: '100%', sm: 700 }, ...(centered && { mx: 'auto' }) }}>
        <SectionLabel sx={{ mb: { xs: 1, sm: 1.25, md: 1.5 }, [mobileQuery]: { fontSize: '12px', mb: '8px' } }}>{label}</SectionLabel>
        <Typography component="h2" sx={{ ...sectionTitleSx, [mobileQuery]: { fontSize: 'clamp(22px, 5.8vw, 24px)', lineHeight: 1.2, mb: '8px' } }}>
          {title}
        </Typography>
        {description && <Typography sx={{ ...sectionDescSx, ...(centered && { mx: 'auto' }), [mobileQuery]: { fontSize: '14px', lineHeight: 1.5 } }}>{description}</Typography>}
      </Box>
      {action}
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
  /** Données récupérées côté serveur (Server Component `src/app/page.tsx`). */
  categories: Category[];
  popularProducts: Product[];
  error: ApiError | null;
}

export function HomePage({
  onNavigate,
  onAddToCart,
  onViewProduct,
  onViewCategory,
  userType,
  favorites,
  onToggleFavorite,
  categories,
  popularProducts,
  error,
}: HomePageProps) {
  const theme = useTheme();
  const mobileQuery = theme.breakpoints.down(768);
  const router = useRouter();
  const autoplayPlugin = useRef(Autoplay({
    delay: 3500,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  }));

  const categoriesMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((cat: Category) => {
      map.set(Number(cat.id), cat.name);
    });
    return map;
  }, [categories]);

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

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden', bgcolor: 'background.default' }}>
      <HeroSection
        onNavigate={handleNavigate}
        onViewProduct={onViewProduct}
        onViewCategory={onViewCategory}
        featuredProduct={featuredProduct}
        featuredDiscount={featuredDiscount}
        heroCategoryTags={heroCategoryTags}
      />
      {/* Avantages */}
      <Box
        id="features"
        component="section"
        sx={{
          pt: { xs: 6, md: 8 },
          pb: { xs: 10, md: 13 },
          bgcolor: 'background.paper',
          position: 'relative',
          [mobileQuery]: { pt: '50px', pb: '80px' },
        }}
      >
        <Container maxWidth="xl" sx={{ position: 'relative', px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              mb: { xs: 5, md: 7 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              gap: { xs: 2.5, md: 8 },
              [mobileQuery]: { mb: '40px', gap: '16px' },
            }}
          >
            <Box sx={{ maxWidth: { xs: '100%', sm: 560 } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: { xs: 1.5, md: 2 }, [mobileQuery]: { mb: '10px' } }}>
                <Box sx={{ width: 34, height: 2, borderRadius: '2px', bgcolor: C.laitonOnLight }} />
                <SectionLabel sx={{ letterSpacing: '0.14em' }}>Nos avantages</SectionLabel>
              </Stack>
              <Reveal as="div">
                <Typography
                  component="h2"
                  sx={{
                    fontFamily: FONT_POPPINS,
                    fontSize: { xs: '1.6rem', sm: '1.9rem', md: '2.25rem', lg: '2.6rem' },
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.025em',
                    color: C.dark,
                    [mobileQuery]: { fontSize: 'clamp(22px, 5.8vw, 24px)', lineHeight: 1.2 },
                  }}
                >
                  Pourquoi nous choisir&nbsp;?
                </Typography>
              </Reveal>
            </Box>
            <Typography
              sx={{
                maxWidth: { xs: '100%', sm: 420 },
                fontSize: { xs: 15, md: 16.5 },
                color: C.text,
                lineHeight: { xs: 1.65, md: 1.75 },
                [mobileQuery]: { fontSize: '14px', lineHeight: 1.5 },
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
              [mobileQuery]: { gap: '20px' },
            }}
          >
            <Reveal stagger={0.12} style={{ display: 'contents' }}>
              {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Box
                  key={feature.num}
                  className={styles.featureCard}
                  sx={{
                    position: 'relative',
                    p: { xs: 2.5, sm: 3, md: 3.5 },
                    height: '100%',
                    borderRadius: { xs: '20px', md: '24px' },
                    bgcolor: 'var(--feature-card-bg)',
                    border: '1px solid var(--feature-card-border)',
                    color: 'var(--feature-card-color)',
                    boxShadow: `0 2px 20px ${alpha(C.ink, 0.04)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    [mobileQuery]: { p: '20px' },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: { xs: 2, md: 2.5 }, [mobileQuery]: { mb: '14px' } }}
                  >
                    <Box
                      className={styles.featureIconTile}
                      sx={{
                        width: { xs: 52, sm: 56, md: 60 },
                        height: { xs: 52, sm: 56, md: 60 },
                        borderRadius: { xs: '16px', md: '18px' },
                        bgcolor: 'var(--feature-icon-bg)',
                        border: '1px solid var(--feature-icon-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon className={styles.featureIcon} sx={{ fontSize: { xs: 26, md: 28 }, color: 'var(--feature-icon-color)', [mobileQuery]: { fontSize: 24 } }} />
                    </Box>
                    <Typography
                      className={styles.featureNumber}
                      sx={{
                        fontFamily: FONT_POPPINS,
                        fontSize: { xs: 15, md: 16 },
                        fontWeight: 700,
                        color: 'var(--feature-number-color)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {feature.num}
                    </Typography>
                  </Stack>

                  <Typography
                    className={styles.featureTitle}
                    component="h3"
                    sx={{
                      fontFamily: FONT_POPPINS,
                      fontSize: { xs: 18, sm: 19, md: 20.5, lg: 22 },
                      fontWeight: 700,
                      color: 'var(--feature-title-color)',
                      letterSpacing: '-0.015em',
                      mb: { xs: 0.75, md: 1 },
                      [mobileQuery]: { fontSize: '16px', lineHeight: 1.25, mb: '6px' },
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    className={styles.featureDescription}
                    sx={{
                      fontSize: { xs: 14.5, sm: 15, md: 15.5, lg: 16 },
                      color: 'var(--feature-body-color)',
                      lineHeight: { xs: 1.65, md: 1.7 },
                      flex: 1,
                      [mobileQuery]: { fontSize: '14px', lineHeight: 1.5 },
                    }}
                  >
                    {feature.description}
                  </Typography>

                  {'paymentMethods' in feature && feature.paymentMethods && (
                    <Box
                      className={styles.featureDivider}
                      sx={{
                        mt: { xs: 2.5, md: 3 },
                        pt: { xs: 2, md: 2.25 },
                        borderTop: '1px dashed var(--feature-divider-color)',
                        [mobileQuery]: { mt: '20px', pt: '16px' },
                      }}
                    >
                      <Typography
                        className={styles.featurePaymentLabel}
                        sx={{
                          fontSize: { xs: 11, md: 11.5 },
                          fontWeight: 700,
                          color: 'var(--feature-payment-label)',
                          mb: 1.25,
                          textTransform: 'uppercase',
                          letterSpacing: '0.12em',
                          [mobileQuery]: { fontSize: '12px', mb: '8px' },
                        }}
                      >
                        Moyens acceptés
                      </Typography>
                      <Box
                        className={styles.featurePaymentMethods}
                        sx={{
                          display: 'inline-flex',
                          p: { xs: 1, md: 1.25 },
                          borderRadius: '16px',
                          bgcolor: 'var(--feature-payment-bg)',
                          border: '1px solid var(--feature-payment-border)',
                        }}
                      >
                        <PaymentIcons size="sm" />
                      </Box>
                    </Box>
                  )}
                </Box>
              );
              })}
            </Reveal>
          </Box>
        </Container>
      </Box>

      {/* Catégories */}
      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: C.surface, [mobileQuery]: { py: '60px' } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Reveal>
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
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: C.light, borderColor: C.mid },
                  [mobileQuery]: { fontSize: '14px', minHeight: 44, py: '8px' },
                }}
              >
                Tout le catalogue
              </Button>
              }
            />
          </Reveal>

          {categories.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: '22.5px',
                border: `1px dashed ${C.border}`,
                bgcolor: 'background.paper',
              }}
            >
              <Typography sx={{ color: C.muted, fontSize: 17.5, [mobileQuery]: { fontSize: '14px', lineHeight: 1.5 } }}>Les catégories seront bientôt disponibles.</Typography>
            </Paper>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <Carousel
                opts={{ align: 'start', loop: true }}
                plugins={[autoplayPlugin.current]}
                sx={{ position: 'relative' }}
              >
                <CarouselContent>
                  {categories.map((category: Category, index: number) => (
                    <CarouselItem
                      key={category.id}
                      sx={{
                        flex: { xs: '0 0 50%', sm: '0 0 50%', md: '0 0 33.333%', lg: '0 0 25%' },
                      }}
                    >
                      <Reveal y={24 + (index % 4) * 4} style={{ width: '100%' }}>
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
                            backgroundColor: alpha(C.dark, 0.55),
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
                              bgcolor: C.primary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography sx={{ fontSize: '3rem', [mobileQuery]: { fontSize: '2.5rem' } }}>{category.icon}</Typography>
                          </Box>
                        )}

                        <Box
                          className="cat-overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: alpha(C.dark, 0.35),
                            transition: 'background-color 0.35s ease',
                          }}
                        />

                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2.5, zIndex: 2, [mobileQuery]: { p: '15px' } }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <Box>
                              <Typography
                                sx={{
                                  color: C.onInverse,
                                  fontWeight: 800,
                                  fontSize: { xs: 20, md: 22.5 },
                                  letterSpacing: '-0.02em',
                                  lineHeight: 1.25,
                                  [mobileQuery]: { fontSize: '16px' },
                                }}
                              >
                                {category.name}
                              </Typography>
                              {category.product_count !== undefined && (
                                <Typography sx={{ color: alpha(C.onInverse, 0.72), fontSize: 15, mt: 0.5, [mobileQuery]: { fontSize: '13px', lineHeight: 1.45 } }}>
                                  {category.product_count} produit{category.product_count > 1 ? 's' : ''}
                                </Typography>
                              )}
                            </Box>
                            <Typography
                              className="cat-cta"
                              sx={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: C.onInverse,
                                opacity: 0,
                                transform: 'translateX(-8px)',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap',
                                [mobileQuery]: { fontSize: '13px' },
                              }}
                            >
                              Explorer →
                            </Typography>
                          </Stack>
                        </Box>
                        </Box>
                      </Reveal>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious
                  sx={{
                    left: { xs: -12, md: -20 },
                    bgcolor: 'background.paper',
                    border: `1px solid ${C.border}`,
                    color: C.dark,
                    boxShadow: `0 4px 16px ${alpha(C.ink, 0.10)}`,
                    width: { xs: 45, md: 52.5 },
                    height: { xs: 45, md: 52.5 },
                    '&:hover': { bgcolor: C.light },
                    '&.Mui-disabled': { opacity: 0.3 },
                  }}
                />
                <CarouselNext
                  sx={{
                    right: { xs: -12, md: -20 },
                    bgcolor: 'background.paper',
                    border: `1px solid ${C.border}`,
                    color: C.dark,
                    boxShadow: `0 4px 16px ${alpha(C.ink, 0.10)}`,
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
      <Box component="section" sx={{ py: { xs: 8, md: 11 }, bgcolor: 'background.paper', [mobileQuery]: { py: '60px' } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Reveal>
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
                  boxShadow: `0 6px 20px ${alpha(C.ink, 0.15)}`,
                  flexShrink: 0,
                  '&:hover': { bgcolor: C.dark },
                  [mobileQuery]: { fontSize: '14px', minHeight: 44, py: '8px' },
                }}
              >
                Voir tout
              </Button>
              }
            />
          </Reveal>

          {popularProducts.length === 0 ? (
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
                [mobileQuery]: {
                  gap: '12px',
                  '& .product-card .MuiCardContent-root': { p: '12px' },
                  '& .product-card .MuiTypography-caption': { fontSize: '12px', lineHeight: 1.45 },
                  '& .product-card .MuiCardContent-root h3': { fontSize: '16px', lineHeight: 1.3, minHeight: '2.6em', mb: '4px' },
                  '& .product-card .MuiCardContent-root .MuiTypography-h6': { fontSize: '15px', lineHeight: 1.25 },
                  '& .product-card .MuiCardContent-root .MuiTypography-body2': { fontSize: '12px' },
                  '& .product-card .MuiChip-root': { fontSize: '12px', minHeight: 24 },
                  '& .product-card .MuiCardActions-root': { p: '0 12px 12px' },
                  '& .product-card .MuiIconButton-root': { width: 44, height: 44, minWidth: 44, minHeight: 44 },
                  '& .product-card .MuiIconButton-root svg': { fontSize: 18 },
                },
              }}
            >
              <Reveal stagger={0.12} style={{ display: 'contents' }}>
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
              </Reveal>
            </Box>
          )}
        </Container>
      </Box>

      {/* CTA grossiste */}
      <Box component="section" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 0, md: 2 }, [mobileQuery]: { pb: '50px' } }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            component="article"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: { xs: '16px', md: '20px' },
              bgcolor: C.primary,
              px: { xs: 3, sm: 4, md: 6 },
              py: { xs: 4, sm: 5, md: 6 },
              [mobileQuery]: { px: '20px', py: '30px' },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
                gap: { xs: 4, md: 6 },
                alignItems: 'center',
                [mobileQuery]: { gap: '30px' },
              }}
            >
              {/* Contenu éditorial */}
              <Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2, [mobileQuery]: { mb: '14px' } }}>
                  <Box sx={{ width: 32, height: 2, borderRadius: 1, bgcolor: C.laitonOnDark }} />
                  <SectionLabel onDark sx={{ mb: 0, [mobileQuery]: { fontSize: '12px' } }}>Achat en gros</SectionLabel>
                </Stack>
                <Typography
                  component="h2"
                  sx={{
                    fontFamily: FONT_POPPINS,
                    fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.15rem', lg: '2.5rem' },
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    color: C.onInverse,
                    mb: 2,
                    [mobileQuery]: { fontSize: 'clamp(22px, 5.8vw, 24px)', lineHeight: 1.2, mb: '14px' },
                  }}
                >
                  Vous approvisionnez en{' '}
                  <Box component="span" sx={{ color: C.laitonOnDark }}>
                    volume&nbsp;?
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: { xs: 16, md: 17.5 }, color: C.onInverseMuted, lineHeight: 1.75, maxWidth: 620, mb: { xs: 3, md: 4 }, [mobileQuery]: { fontSize: '14px', lineHeight: 1.5, mb: '20px' } }}>
                  Tarifs dégressifs, devis personnalisé sous 24&nbsp;h et interlocuteur dédié pour hôtels, villas, boutiques et
                  décorateurs au Sénégal.
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: { xs: 3, sm: 2 },
                    pt: { xs: 2.5, md: 3 },
                    borderTop: `1px solid ${alpha(C.onInverse, 0.14)}`,
                    [mobileQuery]: { gap: '20px', pt: '20px' },
                  }}
                >
                  {CTA_BENEFITS.map((b) => {
                    const Icon = b.icon;
                    return (
                      <Box key={b.title}>
                        <Icon sx={{ fontSize: 24, color: C.laitonOnDark, mb: 1.25, [mobileQuery]: { fontSize: 22, mb: '8px' } }} />
                        <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.onInverse, mb: 0.5, [mobileQuery]: { fontSize: '16px' } }}>
                          {b.title}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 13.5, md: 14 }, color: C.onInverseMuted, lineHeight: 1.6, [mobileQuery]: { fontSize: '13px', lineHeight: 1.45 } }}>
                          {b.desc}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Carte devis express — opaque */}
              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  p: { xs: 2.5, sm: 3, md: 3.5 },
                  [mobileQuery]: { p: '20px' },
                }}
              >
                <SectionLabel sx={{ fontSize: 12, letterSpacing: '0.14em', mb: 0.75 }}>
                  Devis express
                </SectionLabel>
                <Typography sx={{ fontSize: 19, fontWeight: 700, color: C.dark, lineHeight: 1.3, mb: 2.5, [mobileQuery]: { fontSize: '16px', lineHeight: 1.35, mb: '14px' } }}>
                  Recevez votre tarif sous 24&nbsp;h
                </Typography>

                {[
                  { label: 'Votre besoin', value: 'Meubles & décoration' },
                  { label: 'Quantité estimée', value: 'Dès 10 pièces' },
                  { label: 'Zone de livraison', value: 'Dakar & tout le Sénégal' },
                ].map((row) => (
                  <Box key={row.label} sx={{ py: 1.5, borderBottom: `1px dashed ${C.border}`, [mobileQuery]: { py: '10px' } }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, mb: 0.25, [mobileQuery]: { fontSize: '12px', mb: '2px' } }}>
                      {row.label}
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: C.dark, [mobileQuery]: { fontSize: '14px', lineHeight: 1.45 } }}>{row.value}</Typography>
                  </Box>
                ))}

                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight />}
                  fullWidth
                  onClick={() => handleNavigate('contact')}
                  sx={{
                    mt: 3,
                    bgcolor: C.primary,
                    color: C.onInverse,
                    fontWeight: 700,
                    fontSize: { xs: 15, md: 16 },
                    py: 1.5,
                    borderRadius: 1,
                    textTransform: 'none',
                    boxShadow: `0 8px 24px ${alpha(C.ink, 0.18)}`,
                    '&:hover': { bgcolor: C.dark },
                    [mobileQuery]: { mt: '20px', minHeight: 44, py: '8px', fontSize: '14px' },
                  }}
                >
                  Demander un devis
                </Button>
                <Typography sx={{ mt: 1.5, textAlign: 'center', fontSize: 12.5, color: C.muted, [mobileQuery]: { fontSize: '12px', lineHeight: 1.45 } }}>
                  Réponse personnalisée · Sans engagement
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
