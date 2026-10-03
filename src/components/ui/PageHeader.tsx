'use client';

import { Box, Container, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';

interface EyebrowProps {
  children: ReactNode;
  barColor?: string;
  labelColor?: string;
}

export function Eyebrow({ children, barColor, labelColor }: EyebrowProps) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1.5,
        width: 'fit-content',
      }}
    >
      <Box sx={{ width: 32, height: 2, bgcolor: barColor ?? tokens.colors.accent.main, borderRadius: 1 }} />
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: labelColor ?? tokens.colors.accent.onLight,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  id?: string;
}

export function PageHeader({ eyebrow, title, subtitle, id = 'page-title' }: PageHeaderProps) {
  return (
    <Box component="section" aria-labelledby={id} sx={{ bgcolor: 'background.default', width: '100%' }}>
      <Container
        maxWidth="lg"
        sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 }, py: 'clamp(3rem, 8vw, 6rem)' }}
      >
        <Box sx={{ maxWidth: 760 }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Typography
            id={id}
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
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '65ch' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
}

export default PageHeader;