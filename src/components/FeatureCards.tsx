'use client';

import { useActiveOnScroll } from '@/hooks/useActiveOnScroll';
import { Inventory2 as Package, LocalShipping as Truck, Security as Shield } from '@mui/icons-material';
import { Box, Stack, Typography, useTheme, alpha } from '@mui/material';
import { FONT_DISPLAY } from '@/theme';
import { tokens } from '@/theme/tokens';
import styles from './HomePage.module.css';
import { FooterPayments } from './FooterPayments';

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

interface FeatureCardsProps {
  mobileQuery: any;
}

export function FeatureCards({ mobileQuery }: FeatureCardsProps) {
  const theme = useTheme();
  const { getRef, active } = useActiveOnScroll({ count: FEATURES.length });

  return (
    <>
      {FEATURES.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <Box
            key={feature.num}
            ref={getRef(index)}
            data-index={index}
            data-active={active === index}
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
                  fontFamily: FONT_DISPLAY,
                  fontSize: { xs: 15, md: 16 },
                  fontWeight: 400,
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
                fontFamily: FONT_DISPLAY,
                fontSize: { xs: 18, sm: 19, md: 20.5, lg: 22 },
                fontWeight: 400,
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
                  <FooterPayments />
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );
}
