import { Box, Typography } from '@mui/material';
import {
  LocationOnOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@mui/icons-material';
import { FooterLink } from './FooterLink';
import { SITE } from './footerData';
import {
  contactIconSx,
  contactItemSx,
  contactAddressSx,
  contactLinkSx,
  contactListSx,
  contactTextSx,
  sectionHeadingSx,
} from './footerStyles';

export function FooterContact() {
  return (
    <Box>
      <Typography component="h2" sx={sectionHeadingSx}>
        Contact
      </Typography>
      <Box component="address" sx={contactAddressSx}>
        <Box component="ul" sx={contactListSx}>
          <Box component="li" sx={contactItemSx}>
            <LocationOnOutlined sx={contactIconSx} aria-hidden="true" />
            <Typography component="span" sx={contactTextSx}>
              {SITE.address}
            </Typography>
          </Box>
          <Box component="li" sx={contactItemSx}>
            <PhoneOutlined sx={contactIconSx} aria-hidden="true" />
            <FooterLink href={`tel:${SITE.phoneTel}`} sx={contactLinkSx}>
              {SITE.phone}
            </FooterLink>
          </Box>
          <Box component="li" sx={contactItemSx}>
            <MailOutlined sx={contactIconSx} aria-hidden="true" />
            <FooterLink href={`mailto:${SITE.email}`} sx={contactLinkSx}>
              {SITE.email}
            </FooterLink>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
