'use client';

import { Box, Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';

const PHONE = '+221 77 133 36 58';
const PHONE_HREF = 'tel:+221771333658';
const EMAIL = 'damedeco1@gmail.com';
const EMAIL_HREF = 'mailto:damedeco1@gmail.com';
const CITY = 'Dakar, Sénégal';
const MAPS_HREF = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Dakar, Sénégal');

interface RowHit {
  label: string;
  value: string;
  href?: string;
  muted?: boolean;
}

const ROWS: RowHit[] = [
  {
    label: 'Téléphone',
    value: PHONE,
    href: PHONE_HREF,
  },
  {
    label: 'E-mail',
    value: EMAIL,
    href: EMAIL_HREF,
  },
  {
    label: 'Adresse',
    value: CITY,
    href: MAPS_HREF,
  },
  {
    label: 'Horaires',
    value: 'Lun – Sam · 9h–18h',
  },
];

export function ContactList() {
  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Box
        sx={{ display: { xs: 'grid', md: 'none' }, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}
      >
        <Button
          variant="contained"
          href={PHONE_HREF}
          size="large"
          sx={{ height: 48 }}
        >
          Appeler
        </Button>
        <Button
          variant="outlined"
          href={EMAIL_HREF}
          size="large"
          sx={{ height: 48 }}
        >
          Écrire un e-mail
        </Button>
      </Box>

      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {ROWS.map((row, index) => (
          <Box
            component="li"
            key={row.label}
            sx={{
              minHeight: 44,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' },
              gap: { xs: 0.75, sm: 3 },
              alignItems: { xs: 'flex-start', sm: 'center' },
              py: 2,
              borderTop: index === 0 ? 'none' : `1px solid ${tokens.colors.border.light}`,
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'text.secondary',
              }}
            >
              {row.label}
            </Typography>
            {row.href ? (
              <MuiLink
                href={row.href}
                sx={{
                  fontSize: 17,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: 'text.primary',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'primary.main',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                  },
                }}
              >
                {row.value}
              </MuiLink>
            ) : (
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: row.muted ? 400 : 600,
                  lineHeight: 1.5,
                  color: row.muted ? tokens.colors.brand.soft : 'text.primary',
                  fontStyle: row.muted ? 'italic' : 'none',
                }}
              >
                {row.value}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

export default ContactList;