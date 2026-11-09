import Link from 'next/link';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import type { FooterLinkSx } from './footerStyles';

interface FooterLinkProps {
  href: string;
  children: ReactNode;
  sx?: FooterLinkSx;
  target?: string;
  rel?: string;
  'aria-label'?: string;
}

export function FooterLink({
  href,
  children,
  sx,
  target,
  rel,
  'aria-label': ariaLabel,
}: FooterLinkProps) {
  return (
    <Box sx={{ display: 'contents', '& > a': sx }}>
      <Link
        href={href}
        target={target}
        rel={rel}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    </Box>
  );
}
