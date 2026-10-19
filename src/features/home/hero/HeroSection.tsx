'use client';

import { useRef } from 'react';
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
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  ArrowForward as ArrowRight,
  CheckCircle,
  Inventory2 as Package,
  LocalShipping as Truck,
  Place as PlaceIcon,
  RequestQuote as RequestQuoteIcon,
} from '@mui/icons-material';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { getImageUrl } from '@/lib/imageUtils';
import { formatFcfa } from '@/lib/format';
import { Product, Category } from '@/lib/types';
import { FONT_POPPINS } from '@/theme';
import { tokens } from '@/theme/tokens';
import { NAVBAR_HEIGHT } from '@/components/Navigation';
import styles from './HeroSection.module.css';

const C = {
  primary: tokens.colors.brand.main,
  dark: tokens.colors.surfaces.inverse,
  light: tokens.colors.brand.soft,
  surface: tokens.colors.surfaces.alt,
  border: tokens.colors.border.light,
  mid: tokens.colors.brand.soft,
  muted: tokens.colors.text.secondary,
  text: tokens.colors.text.secondary,
  laitonOnLight: tokens.colors.accent.onLight,
  ink: tokens.colors.surfaces.inverse,
  onInverse: tokens.colors.text.onInverse,
} as const;

const HERO_IMAGE = '/banner.jpg';
const formatPrice = (amount: number) => formatFcfa(amount);

interface HeroSectionProps {
  onNavigate: (path: string) => void;
  onViewProduct: (product: Product) => void;
  onViewCategory?: (categoryId: string) => void;
  featuredProduct: Product | null;
  featuredDiscount: number | null;
  heroCategoryTags: Category[];
  loading: boolean;
}

function HeroProductThumb({ name, coverImage }: { name?: string; coverImage?: string }) {
  const initial = (name?.trim().charAt(0) || 'D').toUpperCase();
  const imgSrc = coverImage ? getImageUrl(coverImage) : null;

  return (
    <Box
      sx={{
        width: { xs: 52, sm: 70 },
        height: { xs: 52, sm: 70 },
        borderRadius: { xs: '12px', sm: '15px' },
        flexShrink: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: imgSrc ? 'transparent' : tokens.colors.brand.main,
        color: tokens.colors.text.onInverse,
        fontWeight: 800,
        fontSize: { xs: 21, sm: 27.5 },
        letterSpacing: '-0.02em',
        boxShadow: imgSrc
          ? `0 4px 14px ${alpha(C.ink, 0.12)}`
          : `0 4px 14px ${alpha(C.ink, 0.18)}`,
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

export default function HeroSection({
  onNavigate,
  onViewProduct,
  onViewCategory,
  featuredProduct,
  featuredDiscount,
  heroCategoryTags,
  loading,
}: HeroSectionProps) {
  const theme = useTheme();
  const mobileQuery = theme.breakpoints.down(768);
  const scope = useRef<HTMLDivElement>(null);
  const heroMinHeight = `calc(100dvh - ${NAVBAR_HEIGHT.md}px)`;

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      const select = gsap.utils.selector(scope.current);
      media.add(
        {
          reducedMotion: '(prefers-reduced-motion: reduce)',
          fullMotion: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const entranceTargets = select(
            '[data-hero="location"], [data-hero="title"], [data-hero="paragraph"], [data-hero="bullet"], [data-hero="buttons"], [data-hero="image"]',
          );

          if (context.conditions?.reducedMotion) {
            gsap.set(entranceTargets, { opacity: 1, y: 0 });
            return;
          }

          if (!context.conditions?.fullMotion) return;

          const intro = gsap.timeline({
            defaults: { duration: 0.8, ease: 'power3.out' },
          });
          intro.fromTo(select('[data-hero="location"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0 });
          intro.fromTo(select('[data-hero="title"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, '<0.12');
          intro.fromTo(select('[data-hero="paragraph"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, '<0.12');
          intro.fromTo(
            select('[data-hero="bullet"]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, stagger: 0.1 },
            '<0.12',
          );
          intro.fromTo(select('[data-hero="buttons"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, '<0.12');
          intro.fromTo(select('[data-hero="image"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, '<0.12');
        },
      );

      return () => media.revert();
    },
    { scope },
  );

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      const select = gsap.utils.selector(scope.current);

      media.add(
        {
          reducedMotion: '(prefers-reduced-motion: reduce)',
          fullMotion: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          if (context.conditions?.reducedMotion || !context.conditions?.fullMotion) return;

          gsap.to(select('[data-hero="featured-product"]'), {
            y: -7,
            duration: 3.2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 0.2,
          });

          if (featuredDiscount !== null) {
            gsap.fromTo(
              select('[data-hero="discount"]'),
              { boxShadow: `0 0 0 0 ${alpha(tokens.colors.status.error, 0.35)}` },
              {
                boxShadow: `0 0 0 5px ${alpha(tokens.colors.status.error, 0)}`,
                duration: 0.8,
                ease: 'power1.out',
                yoyo: true,
                repeat: -1,
                delay: 0.4,
              },
            );
          }
        },
      );

      return () => media.revert();
    },
    { scope, dependencies: [featuredDiscount], revertOnUpdate: true },
  );

  return (
    <Box
      ref={scope}
      component="section"
      className={styles.heroSection}
      sx={{
        bgcolor: C.surface,
        minHeight: { xs: 'auto', lg: heroMinHeight },
      }}
    >
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
          <Grid size={{ xs: 12, lg: 5 }} offset={{ lg: 1 }}>
            <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 725 } }}>
              <Box
                className={styles.entranceItem}
                data-hero="location"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: { xs: 0.75, sm: 1 },
                  bgcolor: alpha(C.ink, 0.04),
                  border: `1px solid ${C.border}`,
                  borderRadius: '100px',
                  px: { xs: 1.25, sm: 1.5, md: 1.75 },
                  py: { xs: 0.5, sm: 0.625 },
                  mb: { xs: 2.5, sm: 3, md: 3.5 },
                  boxShadow: '0 2px 12px rgba(4, 44, 83, 0.06)',
                }}
              >
                <Box sx={{ width: { xs: 7, sm: 8, md: 8.75 }, height: { xs: 7, sm: 8, md: 8.75 }, borderRadius: '50%', bgcolor: tokens.colors.status.success, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlaceIcon sx={{ fontSize: { xs: 14, sm: 15, md: 16.5 }, color: '#fff' }} />
                </Box>
                <Typography sx={{ fontSize: { xs: 13, sm: 14, md: 15 }, fontWeight: 600, color: C.dark, letterSpacing: '0.04em' }}>
                  Dakar, Sénégal · Import premium direct depuis la Chine 🇨🇳 → 🇸🇳
                </Typography>
              </Box>

              <Typography
                className={styles.entranceItem}
                data-hero="title"
                component="h1"
                sx={{
                  fontWeight: 800,
                  fontFamily: FONT_POPPINS,
                  fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.75rem', lg: '3.15rem', xl: '3.5rem' },
                  lineHeight: { xs: 1.15, sm: 1.1, md: 1.08 },
                  letterSpacing: '-0.035em',
                  color: C.dark,
                  mb: { xs: 2.5, sm: 3 },
                  [mobileQuery]: { fontSize: 'clamp(26px, 7.2vw, 30px)', lineHeight: 1.15, mb: '16px' },
                }}
              >
                L&apos;art de{' '}
                <Box component="span" sx={{ color: C.laitonOnLight }}>
                  sublimer
                </Box>{' '}
                votre intérieur
              </Typography>

              <Typography
                className={styles.entranceItem}
                data-hero="paragraph"
                sx={{
                  fontSize: { xs: 15, sm: 17, md: 18.75, lg: 20 },
                  color: C.text,
                  lineHeight: { xs: 1.6, sm: 1.7, md: 1.75 },
                  mb: { xs: 2.5, sm: 3, md: 3.5 },
                  maxWidth: { xs: '100%', sm: 550, md: 600 },
                  [mobileQuery]: { fontSize: '14px', lineHeight: 1.5, mb: '18px' },
                }}
              >
                Mobilier d&apos;exception, décoration tendance et textiles haut de gamme sélectionnés par DameDéco — import direct usine sans intermédiaire, qualité rigoureusement contrôlée, livraison express à Dakar &amp; banlieue.
              </Typography>

              <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 3.5, sm: 4.5 }, [mobileQuery]: { gap: '12px', mb: '24px' } }}>
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
                    className={styles.entranceItem}
                    data-hero="bullet"
                    spacing={{ xs: 0.5, sm: 0.75 }}
                    sx={{ alignItems: 'flex-start', [mobileQuery]: { gap: '4px' } }}
                  >
                    <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} sx={{ alignItems: 'flex-start' }}>
                      <CheckCircle sx={{ fontSize: { xs: 18, sm: 20, md: 21.25 }, color: C.primary, mt: { xs: 0.15, sm: 0.25 }, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: { xs: 14, sm: 15.5, md: 16.875 }, color: C.dark, fontWeight: 600, lineHeight: { xs: 1.4, sm: 1.5 }, [mobileQuery]: { fontSize: '16px', lineHeight: 1.4 } }}>
                        {pt.title}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: { xs: 13, sm: 14, md: 14.5 }, color: C.muted, lineHeight: { xs: 1.4, sm: 1.5 }, ml: { xs: 3.25, sm: 4.25 }, [mobileQuery]: { fontSize: '13px', lineHeight: 1.45, ml: '30px' } }}>
                      {pt.sub}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Stack
                className={styles.entranceItem}
                data-hero="buttons"
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.25, sm: 1.5 }}
                sx={{ mb: { xs: 3.5, sm: 4.5, md: 6 }, [mobileQuery]: { gap: '10px', mb: '28px' } }}
              >
                <Button
                  className={styles.primaryButton}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight />}
                  onClick={() => onNavigate('shop')}
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
                    boxShadow: `0 8px 24px ${alpha(C.ink, 0.12)}`,
                    '&:hover': {
                      bgcolor: C.dark,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 12px 32px ${alpha(C.ink, 0.14)}`,
                    },
                    [mobileQuery]: { fontSize: '14px', minHeight: 44, py: '8px' },
                  }}
                >
                  Explorer la Boutique
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<RequestQuoteIcon />}
                  onClick={() => onNavigate('contact')}
                  sx={{
                    borderColor: C.border,
                    color: C.primary,
                    bgcolor: 'background.paper',
                    borderRadius: { xs: '10px', sm: '12.5px' },
                    px: { xs: 1.75, sm: 2.5, md: 3 },
                    py: { xs: 1.25, sm: 1.15, md: 1.25 },
                    fontSize: { xs: 14.5, sm: 15.5, md: 17.5 },
                    fontWeight: 600,
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                    whiteSpace: 'normal',
                    '&:hover': { bgcolor: C.light, borderColor: C.mid },
                    [mobileQuery]: { fontSize: '14px', minHeight: 44, py: '8px' },
                  }}
                >
                  Demander un Devis
                </Button>
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }} sx={{ overflow: 'hidden', width: '100%' }}>
            <Box data-hero="image" className={styles.entranceItem} sx={{ mx: 'auto', width: '100%', maxWidth: { xs: '100%', sm: '90%', md: '85%', lg: 700 } }}>
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
                      color: C.onInverse,
                      boxShadow: '0 8px 24px rgba(4, 44, 83, 0.3)',
                    }}
                  >
                    <Truck sx={{ fontSize: 21.25, color: C.mid }} />
                    <Box>
                      <Typography sx={{ fontSize: 11.25, color: alpha(C.onInverse, 0.65), lineHeight: 1.2, [mobileQuery]: { fontSize: '12px', lineHeight: 1.4 } }}>Livraison express</Typography>
                      <Typography sx={{ fontSize: 13.75, fontWeight: 700, [mobileQuery]: { fontSize: '14px', lineHeight: 1.4 } }}>Dakar &amp; banlieue</Typography>
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
                    onClick={() => (onViewCategory ? onViewCategory(cat.id) : onNavigate('shop'))}
                    clickable
                    sx={{
                      px: { xs: 1, sm: 1.5 },
                      py: { xs: 0.5, sm: 0.75 },
                      borderRadius: '12.5px',
                      bgcolor: 'background.paper',
                      border: `1px solid ${C.border}`,
                      color: C.dark,
                      fontSize: { xs: 13, sm: 14.375 },
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: `0 4px 12px ${alpha(C.ink, 0.10)}`,
                      transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                      '&:hover': {
                        bgcolor: C.light,
                        borderColor: C.primary,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 6px 16px ${alpha(C.ink, 0.12)}`,
                      },
                    }}
                  />
                ))}
                <Chip
                  label="Plus"
                  icon={<AddIcon sx={{ fontSize: { xs: 15, sm: 17.5 }, color: C.primary }} />}
                  onClick={() => onNavigate('shop')}
                  clickable
                  sx={{
                    px: { xs: 1, sm: 1.5 },
                    py: { xs: 0.5, sm: 0.75 },
                    borderRadius: '12.5px',
                    bgcolor: alpha(C.ink, 0.04),
                    border: `1px dashed ${C.border}`,
                    color: C.primary,
                    fontSize: { xs: 13, sm: 14.375 },
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.15s ease, border-color 0.15s ease',
                    '&:hover': {
                      bgcolor: alpha(C.ink, 0.06),
                      borderColor: C.primary,
                    },
                  }}
                />
              </Box>

              <Paper
                elevation={0}
                data-hero="featured-product"
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
                  p: { xs: 1.25, sm: 2 },
                  borderRadius: { xs: '16px', sm: '25px' },
                  bgcolor: 'background.paper',
                  border: `1px solid ${C.border}`,
                  cursor: featuredProduct ? 'pointer' : 'default',
                  outline: 'none',
                  willChange: 'transform',
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
                  <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center' }}>
                    <HeroProductThumb name={featuredProduct.name} coverImage={featuredProduct.cover_image_url} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                        <Typography sx={{ fontSize: { xs: 10.5, sm: 12.5 }, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.primary, [mobileQuery]: { fontSize: '12px' } }}>
                          Sélection du moment
                        </Typography>
                        {featuredDiscount != null && (
                          <Chip
                            data-hero="discount"
                            label={`-${featuredDiscount}%`}
                            size="small"
                            sx={{
                              height: { xs: 20, sm: 22.5 },
                              fontSize: { xs: 11, sm: 12.5 },
                              fontWeight: 800,
                              [mobileQuery]: { fontSize: '12px', height: 22 },
                              bgcolor: alpha(tokens.colors.status.error, 0.1),
                              color: tokens.colors.status.error,
                            }}
                          />
                        )}
                      </Stack>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: 15.5, sm: 18.75 },
                          [mobileQuery]: { fontSize: '16px' },
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
                        <Typography sx={{ fontSize: { xs: 15.5, sm: 18.75 }, fontWeight: 800, color: C.primary, [mobileQuery]: { fontSize: '15px' } }}>
                          {formatPrice(featuredProduct.price)}
                        </Typography>
                        {featuredProduct.compare_price && featuredProduct.compare_price > featuredProduct.price && (
                          <Typography sx={{ fontSize: { xs: 12.5, sm: 15 }, color: C.muted, textDecoration: 'line-through', [mobileQuery]: { fontSize: '12px' } }}>
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
                        display: { xs: 'none', sm: 'flex' },
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
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.primary, mb: 0.5, [mobileQuery]: { fontSize: '12px' } }}>
                        Sélection du moment
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: 17, color: C.dark, lineHeight: 1.3, [mobileQuery]: { fontSize: '16px' } }}>
                        Notre sélection arrive prochainement
                      </Typography>
                      <Typography sx={{ fontSize: 13.5, color: C.muted, mt: 0.5, [mobileQuery]: { fontSize: '13px', lineHeight: 1.45 } }}>
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
  );
}