'use client';

import { useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowForward as ArrowRight,
  LocalShipping as Truck,
  Payment as PaymentIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { formatFcfa } from '@/lib/format';
import { Product, Category } from '@/lib/types';
import { FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';
import { NAVBAR_HEIGHT, CONTENT_CONTAINER_SX } from '@/components/Navigation';
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
  title: 'Meubles et déco importés de Chine, livrés à Dakar en 24-48h',
  subtitle: 'Des pièces choisies en usine et inspectées en vidéo avant l\'envoi, pour particuliers et professionnels.',
  proofs: [
    { icon: 'delivery', text: '24-48h Dakar & banlieue' },
    { icon: 'inspection', text: 'Inspection vidéo en usine' },
    { icon: 'payment', text: 'Paiement à la livraison' },
  ],
  cta: {
    primary: 'Explorer la boutique',
    whatsapp: 'Commander sur WhatsApp',
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
  const heroMinHeight = `calc(100svh - ${NAVBAR_HEIGHT.md}px)`;

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
            '[data-hero="title"], [data-hero="paragraph"], [data-hero="bullet"], [data-hero="buttons"], [data-hero="image"]',
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

  return (
    <Box
      ref={scope}
      component="section"
      className={styles.heroSection}
      sx={{
        bgcolor: HERO.background,
        minHeight: { xs: 'auto', lg: heroMinHeight },
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          ...CONTENT_CONTAINER_SX,
          position: 'relative',
          zIndex: 1,
          pt: 6,
          pb: 6,
          minHeight: { lg: heroMinHeight },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Grid container spacing={{ xs: 3, sm: 4, lg: 5 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, lg: 5 }} offset={{ lg: 1 }} sx={{ order: { xs: 1, lg: 1 }, alignSelf: 'center' }}>
            <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 725 } }}>
              <Typography
                className={styles.entranceItem}
                data-hero="title"
                component="h1"
                sx={{
                  fontFamily: FONT_FRAUNCES,
                  fontWeight: 400,
                  fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
                  lineHeight: 1.08,
                  letterSpacing: '-0.01em',
                  color: HERO.title,
                  maxWidth: '14ch',
                  mb: 2.5,
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
                sx={{ mb: 2.5 }}
              >
                <Button
                  className={styles.primaryButton}
                  variant="contained"
                  size="large"
                  onClick={() => onNavigate('shop')}
                  sx={{
                    bgcolor: HERO.cta,
                    color: HERO.ctaText,
                    borderRadius: '10px',
                    height: '52px',
                    px: 3,
                    boxShadow: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': { bgcolor: HERO.cta, boxShadow: 'none' },
                  }}
                >
                  {HERO_CONFIG.cta.primary}
                </Button>
                <Button
                  variant="text"
                  size="large"
                  endIcon={<ArrowRight />}
                  onClick={() => {
                    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '221771234567';
                    const message = encodeURIComponent('Bonjour, je souhaite commander chez DameDéco');
                    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                  }}
                  sx={{
                    color: HERO.cta,
                    bgcolor: 'transparent',
                    borderRadius: '10px',
                    px: 3,
                    height: '52px',
                    fontSize: '16px',
                    fontWeight: 600,
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                    textDecoration: 'none',
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline', boxShadow: 'none' },
                  }}
                >
                  {HERO_CONFIG.cta.whatsapp}
                </Button>
              </Stack>

              <Box
                sx={{
                  borderTop: `1px solid ${HERO.divider}`,
                  paddingTop: 2.5,
                }}
              >
                <Stack direction="row" spacing="8px">
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
                        <Typography sx={{ fontSize: '14px', color: HERO.proofText, fontWeight: 500, lineHeight: 1.4 }}>
                          {proof.text}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }} sx={{ order: { xs: 2, lg: 2 }, alignSelf: 'stretch', mx: { lg: -4 } }}>
            <Box data-hero="image" className={styles.entranceItem} sx={{ position: 'relative', width: '100%', height: { lg: '100%' } }}>
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
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, (max-width: 1200px) 50vw, 600px"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
