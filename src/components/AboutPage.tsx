'use client';

import { ArrowOutward, ArrowRight, LocalOffer, Schedule, SupportAgent } from '@mui/icons-material';
import { alpha, Box, Container, Paper, Stack, Typography, Button, Link as MuiLink } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eyebrow } from '@/components/ui/PageHeader';
import { EditorialList } from '@/components/ui/EditorialList';
import { useCategories } from '@/hooks/useCategories';
import { FONT_FRAUNCES, FONT_POPPINS } from '@/theme';
import { tokens } from '@/theme/tokens';

const HISTORY = [
  "Depuis 2010, DameDéco Import & Commerce importe depuis la Chine des produits premium — meubles, décoration et textile — pour les particuliers et les professionnels au Sénégal. Nous travaillons directement avec des fournisseurs certifiés pour garantir les meilleurs prix et un niveau de qualité constant, produit par produit.",
  "Basée à Dakar, l’entreprise accompagne ses clients du choix du produit jusqu’à la livraison. Pour les pros comme pour les particuliers : devis personnalisé, tarifs dégressifs dès 10 pièces et un interlocuteur unique, disponible tout au long de la commande.",
];

const DISTINCTIONS = [
  {
    num: '01',
    title: 'Une sélection exigeante',
    description:
      'Chaque produit est choisi directement chez des fournisseurs certifiés en Chine et contrôlé avant expédition — meubles, décoration et textile, sélectionnés pour leur finition.',
  },
  {
    num: '02',
    title: 'Devis chiffré sous 24 h',
    description:
      'Prix dégressifs dès 10 pièces et réponse chiffrée et personnalisée sous 24 h, y compris le week-end, pour les commandes des particuliers comme des professionnels.',
  },
  {
    num: '03',
    title: 'Accompagnement de bout en bout',
    description:
      'Un interlocuteur unique du devis à la livraison, une équipe basée à Dakar disponible du lundi au samedi, et une logistique répartie dans tout le Sénégal.',
  },
];

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

const C = {
  primary: tokens.colors.brand.main,
  dark: tokens.colors.surfaces.inverse,
  border: tokens.colors.border.light,
  muted: tokens.colors.text.secondary,
  laitonOnDark: tokens.colors.accent.onDark,
  laitonOnLight: tokens.colors.accent.onLight,
  ink: tokens.colors.surfaces.inverse,
  onInverse: tokens.colors.text.onInverse,
  onInverseMuted: tokens.colors.text.onInverseMuted,
} as const;

const sectionLabelSx = {
  fontSize: { xs: 12, sm: 13, md: 14, lg: 15 },
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: C.laitonOnLight,
  mb: { xs: 1, sm: 1.25, md: 1.5 },
};

export default function AboutPage() {
  const router = useRouter();
  const { categories, loading } = useCategories();

  const focusRing = {
    '&:focus-visible': {
      outline: `2px solid ${tokens.colors.status.focus}`,
      outlineOffset: '2px',
    },
  };

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default' }}>
      {/* ── En-tête asymétrique 7/5 ── */}
      <Box component="section" aria-labelledby="about-hero" sx={{ width: '100%' }}>
        <Container
          maxWidth="lg"
          sx={{
            px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 },
            py: 'clamp(3rem, 8vw, 6rem)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
              gap: { xs: 5, md: 8 },
              alignItems: 'center',
            }}
          >
            <Box>
              <Eyebrow>À propos</Eyebrow>
              <Typography
                id="about-hero"
                component="h1"
                sx={{
                  fontFamily: FONT_FRAUNCES,
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 600,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  mt: 2,
                  mb: 2.5,
                }}
              >
                Importer{' '}
                <Box component="span" sx={{ color: tokens.colors.accent.onLight }}>
                  le beau
                </Box>
                ,
                <br />
                pour habiter les intérieurs de Dakar.
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '65ch' }}>
                DameDéco Import & Commerce sélectionne des produits premium — meubles, décoration
                et textile — depuis la Chine, pour les particuliers et les professionnels au
                Sénégal.
              </Typography>
            </Box>

            <Box
              sx={{
                position: 'relative',
                aspectRatio: { xs: '16 / 10', sm: '4 / 3' },
                minHeight: { xs: 240, sm: 320 },
                borderRadius: 2,
                border: `1px solid ${tokens.colors.border.light}`,
                overflow: 'hidden',
              }}
            >
              <Image
                src="/banner.jpg"
                alt="Produits de décoration et mobilier importés par DameDéco à Dakar"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                style={{ objectFit: 'cover' }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Notre histoire ── */}
      <Box component="section" aria-labelledby="about-histoire" sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 }, py: 'clamp(3rem, 8vw, 6rem)' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1.15fr' },
              gap: { xs: 4, md: 8 },
            }}
          >
            <Box sx={{ alignSelf: { md: 'start' } }}>
              <Eyebrow>Notre histoire</Eyebrow>
              <Typography
                id="about-histoire"
                component="h2"
                sx={{
                  fontFamily: FONT_FRAUNCES,
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                  fontWeight: 600,
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                  mt: 2,
                }}
              >
                Une histoire de sélection, depuis 2010.
              </Typography>
            </Box>
            <Box>
              {HISTORY.map((paragraph) => (
                <Typography
                  key={paragraph.slice(0, 24)}
                  variant="body1"
                  sx={{ color: 'text.secondary', maxWidth: '65ch', lineHeight: 1.85, mb: 2.5 }}
                >
                  {paragraph}
                </Typography>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Ce qui nous distingue ── */}
      <Box component="section" aria-labelledby="about-valeurs" sx={{ width: '100%', bgcolor: tokens.colors.surfaces.alt }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 }, py: 'clamp(3rem, 8vw, 6rem)' }}>
          <Eyebrow>Ce qui nous distingue</Eyebrow>
          <Typography
            id="about-valeurs"
            component="h2"
            sx={{
              fontFamily: FONT_FRAUNCES,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: 'text.primary',
              mt: 2,
              mb: { xs: 4, md: 6 },
              maxWidth: '20ch',
            }}
          >
            Un importateur, trois exigences.
          </Typography>
          <Box sx={{ maxWidth: 860 }}>
            <EditorialList items={DISTINCTIONS} />
          </Box>
        </Container>
      </Box>

      {/* ── Nos catégories ── */}
      <Box component="section" aria-labelledby="about-categories" sx={{ width: '100%' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 }, py: 'clamp(3rem, 8vw, 6rem)' }}>
          <Eyebrow>Nos univers</Eyebrow>
          <Typography
            id="about-categories"
            component="h2"
            sx={{
              fontFamily: FONT_FRAUNCES,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              color: 'text.primary',
              mt: 2,
              mb: { xs: 4, md: 6 },
            }}
          >
            Nos catégories
          </Typography>

          {loading ? (
            <Typography sx={{ color: 'text.secondary' }}>Chargement…</Typography>
          ) : categories.length === 0 ? (
            <Box
              sx={{
                bgcolor: tokens.colors.surfaces.alt,
                border: `1px solid ${tokens.colors.border.light}`,
                borderRadius: 2,
                p: 4,
              }}
            >
              <Typography sx={{ fontFamily: FONT_FRAUNCES, fontSize: 20, fontWeight: 600, color: 'text.primary', mb: 1 }}>
                TODO : catégories indisponibles
              </Typography>
              <Typography sx={{ color: 'text.secondary', maxWidth: '65ch' }}>
                L’API ne renvoie pas de catégories actives pour le moment. La liste ci-dessous se
                remplira automatiquement dès qu’elles seront disponibles.
              </Typography>
            </Box>
          ) : (
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {categories.map((category, index) => (
                <Box
                  component="li"
                  key={category.id}
                  sx={{
                    borderTop: index === 0 ? 'none' : `1px solid ${tokens.colors.border.light}`,
                  }}
                >
                  <MuiLink
                    href={`/shop?category=${category.id}`}
                    underline="none"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 3,
                      py: 2.5,
                      minHeight: 56,
                      color: 'text.primary',
                      transition: 'color 200ms ease',
                      '&:hover, &:focus-visible': {
                        color: tokens.colors.brand.main,
                        '.arrow': { transform: 'translateX(4px)' },
                      },
                      ...focusRing,
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontFamily: FONT_FRAUNCES,
                        fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {category.name}
                    </Typography>
                    <ArrowOutward
                      className="arrow"
                      sx={{
                        fontSize: 22,
                        color: tokens.colors.accent.onLight,
                        flexShrink: 0,
                        transition: 'transform 200ms ease, color 200ms ease',
                      }}
                    />
                  </MuiLink>
                </Box>
              ))}
              <Box component="li" sx={{ borderTop: `1px solid ${tokens.colors.border.light}` }}>
                <MuiLink
                  href="/shop"
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 3,
                    py: 2.5,
                    minHeight: 56,
                    color: tokens.colors.brand.main,
                    transition: 'color 200ms ease',
                    '&:hover, &:focus-visible': {
                      color: tokens.colors.brand.hover,
                      '.arrow': { transform: 'translateX(4px)' },
                    },
                    ...focusRing,
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: FONT_FRAUNCES,
                      fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    Tout le catalogue
                  </Typography>
                  <ArrowOutward
                    className="arrow"
                    sx={{
                      fontSize: 22,
                      color: tokens.colors.brand.main,
                      flexShrink: 0,
                      transition: 'transform 200ms ease, color 200ms ease',
                    }}
                  />
                </MuiLink>
              </Box>
            </Box>
          )}
        </Container>
      </Box>

      {/* ── CTA grossiste — copie exacte du bloc « Achat en gros » de l'accueil ── */}
      <Box component="section" sx={{ pb: { xs: 6, md: 10 }, pt: { xs: 0, md: 2 }, width: '100%' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            component="article"
            aria-labelledby="about-cta"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: { xs: '16px', md: '20px' },
              bgcolor: C.primary,
              px: { xs: 3, sm: 4, md: 6 },
              py: { xs: 4, sm: 5, md: 6 },
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
              }}
            >
              {/* Contenu éditorial */}
              <Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                  <Box sx={{ width: 32, height: 2, borderRadius: 1, bgcolor: C.laitonOnDark }} />
                  <Typography sx={{ ...sectionLabelSx, mb: 0, color: C.laitonOnDark }}>Achat en gros</Typography>
                </Stack>
                <Typography
                  id="about-cta"
                  component="h2"
                  sx={{
                    fontFamily: FONT_POPPINS,
                    fontSize: { xs: '1.5rem', sm: '1.85rem', md: '2.15rem', lg: '2.5rem' },
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    color: C.onInverse,
                    mb: 2,
                  }}
                >
                  Un projet en{' '}
                  <Box component="span" sx={{ color: C.laitonOnDark }}>
                    volume&nbsp;?
                  </Box>
                </Typography>
                <Typography sx={{ fontSize: { xs: 16, md: 17.5 }, color: C.onInverseMuted, lineHeight: 1.75, maxWidth: 620, mb: { xs: 3, md: 4 } }}>
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
                  }}
                >
                  {CTA_BENEFITS.map((b) => {
                    const Icon = b.icon;
                    return (
                      <Box key={b.title}>
                        <Icon sx={{ fontSize: 24, color: C.laitonOnDark, mb: 1.25 }} />
                        <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.onInverse, mb: 0.5 }}>
                          {b.title}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: 13.5, md: 14 }, color: C.onInverseMuted, lineHeight: 1.6 }}>
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
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.laitonOnLight, mb: 0.75 }}>
                  Devis express
                </Typography>
                <Typography sx={{ fontSize: 19, fontWeight: 700, color: C.dark, lineHeight: 1.3, mb: 2.5 }}>
                  Recevez votre tarif sous 24&nbsp;h
                </Typography>

                {[
                  { label: 'Votre besoin', value: 'Meubles & décoration' },
                  { label: 'Quantité estimée', value: 'Dès 10 pièces' },
                  { label: 'Zone de livraison', value: 'Dakar & tout le Sénégal' },
                ].map((row) => (
                  <Box key={row.label} sx={{ py: 1.5, borderBottom: `1px dashed ${C.border}` }}>
                    <Typography sx={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, mb: 0.25 }}>
                      {row.label}
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: C.dark }}>{row.value}</Typography>
                  </Box>
                ))}

                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight />}
                  fullWidth
                  onClick={() => router.push('/contact')}
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
                  }}
                >
                  Demander un devis
                </Button>
                <Typography sx={{ mt: 1.5, textAlign: 'center', fontSize: 12.5, color: C.muted }}>
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