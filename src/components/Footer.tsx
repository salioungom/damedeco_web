'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  IconButton,
  Stack,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  LocationOn as MapPin,
  Phone,
  Email as Mail,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { PaymentIcons } from './PaymentIcons';
import { BrandMark } from './ui/BrandMark';
import { useCategories } from '@/hooks/useCategories';
import { tokens } from '@/theme/tokens';
import { sweepHoverSx } from './ui/sweepHover';
import { CONTENT_CONTAINER_SX } from './Navigation';

/** Couleurs du footer — toutes issues des tokens (aucune valeur en dur) */
const INK = tokens.colors.surfaces.inverseFooter;
const WHITE = tokens.colors.white;
const LINK = tokens.colors.text.onFooter;
const MUTED = tokens.colors.text.onFooterMuted;
const GOLD = tokens.colors.accent.onFooter;
const RULE = tokens.colors.border.onFooter;
const SOCIAL_RULE = tokens.colors.border.onFooterSocial;

/** Anneau de focus clavier — doré, visible sur le fond navy */
const focusRingSx = {
  outline: `2px solid ${GOLD}`,
  outlineOffset: '3px',
};

/** Largeur de section mobile + marges latérales */
const SIDEMARGIN = 20;

/** Titre de rubrique mobile : 11px, majuscule, doré — s'applique en < 600px */
const mobileHeadingSx = {
  fontSize: 11,
  fontWeight: 700,
  color: GOLD,
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  mb: 16,
};

/** Sous-texte de lien : 15px, lineHeight 1.3, padding vertical 10px pour hit >= 44px */
const linkSx = {
  fontSize: 15,
  color: LINK,
  textDecorationLine: 'none',
  transition: 'color 0.15s ease, text-decoration-color 0.15s ease',
  display: 'block',
  padding: '10px 0',
  lineHeight: 1.3,
  minHeight: 44,
  '&:hover': {
    color: WHITE,
    textDecorationLine: 'underline',
    textDecorationColor: GOLD,
  },
  '&:focus-visible': {
    ...focusRingSx,
    borderRadius: 2,
  },
};

/** Lien du copyright : 12px, atténué, centre */
const copyrightSx = {
  fontSize: 12,
  color: MUTED,
  textAlign: 'center',
};

/** Pastille de paiement : hauteur 36px, gap 8px */
const paymentBadgeSx = {
  height: 36,
  minWidth: 36,
  flexShrink: 0,
};

/*───────────────────────────────────────────────────────────────────────────
  Footér — mobile first.
  - Desktop (lg+): layout d'origine préservé (grid 4 colonnes).
  - Mobile < 600px (xs): nouveau layout compact avec grille adaptée.
  - Sm (600-900px): conserve le layout 2 colonnes d'origine.
 ──────────────────────────────────────────────────────────────────────────*/

export function Footer() {
  const theme = useTheme();
  const mobileQuery = theme.breakpoints.down('sm'); // < 600 px (xs)
  const smQuery = theme.breakpoints.down('md'); // < 900 px (sm)
  const { categories } = useCategories();

  // Extraire le numéro WhatsApp depuis les env vars s'il existe
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <footer sx={{ bgcolor: INK, color: WHITE, width: '100%' }}>
      <Container maxWidth={false} disableGutters sx={{ position: 'relative', zIndex: 1 }}>
        {/* Grid de base: xs=1col, sm=2col, lg=4col (desktop préservé) */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '1.4fr 1fr 1fr 1.2fr' },
            gap: { xs: 3, sm: 4, md: 5 },
            py: { xs: 3.5, sm: 4.5, md: 6, lg: 7 },
            // Sur mobile < 600px, on remplace par le layout compact
            [mobileQuery]: {
              gap: 24,
              py: '28px',
              // On empêche le header desktop de se superposer
              mb: 0,
            },
          }}
        >
          {/* ── Marque + Coordonnées ── */}
          <Box
            sx={{
              // Desktop: comportement d'origine; Mobile: colonne unique empilée
              [mobileQuery]: {
                flexDirection: 'column',
                gap: 12,
                mb: 24,
              },
            }}
          >
            <Stack direction="row" spacing={{ xs: 1, sm: 1.25, md: 1.5 }} sx={{ alignItems: 'center', mb: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <BrandMark variant="inverse" />
              <Box>
                <Typography sx={{ fontSize: { xs: 17, sm: 19, md: 21.25 }, fontWeight: 800, color: WHITE, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  DameDéco
                </Typography>
                <Typography sx={{ fontSize: { xs: 11, sm: 11.5, md: 12.5 }, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', [mobileQuery]: { fontSize: '12px' } }}>
                  Import & Commerce
                </Typography>
              </Box>
            </Stack>

            <Typography sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: MUTED, lineHeight: { xs: 1.6, sm: 1.7, md: 1.75 }, mb: { xs: 2, sm: 2.5, md: 3 }, maxWidth: { xs: '100%', sm: 350 }, [mobileQuery]: { fontSize: '14px', lineHeight: 1.5, mb: '16px' } }}>
              Importation de produits premium depuis la Chine. Votre partenaire de confiance à Dakar depuis 2010.
            </Typography>
          </Box>

          {/* Coordonnées : texte + liens tel/mailto (uniquement en mobile) */}
          {/** N'afficher les coordonnées lien que sur mobile < 600px */}
          {mobileQuery && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 12, mb: 24 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Typography sx={{ fontSize: 12, color: MUTED }}>Dakar, Sénégal</Typography>
                <Box component="div" sx={{ my: 4 }}>
                  <MuiLink component={Link} href={`tel:+221771333658}`} sx={linkSx}>
                    +221 77 133 36 58
                  </MuiLink>
                  <MuiLink component={Link} href={`mailto:damedeco1@gmail.com`} sx={linkSx}>
                    damedeco1@gmail.com
                  </MuiLink>
                </Box>
                {/* WhatsApp : uniquement si la variable d'existence est définie */}
                {whatsappNumber && (
                  <MuiLink component={Link} href={`wa.me/${whatsappNumber}`} sx={linkSx}>
                    {whatsappNumber}
                  </MuiLink>
                )}
              </Box>
            </Box>
          )}

          {/* ── Navigation ───────────────────────────────────────────────────── */}
          {/* Desktop: dans la grille 4 colonnes d'origine.
             Mobile < 600px: 2 colonnes côte à côte. */}
          <Box
            component="nav"
            aria-label="Navigation du pied de page"
            sx={{
              // En mobile < 600px: 2 colonnes avec gap 24px
              [mobileQuery]: {
                gridColumn: 'span 2',
                marginBottom: 24,
              },
            }}
          >
            <Typography sx={{ ...mobileHeadingSx }}>Navigation</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24, mb: 24 }}>
              <Stack direction="column" spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
                {[
                  { label: 'Accueil', href: '/' },
                  { label: 'Boutique', href: '/shop' },
                  { label: 'À propos', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                ].map((link) => (
                  <MuiLink key={link.label} component={Link} href={link.href} sx={linkSx}>
                    {link.label}
                  </MuiLink>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* ── Mon compte ───────────────────────────────────────────────────── */}
          {/* Mobile < 600px: côte à côte avec Navigation (déjà dans la même grille 2 colonnes).
             Desktop: dans la grille 4 colonnes d'origine. */}
          <Box
            component="nav"
            aria-label="Mon compte du pied de page"
            sx={{
              [mobileQuery]: {
                gridColumn: 'span 2',
                marginBottom: 24,
              },
            }}
          >
            <Typography sx={{ ...mobileHeadingSx }}>Mon compte</Typography>
            <Stack direction="column" spacing={{ xs: 1, sm: 1.25, md: 1.5 }} sx={{ mb: 2.5 }}>
              {[
                { label: 'Connexion', href: '/login' },
                { label: 'Mes commandes', href: '/account/orders' },
                { label: 'Mes favoris', href: '/favorites' },
              ].map((link) => (
                <MuiLink key={link.label} component={Link} href={link.href} sx={linkSx}>
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Box>

          {/* ── Catégories ───────────────────────────────────────────────────── */}
          {/* Si la liste est vide ou en erreur, NE REND PAS la rubrique (ni titre ni espace) */}
          {categories && categories.length > 0 && (
            <Box
              component="nav"
              aria-label="Catégories du pied de page"
              sx={{
                // Mobile < 600px: pleine largeur, liens en 2 colonnes
                [mobileQuery]: {
                  gridColumn: 'span 1',
                  mb: 24,
                },
              }}
            >
              <Typography sx={{ ...mobileHeadingSx }}>Catégories</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
                {(Array.isArray(categories) ? categories : []).map((cat) => (
                  <MuiLink
                    key={cat.id}
                    component={Link}
                    href={`/shop?category=${cat.id}`}
                    sx={linkSx}
                  >
                    {cat.name}
                  </MuiLink>
                ))}
              </Box>
            </Box>
          )}

          {/* ── Moyens de paiement ───────────────────────────────────────────── */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <Typography sx={{ ...mobileHeadingSx, order: 1 }}>Paiement accepté</Typography>
            <PaymentIcons size="sm" sx={{ order: 2, flexWrap: 'wrap', height: 36, minWidth: 36 }} />
          </Box>
        </Box>

        {/* Barre du bas — filet + copyright -->
        Uniquement en dessous de la grid (tousécrans). */}
        <Box sx={{ borderTop: `1px solid ${RULE}`, py: 16, marginTop: 32 }}>
          <Typography sx={copyrightSx}>
            © {new Date().getFullYear()} DameDéco. Tous droits réservés.
          </Typography>
          {/* Liens légaux s'ils existent déjà dans le projet (mentions légales, CGV) */}
          <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} sx={{ justifyContent: 'center' }}>
            {['mentions-legales', 'cgv'].map((path) => {
              const labels = { mentionsLegales: 'Mentions légales', cgv: 'CGV' };
              const href = `/${path}`;
              return (
                <MuiLink
                  key={path}
                  component={Link}
                  href={href}
                  sx={{ ...linkSx, margin: '0 16px' }}
                >
                  {labels[path]}
                </MuiLink>
              );
            })}
          </Stack>
        </Box>
      </Container>
    </footer>
  );
}