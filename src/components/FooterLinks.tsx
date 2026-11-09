import { Box, Typography } from '@mui/material';
import { FooterLink } from './FooterLink';
import { sectionHeadingSx, linkListSx, linkItemSx } from './footerStyles';
import type { FooterLink as FooterLinkType } from './footerData';

interface FooterLinksProps {
  title: string;
  links: readonly FooterLinkType[];
}

export function FooterLinks({ title, links }: FooterLinksProps) {
  return (
    <Box component="nav" aria-label={title}>
      <Typography component="h2" sx={sectionHeadingSx}>
        {title}
      </Typography>
      <Box component="ul" sx={linkListSx}>
        {links.map((link) => (
          <Box component="li" key={link.href}>
            <FooterLink href={link.href} sx={linkItemSx}>
              {link.label}
            </FooterLink>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
