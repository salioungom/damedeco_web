'use client';

import { Typography } from '@mui/material';
import type { SystemStyleObject, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface SectionLabelProps {
  children: ReactNode;
  onDark?: boolean;
  sx?: SystemStyleObject<Theme>;
}

export function SectionLabel({ children, onDark = false, sx }: SectionLabelProps) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: 'block',
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: onDark ? 'secondary.light' : 'secondary.main',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}
