import { Box, Typography } from '@mui/material';
import { FooterLink } from './FooterLink';
import { BackToTop } from './BackToTop';
import { LEGAL_LINKS } from './footerData';
import {
  bottomBarSx,
  backToTopDesktopSx,
  backToTopMobileSx,
  copyrightSx,
  legalLinkSx,
  legalLinksSx,
} from './footerStyles';

export function FooterBottomBar() {
  const currentYear = new Date().getFullYear();

  return (
    <Box sx={bottomBarSx}>
      <Typography component="p" sx={copyrightSx}>
        © {currentYear} DameDéco. Tous droits réservés.
      </Typography>
      <Box component="nav" aria-label="Informations légales" sx={legalLinksSx}>
        {LEGAL_LINKS.map((link) => (
          <FooterLink key={link.href} href={link.href} sx={legalLinkSx}>
            {link.label}
          </FooterLink>
        ))}
      </Box>
      <Box sx={backToTopMobileSx}>
        <BackToTop compact />
      </Box>
      <Box sx={backToTopDesktopSx}>
        <BackToTop />
      </Box>
    </Box>
  );
}
