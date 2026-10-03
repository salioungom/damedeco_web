'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { PageHeader, Eyebrow } from '@/components/ui/PageHeader';
import ContactList from '@/components/ui/ContactList';
import ContactForm from '@/components/ui/ContactForm';
import { FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';

const CITY = 'Dakar, Sénégal';
const MAPS_HREF = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Dakar, Sénégal');

const MAP_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d61681.33063469812!2d-17.497849!3d14.7167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xec10d7f729c37d5%3A0x4c3f03b804b572d!2sDakar%2C%20Senegal!5e0!3m2!1sfr!2ssn!4v1234567890';

const FAQS = [
  {
    q: 'Quels sont vos délais de livraison ?',
    a: '2 à 5 jours ouvrables sur Dakar et sa banlieue, 5 à 10 jours pour les autres régions du Sénégal.',
  },
  {
    q: 'Proposez-vous des prix de gros ?',
    a: 'Oui. Les tarifs deviennent dégressifs dès 10 pièces commandées. Contactez le service commercial pour un devis personnalisé, chiffré sous 24 h.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Wave, Orange Money, virement bancaire et paiement à la livraison.',
  },
  {
    q: 'Livrez-vous en dehors de Dakar ?',
    a: 'Oui, dans tout le Sénégal. Hors de Dakar et de sa banlieue, comptez 5 à 10 jours de délai.',
  },
];

export default function ContactPage() {
  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default' }}>
      {/* ── En-tête ── */}
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Parlons de <Box component="span" sx={{ color: tokens.colors.accent.onLight }}>votre projet</Box>.
          </>
        }
        subtitle="Une question, une commande ou un besoin de devis : notre équipe vous répond, devis chiffré sous 24 h."
      />

      {/* ── Coordonnées + formulaire ── */}
      <Box component="section" aria-labelledby="contact-form" sx={{ width: '100%' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
              gap: { xs: 5, md: 8 },
              alignItems: 'start',
            }}
          >
            <ContactList />
            <ContactForm />
          </Box>
        </Container>
      </Box>

      {/* ── Carte / Où nous trouver ── */}
      <Box component="section" aria-labelledby="contact-map" sx={{ width: '100%', pt: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
              gap: { xs: 5, md: 8 },
              alignItems: 'stretch',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Eyebrow>Localisation</Eyebrow>
              <Box>
                <Typography
                  id="contact-map"
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
                  Nous trouver à Dakar
                </Typography>
              </Box>
              <Box
                sx={{
                  bgcolor: tokens.colors.surfaces.alt,
                  border: `1px solid ${tokens.colors.border.light}`,
                  borderRadius: 2,
                  p: { xs: 3, sm: 4 },
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}
                >
                  Adresse
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600, fontSize: 17, mb: 0.5 }}>
                  {CITY}
                </Typography>
                <Typography sx={{ color: 'text.secondary', maxWidth: '45ch', mb: 3 }}>
                  Shoppy en personne, ou écrivez-nous avant de passer : nous organiserons votre retrait.
                </Typography>
                <Button
                  variant="outlined"
                  href={MAPS_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ height: 48, width: 'fit-content' }}
                >
                  Ouvrir dans Google Maps
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                position: 'relative',
                border: `1px solid ${tokens.colors.border.light}`,
                borderRadius: 2,
                overflow: 'hidden',
                height: { xs: 320, md: 440 },
              }}
            >
              <iframe
                title="Carte — Dakar, Sénégal"
                src={MAP_EMBED_SRC}
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── FAQ ── */}
      <Box component="section" aria-labelledby="contact-faq" sx={{ width: '100%', bgcolor: 'background.paper', mt: { xs: 7, md: 9 }, py: 'clamp(3rem, 8vw, 6rem)' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 } }}>
          <Box sx={{ maxWidth: 760 }}>
            <Eyebrow>FAQ</Eyebrow>
            <Typography
              id="contact-faq"
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
              Questions fréquentes
            </Typography>

            {FAQS.map((faq) => (
              <Accordion
                key={faq.q}
                elevation={0}
                disableGutters
                sx={{
                  bgcolor: 'transparent',
                  borderBottom: `1px solid ${tokens.colors.border.light}`,
                  '&:before': { display: 'none' },
                  '&:first-of-type': { borderTop: `1px solid ${tokens.colors.border.light}` },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: tokens.colors.brand.main }} />}
                  sx={{
                    px: 0,
                    py: 1.5,
                    '& .MuiAccordionSummary-content': { m: 0 },
                  }}
                >
                  <Typography component="h3" sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', lineHeight: 1.5 }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pb: 2.5 }}>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.75, maxWidth: '65ch' }}>{faq.a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}