'use client';

import { useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Stack,
  alpha,
  useTheme,
  Chip,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowForward as ArrowRight,
  LocalShipping as Truck,
  Payment as PaymentIcon,
  Videocam as VideocamIcon,
  LocalShippingOutlined,
  Inventory2Outlined,
  ArrowForward,
} from '@mui/icons-material';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { formatFcfa } from '@/lib/format';
import { getImageUrl } from '@/lib/imageUtils';
import { Product, Category } from '@/lib/types';
import { FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';
import { NAVBAR_HEIGHT, CONTENT_CONTAINER_SX } from '@/components/Navigation';
import SweepButton from '@/components/ui/SweepButton';
import { sweepHoverSx } from '@/components/ui/sweepHover';
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

// Couleurs propres au hero (design maquette).
const HERO = {
  background: tokens.colors.surfaces.default,
  title: '#1B2433',
  proofText: '#2A3344',
  proofIcon: '#8A6A2E',
  divider: '#E0D8C9',
  cta: '#1E3A6E',
  ctaText: '#FFFFFF',
} as const;

const HERO_CONFIG = {
  title: 'Meubles et déco importés de Chine, livrés à Dakar en 24\u00A0à\u00A048\u00A0h',
  subtitle: 'Des pièces choisies en usine et inspectées en vidéo avant l\'envoi, pour particuliers et professionnels.',
  proofs: [
    { icon: 'delivery', text: '24\u00A0à\u00A048\u00A0h Dakar & banlieue' },
    { icon: 'inspection', text: 'Inspection vidéo en usine' },
    { icon: 'payment', text: 'Paiement à la livraison' },
  ],
  cta: {
    primary: 'Explorer la boutique',
    whatsapp: 'Demander un devis',
  },
  image: '/banner.jpg',
  imageAlt: 'Salon meublé avec vos produits — DameDéco Import',
} as const;

const HERO_IMAGE = HERO_CONFIG.image;
const formatPrice = (amount: number) => formatFcfa(amount);

interface HeroSectionProps {
  onNavigate: (path: string) => void;
  onViewProduct: (product: Product) => void;
  onViewCategory?: (categoryId: string) => void;
  featuredProduct: Product | null;
  featuredDiscount: number | null;
  heroCategoryTags: Category[];
}

export default function HeroSection({
  onNavigate,
  onViewProduct,
  onViewCategory,
  featuredProduct,
  featuredDiscount,
  heroCategoryTags,
}: HeroSectionProps) {
  const theme = useTheme();
  const mobileQuery = theme.breakpoints.down(768);
  const scope = useRef<HTMLDivElement>(null);
  const heroMinHeight = { xs: 'auto', sm: `calc(100svh - ${NAVBAR_HEIGHT.sm}px)`, md: `calc(100svh - ${NAVBAR_HEIGHT.md}px)` };

  // Les donnees du hero sont desormais presentes au premier rendu (page rendue
  // cote serveur). La timeline d'entree ne demarre que si elles le sont, sinon
  // GSAP laisserait les elements en opacity: 0.
  const hasHeroData = featuredProduct !== null || heroCategoryTags.length > 0;

  const wasServerRendered = useMemo(() => {
    if (typeof document === 'undefined') return false;
    return document.querySelector('[data-hero="title"]') !== null;
  }, []);

  const shouldPlayIntro = !wasServerRendered && hasHeroData;

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
            '[data-hero="title"], [data-hero="paragraph"], [data-hero="bullet"], [data-hero="buttons"], [data-hero="image"], [data-hero="badge"], [data-hero="card"]',
          );

          if (context.conditions?.reducedMotion) {
            gsap.set(entranceTargets, { opacity: 1, y: 0 });
            return;
          }

          if (!context.conditions?.fullMotion) return;

          if (!shouldPlayIntro) {
            gsap.set(entranceTargets, { opacity: 1, y: 0 });
            return;
          }

          const intro = gsap.timeline({
            defaults: { duration: 0.8, ease: 'power3.out' },
          });
          intro.fromTo(select('[data-hero="title"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, immediateRender: false });
          intro.fromTo(select('[data-hero="paragraph"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, immediateRender: false }, '<0.12');
          intro.fromTo(
            select('[data-hero="bullet"]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, stagger: 0.1, immediateRender: false },
            '<0.12',
          );
          intro.fromTo(select('[data-hero="buttons"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, immediateRender: false }, '<0.12');
          intro.fromTo(select('[data-hero="image"]'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, immediateRender: false }, '<0.12');
          intro.fromTo(select('[data-hero="badge"]'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false }, '<0.15');
          intro.fromTo(
            select('[data-hero="card"]'),
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: 0.15, immediateRender: false },
            '<0.15',
          );
        },
      );

      return () => media.revert();
    },
    { scope, dependencies: [shouldPlayIntro], revertOnUpdate: true },
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

          if (wasServerRendered) return;
        },
      );

      return () => media.revert();
    },
    { scope, dependencies: [wasServerRendered], revertOnUpdate: true },
  );

  // Badge "Livraison express"
  const DeliveryBadge = () => (
    <Box
      data-hero="badge"
      sx={{
        position: 'absolute',
        top: { xs: 12, md: 16, lg: 24 },
        right: { xs: 12, md: 16, lg: 24 },
        bgcolor: theme.palette.primary.main,
        color: 'white',
        borderRadius: '14px',
        padding: '10px 16px',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        zIndex: 2,
        maxWidth: '200px',
      }}
    >
      <LocalShippingOutlined
        sx={{ fontSize: 20, color: 'white' }}
        aria-hidden="true"
      />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography
          sx={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          Livraison express
        </Typography>
        <Typography
          sx={{
            fontSize: '15px',
            fontWeight: 600,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
          }}
        >
          Dakar & banlieue
        </Typography>
      </Box>
    </Box>
  );

  // Carte "Sélection du moment"
  const SelectionCard = () => {
    const hasFeaturedProduct = featuredProduct !== null;
    const originalPrice = featuredProduct
      ? Number(featuredProduct.original_price ?? featuredProduct.compare_price ?? 0)
      : 0;
    const currentPrice = featuredProduct ? Number(featuredProduct.price) : 0;
    const hasDiscount = originalPrice > currentPrice;
    const savingsAmount = hasDiscount ? originalPrice - currentPrice : 0;
    const discountPercent = hasDiscount
      ? Math.round((savingsAmount / originalPrice) * 100)
      : featuredDiscount;
    const href = featuredProduct ? `/product/${featuredProduct.id}` : '/shop';

    return (
      <Box
        component={Link}
        href={href}
        data-hero="card"
        sx={{
          position: { xs: 'relative', sm: 'relative', md: 'absolute' },
          bottom: { md: 16, lg: 24 },
          left: 'auto',
          right: {
            md: 16,
            lg: 'calc(-24px - max(0px, (100vw - 1600px) / 2))',
            xl: 'calc(-40px - max(0px, (100vw - 1600px) / 2))',
          },
          mt: { xs: 2, sm: 2, md: 0 },
          width: { xs: '100%', md: 360, lg: 420 },
          maxWidth: { xs: '100%', md: 360, lg: 420 },
          bgcolor: alpha(theme.palette.background.paper, 0.94),
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: { xs: '12px 14px', sm: '14px 18px' },
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.25, sm: 1.75 },
          textDecoration: 'none',
          zIndex: 2,
          transition: 'transform 0.3s ease',
          '@keyframes heroSelectionFloat': {
            '0%, 100%': { translate: '0 0' },
            '50%': { translate: '0 -6px' },
          },
          animation: 'heroSelectionFloat 3.2s ease-in-out infinite',
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
          '@media (hover: hover)': {
            '&:hover': {
              transform: 'translateY(-2px)',
              '& .arrow-icon': {
                transform: 'translateX(4px)',
              },
            },
          },
          '@supports not (backdrop-filter: blur(10px))': {
            bgcolor: theme.palette.background.paper,
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        }}
      >
        <Box
          sx={{
            width: { xs: 64, sm: 76 },
            height: { xs: 64, sm: 76 },
            borderRadius: '12px',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {hasFeaturedProduct && featuredProduct.cover_image_url ? (
            <Box
              component="img"
              src={getImageUrl(featuredProduct.cover_image_url)}
              alt={featuredProduct.name}
              loading="lazy"
              decoding="async"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          ) : (
            <Inventory2Outlined
              sx={{ fontSize: 28, color: theme.palette.primary.main }}
              aria-hidden="true"
            />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: theme.palette.golden.main,
              mb: 0.5,
            }}
          >
            SÉLECTION DU MOMENT
          </Typography>
          {hasFeaturedProduct ? (
            <>
              <Typography
                sx={{
                  fontSize: { xs: '15px', sm: '16px' },
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {featuredProduct.name}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  columnGap: 1,
                  rowGap: 0.25,
                  mt: 0.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '14px', sm: '15px' },
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatPrice(currentPrice)}
                </Typography>
                {hasDiscount && (
                  <Typography
                    sx={{
                      fontSize: { xs: '12px', sm: '13px' },
                      color: theme.palette.text.disabled,
                      textDecoration: 'line-through',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatPrice(originalPrice)}
                  </Typography>
                )}
                {hasDiscount && discountPercent != null && (
                  <Chip
                    label={`-${discountPercent}%`}
                    size="small"
                    color="error"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </Box>
              {hasDiscount && (
                <Typography
                  sx={{
                    fontSize: { xs: '12px', sm: '12.5px' },
                    fontWeight: 600,
                    color: tokens.colors.status.success,
                    lineHeight: 1.3,
                    mt: 0.25,
                  }}
                >
                  Économisez {formatPrice(savingsAmount)}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography
                sx={{
                  fontSize: '17px',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  lineHeight: 1.3,
                }}
              >
                Notre sélection arrive prochainement
              </Typography>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.text.secondary,
                }}
              >
                Parcourez la boutique dès maintenant.
              </Typography>
            </>
          )}
        </Box>
        <ArrowForward
          className="arrow-icon"
          sx={{
            fontSize: 20,
            color: theme.palette.primary.main,
            flexShrink: 0,
            transition: 'transform 0.3s ease',
          }}
          aria-hidden="true"
        />
      </Box>
    );
  };

  // Catégories chips
  const CategoryChips = () => {
    const displayCategories = heroCategoryTags.slice(0, 5);
    const hasMore = heroCategoryTags.length > 6;

    if (heroCategoryTags.length === 0) return null;

    return (
      <Box
        component="nav"
        aria-label="Catégories"
        sx={{
          mt: { xs: 2, sm: 2, md: 2 },
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          px: 1,
          '::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {displayCategories.map((category) => (
          <Chip
            key={category.id}
            component={Link}
            href={`/shop?category=${category.id}`}
            label={category.name}
            variant="outlined"
            sx={{
              height: '36px',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 500,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'transparent',
              color: theme.palette.text.primary,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              position: 'relative',
              ...sweepHoverSx({
                fill: theme.palette.primary.main,
                hoverColor: 'white',
                hoverBorderColor: theme.palette.primary.main,
              }),
              '&.Mui-focusVisible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              },
            }}
          />
        ))}
        {hasMore && (
          <Chip
            component={Link}
            href="/shop"
            label="Plus +"
            variant="outlined"
            sx={{
              height: '36px',
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: 500,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'transparent',
              color: theme.palette.text.primary,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              scrollSnapAlign: 'start',
              position: 'relative',
              ...sweepHoverSx({
                fill: theme.palette.primary.main,
                hoverColor: 'white',
                hoverBorderColor: theme.palette.primary.main,
              }),
              '&.Mui-focusVisible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              },
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box
      ref={scope}
      component="section"
      className={styles.heroSection}
      sx={{
        bgcolor: HERO.background,
        minHeight: heroMinHeight,
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          ...CONTENT_CONTAINER_SX,
          pt: 6,
          pb: 6,
          minHeight: heroMinHeight,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Grid
          container
          spacing={0}
          sx={{ alignItems: 'stretch', flex: 1, width: '100%' }}
        >
          <Grid size={{ xs: 12, lg: 5 }} sx={{ order: { xs: 1, lg: 1 }, alignSelf: 'center' }}>
            <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 725 } }}>
              <Typography
                className={styles.entranceItem}
                data-hero="title"
                component="h1"
                sx={{
                  fontFamily: FONT_FRAUNCES,
                  fontWeight: 500,
                  fontSize: 'clamp(2.5rem, 4vw, 4.5rem)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.01em',
                  color: HERO.title,
                  maxWidth: '16ch',
                  mb: 2.5,
                  textWrap: 'balance',
                }}
              >
                {HERO_CONFIG.title}
              </Typography>

              <Typography
                className={styles.entranceItem}
                data-hero="paragraph"
                sx={{
                  fontSize: '16px',
                  color: HERO.proofText,
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: { xs: '100%', sm: 520, md: 580 },
                }}
              >
                {HERO_CONFIG.subtitle}
              </Typography>

              <Stack
                className={styles.entranceItem}
                data-hero="buttons"
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.25, sm: 1.5 }}
                sx={{ mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
              >
                <SweepButton
                  className={styles.primaryButton}
                  size="large"
                  endIcon={<ArrowRight />}
                  onClick={() => onNavigate('shop')}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {HERO_CONFIG.cta.primary}
                </SweepButton>
                <SweepButton
                  variant="outline"
                  size="large"
                  onClick={() => onNavigate('contact')}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  {HERO_CONFIG.cta.whatsapp}
                </SweepButton>
              </Stack>

              <Box
                sx={{
                  borderTop: `1px solid ${HERO.divider}`,
                  paddingTop: 2.5,
                }}
              >
                <Stack direction="row" spacing="8px" sx={{ flexWrap: { xs: 'wrap', lg: 'nowrap' } }}>
                  {HERO_CONFIG.proofs.map((proof, index) => {
                    const Icon = proof.icon === 'delivery' ? Truck : proof.icon === 'inspection' ? VideocamIcon : PaymentIcon;
                    return (
                      <Stack
                        key={proof.text}
                        className={styles.entranceItem}
                        direction="row"
                        spacing="8px"
                        sx={{ alignItems: 'center' }}
                      >
                        <Icon
                          strokeWidth={1.5}
                          sx={{ fontSize: '16px', color: HERO.proofIcon, flexShrink: 0 }}
                        />
                        <Typography sx={{ fontSize: '14px', color: HERO.proofText, fontWeight: 500, lineHeight: 1.4, whiteSpace: { xs: 'normal', lg: 'nowrap' } }}>
                          {proof.text}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            </Box>
          </Grid>

          <Grid
            size={{ xs: 12, lg: 7 }}
            sx={{ order: { xs: 2, lg: 2 }, alignSelf: 'stretch', position: 'relative', minHeight: { xs: 360, sm: 400, md: 440 } }}
          >
            <Box
              data-hero="image"
              className={styles.entranceItem}
              sx={{
                position: { xs: 'relative', lg: 'absolute' },
                top: { lg: 0 },
                bottom: { lg: 0 },
                left: { lg: 0 },
                right: {
                  lg: 'calc(-48px - max(0px, (100vw - 1600px) / 2))',
                  xl: 'calc(-64px - max(0px, (100vw - 1600px) / 2))',
                },
                height: { xs: 360, sm: 400, md: 440, lg: 'auto' },
                mr: { xs: '-20px', sm: '-32px', md: '-32px', lg: 0 },
                overflow: 'hidden',
                borderBottomLeftRadius: '120px',
                bgcolor: C.light,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '40%',
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0))',
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  bgcolor: C.light,
                  borderBottomLeftRadius: '120px',
                }}
              >
                <Image
                  src={HERO_IMAGE}
                  alt={HERO_CONFIG.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, (max-width: 1440px) 55vw, (min-width: 1440px) 46vw"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
                <DeliveryBadge />
              </Box>
            </Box>
            <SelectionCard />
          </Grid>

          {heroCategoryTags.length > 0 && (
            <Grid size={{ xs: 12, lg: 7 }} offset={{ lg: 5 }} sx={{ order: { xs: 3, lg: 3 } }}>
              <CategoryChips />
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
