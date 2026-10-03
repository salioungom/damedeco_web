'use client';

import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import {
  LocationOn as MapPin,
  Phone,
  Email as Mail,
  Facebook,
  Instagram,
  Twitter,
  WhatsApp,
} from '@mui/icons-material';
import { PaymentIcons } from './PaymentIcons';
import { BrandMark } from './ui/BrandMark';
import { useCategories } from '@/hooks/useCategories';
import { tokens } from '@/theme/tokens';

/** Couleurs du footer — toutes issues des tokens (aucune valeur en dur) */
const INK = tokens.colors.surfaces.inverseFooter;
const ON_INVERSE = tokens.colors.text.onInverse;
const ON_INVERSE_MUTED = tokens.colors.text.onInverseMuted;
const ON_ACCENT = tokens.colors.accent.onDark;
const ON_DARK_BORDER = tokens.colors.border.onDark;

const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Boutique', href: '/shop' },
  { label: 'À propos', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const ACCOUNT_LINKS = [
  { label: 'Connexion', href: '/login' },
  { label: 'Mes commandes', href: '/account/orders' },
  { label: 'Mes favoris', href: '/favorites' },
];

const SOCIALS = [
  { Icon: Facebook, label: 'Facebook', href: '#' },
  { Icon: Instagram, label: 'Instagram', href: '#' },
  { Icon: Twitter, label: 'Twitter', href: '#' },
  { Icon: WhatsApp, label: 'WhatsApp', href: '#' },
];

const LEGAL_LINKS = [
  { label: 'Mentions légales', href: '#' },
  { label: 'CGV', href: '#' },
  { label: 'Confidentialité', href: '#' },
];

const linkSx = {
  fontSize: { xs: 14.5, sm: 16, md: 17.5 },
  color: ON_INVERSE_MUTED,
  textDecorationLine: 'none',
  transition: 'color 0.15s ease, text-decoration-color 0.15s ease',
  display: 'block',
  width: 'fit-content',
  textUnderlineOffset: '3px',
  '&:hover': {
    color: ON_INVERSE,
    textDecorationLine: 'underline',
    textDecorationColor: ON_ACCENT,
  },
};

const headingSx = {
  fontSize: { xs: 11.5, sm: 12.5, md: 13.75 },
  fontWeight: 700,
  color: ON_ACCENT,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  mb: { xs: 1.5, sm: 2, md: 2.5 },
};

export function Footer() {
  const { categories } = useCategories();
  return (
    <Box
      component="footer"
      sx={{ mt: 'auto', bgcolor: INK, color: ON_INVERSE, position: 'relative', overflow: 'hidden' }}
    >
      {/* Filet supérieur — accent laiton fin */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          bgcolor: ON_ACCENT,
          opacity: 0.55,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '1.4fr 1fr 1fr 1.2fr' },
            gap: { xs: 3, sm: 4, md: 5 },
            py: { xs: 3.5, sm: 4.5, md: 6, lg: 7 },
          }}
        >
          {/* Marque */}
          <Box>
            <Stack direction="row" spacing={{ xs: 1, sm: 1.25, md: 1.5 }} sx={{ alignItems: 'center', mb: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <BrandMark />
              <Box>
                <Typography sx={{ fontSize: { xs: 17, sm: 19, md: 21.25 }, fontWeight: 800, color: ON_INVERSE, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  DameDéco
                </Typography>
                <Typography sx={{ fontSize: { xs: 11, sm: 11.5, md: 12.5 }, color: ON_ACCENT, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  Import & Commerce
                </Typography>
              </Box>
            </Stack>

            <Typography sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: ON_INVERSE_MUTED, lineHeight: { xs: 1.6, sm: 1.7, md: 1.75 }, mb: { xs: 2, sm: 2.5, md: 3 }, maxWidth: { xs: '100%', sm: 350 } }}>
              Importation de produits premium depuis la Chine. Votre partenaire de confiance à Dakar depuis 2010.
            </Typography>

            <Stack spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
              {[
                { icon: <MapPin sx={{ fontSize: { xs: 18, sm: 19.5, md: 21.25 } }} />, value: 'Dakar, Sénégal' },
                { icon: <Phone sx={{ fontSize: { xs: 18, sm: 19.5, md: 21.25 } }} />, value: '+221 77 133 36 58' },
                { icon: <Mail sx={{ fontSize: { xs: 18, sm: 19.5, md: 21.25 } }} />, value: 'damedeco1@gmail.com' },
              ].map((item) => (
                <Stack key={item.value} direction="row" spacing={{ xs: 1, sm: 1.15, md: 1.25 }} sx={{ alignItems: 'center' }}>
                  <Box sx={{ color: ON_ACCENT, display: 'flex', flexShrink: 0 }}>{item.icon}</Box>
                  <Typography sx={{ fontSize: { xs: 14, sm: 15, md: 16.25 }, color: ON_INVERSE_MUTED }}>{item.value}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Navigation */}
          <Box>
            <Typography sx={headingSx}>Navigation</Typography>
            <Stack spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
              {NAV_LINKS.map((link) => (
                <MuiLink key={link.label} component={Link} href={link.href} sx={linkSx}>
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Box>

          {/* Catégories */}
          <Box>
            <Typography sx={headingSx}>Catégories</Typography>
            <Stack spacing={{ xs: 1, sm: 1.25, md: 1.5 }}>
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
            </Stack>
          </Box>

          {/* Compte + paiement */}
          <Box>
            <Typography sx={headingSx}>Mon compte</Typography>
            <Stack spacing={{ xs: 1, sm: 1.25, md: 1.5 }} sx={{ mb: { xs: 2.5, sm: 3, md: 4 } }}>
              {ACCOUNT_LINKS.map((link) => (
                <MuiLink key={link.label} component={Link} href={link.href} sx={linkSx}>
                  {link.label}
                </MuiLink>
              ))}
            </Stack>

            <Typography sx={{ ...headingSx, mb: { xs: 1.5, sm: 1.75, md: 2 } }}>Paiement accepté</Typography>
            <PaymentIcons size="sm" />
          </Box>
        </Box>

        <Divider sx={{ borderColor: ON_DARK_BORDER }} />

        <Box
          sx={{
            py: { xs: 2, sm: 2.5, md: 3, lg: 4 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
            alignItems: 'center',
            gap: { xs: 2, sm: 2.25, md: 2 },
          }}
        >
          <Typography sx={{ fontSize: { xs: 13, sm: 14, md: 15 }, color: ON_INVERSE_MUTED, textAlign: { xs: 'center', md: 'left' } }}>
              © {new Date().getFullYear()} DameDéco · Tous droits réservés · Dakar, Sénégal
          </Typography>

          <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} sx={{ justifyContent: 'center' }}>
            {SOCIALS.map(({ Icon, label, href }) => (
              <IconButton
                key={label}
                component="a"
                href={href}
                aria-label={label}
                size="small"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: `1px solid ${ON_DARK_BORDER}`,
                  color: ON_INVERSE_MUTED,
                  transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                  '&:hover': {
                    color: ON_INVERSE,
                    bgcolor: 'primary.main',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Icon sx={{ fontSize: { xs: 18, sm: 20, md: 22.5 } }} />
              </IconButton>
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
            sx={{ justifyContent: { xs: 'center', md: 'flex-end' }, flexWrap: 'wrap' }}
          >
            {LEGAL_LINKS.map((l) => (
              <MuiLink key={l.label} component={Link} href={l.href} sx={{ ...linkSx, fontSize: { xs: 13, sm: 14, md: 15 } }}>
                {l.label}
              </MuiLink>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}