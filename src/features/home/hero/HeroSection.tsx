'use client';

import { useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { Box, Container, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { ArrowForward as ArrowRight } from '@mui/icons-material';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import type { Product, Category } from '@/lib/types';
import SweepButton from '@/components/ui/SweepButton';
import styles from './HeroSection.module.css';
import HeroImage from './HeroImage';
import HeroProofs, { type HeroProof } from './HeroProofs';
import {
  heroButtonsSx,
  heroCategoriesGridSx,
  heroContentSx,
  heroContainerSx,
  heroGridSx,
  heroImageGridSx,
  heroImageColumnSx,
  heroPrimaryButtonSx,
  heroSectionSx,
  heroSecondaryButtonSx,
  heroSubtitleSx,
  heroTextGridSx,
  heroTitleSx,
} from './heroStyles';

const HERO_CONFIG = {
  title: 'Meubles et déco importés de Chine, livrés à Dakar en 24\u00A0à\u00A048\u00A0h',
  subtitle: 'Des pièces choisies en usine et inspectées en vidéo avant l’envoi, pour particuliers et professionnels.',
  proofs: [
    { icon: 'delivery', text: '24\u00A0à\u00A048\u00A0h Dakar & banlieue' },
    { icon: 'quality', text: 'Qualité premium !' },
    { icon: 'payment', text: 'Paiement à la livraison' },
  ] satisfies readonly HeroProof[],
  cta: {
    primary: 'Explorer la boutique',
    whatsapp: 'Demander un devis',
  },
  image: '/banner.jpg',
  imageAlt: 'Salon meublé avec vos produits — DameDéco Import',
} as const;

interface HeroSectionProps {
  onNavigate: (path: string) => void;
  onViewProduct: (product: Product) => void;
  onViewCategory?: (categoryId: string) => void;
  featuredProduct: Product | null;
  featuredDiscount: number | null;
  heroCategoryTags: Category[];
  heroCategories: ReactNode;
}

export default function HeroSection({
  onNavigate,
  featuredProduct,
  featuredDiscount,
  heroCategoryTags,
  heroCategories,
}: HeroSectionProps) {
  const scope = useRef<HTMLDivElement>(null);
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
          intro.fromTo(
            select('[data-hero="title"]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, immediateRender: false },
          );
          intro.fromTo(
            select('[data-hero="paragraph"]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, immediateRender: false },
            '<0.12',
          );
          intro.fromTo(
            select('[data-hero="bullet"]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, stagger: 0.1, immediateRender: false },
            '<0.12',
          );
          intro.fromTo(
            select('[data-hero="buttons"]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, immediateRender: false },
            '<0.12',
          );
          intro.fromTo(
            select('[data-hero="image"]'),
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, immediateRender: false },
            '<0.12',
          );
          intro.fromTo(
            select('[data-hero="badge"]'),
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power3.out',
              immediateRender: false,
            },
            '<0.15',
          );
          intro.fromTo(
            select('[data-hero="card"]'),
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: 'power3.out',
              delay: 0.15,
              immediateRender: false,
            },
            '<0.15',
          );
        },
      );

      return () => media.revert();
    },
    { scope, dependencies: [shouldPlayIntro], revertOnUpdate: true },
  );

  return (
    <Box
      ref={scope}
      component="section"
      className={styles.heroSection}
      sx={heroSectionSx}
    >
      <Container maxWidth={false} disableGutters sx={heroContainerSx}>
        <Grid container spacing={0} sx={heroGridSx}>
          <Grid size={{ xs: 12, lg: 5 }} sx={heroTextGridSx}>
            <Box sx={heroContentSx}>
              <Typography
                className={styles.entranceItem}
                data-hero="title"
                component="h1"
                sx={heroTitleSx}
              >
                {HERO_CONFIG.title}
              </Typography>

              <Typography
                className={styles.entranceItem}
                data-hero="paragraph"
                sx={heroSubtitleSx}
              >
                {HERO_CONFIG.subtitle}
              </Typography>

              <Stack
                className={styles.entranceItem}
                data-hero="buttons"
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1.25, sm: 1.5 }}
                sx={heroButtonsSx}
              >
                <SweepButton
                  className={styles.primaryButton}
                  size="large"
                  endIcon={<ArrowRight />}
                  onClick={() => onNavigate('shop')}
                  sx={heroPrimaryButtonSx}
                >
                  {HERO_CONFIG.cta.primary}
                </SweepButton>
                <SweepButton
                  variant="outline"
                  size="large"
                  onClick={() => onNavigate('contact')}
                  sx={heroSecondaryButtonSx}
                >
                  {HERO_CONFIG.cta.whatsapp}
                </SweepButton>
              </Stack>

              <HeroProofs proofs={HERO_CONFIG.proofs} />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 7 }} sx={heroImageGridSx}>
            <Grid container direction="column" sx={heroImageColumnSx}>
              <Grid size={12}>
                <HeroImage
                  featuredProduct={featuredProduct}
                  featuredDiscount={featuredDiscount}
                  image={HERO_CONFIG.image}
                  imageAlt={HERO_CONFIG.imageAlt}
                />
              </Grid>
              <Grid size={12} sx={heroCategoriesGridSx}>
                {heroCategories}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
