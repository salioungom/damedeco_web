import { Box, Container } from '@mui/material';
import { getCategories } from '@/hooks/useCategories';
import { CONTENT_CONTAINER_SX } from './Navigation';
import { FooterBrand } from './FooterBrand';
import { FooterBottomBar } from './FooterBottomBar';
import { FooterContact } from './FooterContact';
import { FooterLinks } from './FooterLinks';
import { FooterPayments } from './FooterPayments';
import { FooterSocials } from './FooterSocials';
import {
  ACCOUNT_LINKS,
  MAX_CATEGORIES,
  NAV_LINKS,
  SITE,
} from './footerData';
import {
  accountCellSx,
  brandCellSx,
  categoryCellSx,
  contactCellSx,
  footerGridSx,
  footerRootSx,
  navigationCellSx,
  socialCellSx,
} from './footerStyles';

const whatsappNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') || SITE.phoneTel;

export async function Footer() {
  const { categories, error } = await getCategories();

  if (error) {
    console.warn(
      'Catégories du footer indisponibles :',
      error.message || 'échec de la récupération des catégories.',
    );
  }

  const categoryLinks = categories.slice(0, MAX_CATEGORIES).map((category) => ({
    label: category.name,
    href: `/shop?category=${category.id}`,
  }));
  const hasMoreCategories = categories.length > MAX_CATEGORIES;
  const allCategoryLinks = hasMoreCategories
    ? [...categoryLinks, { label: 'Voir tout', href: '/shop' }]
    : categoryLinks;

  return (
    <footer>
      <Box sx={footerRootSx}>
        <Container maxWidth={false} disableGutters sx={CONTENT_CONTAINER_SX}>
          <Box sx={footerGridSx}>
            <Box sx={brandCellSx}>
              <FooterBrand />
            </Box>
            <Box sx={contactCellSx}>
              <FooterContact />
            </Box>
            <Box sx={navigationCellSx}>
              <FooterLinks title="Navigation" links={NAV_LINKS} />
            </Box>
            <Box sx={accountCellSx}>
              <FooterLinks title="Mon compte" links={ACCOUNT_LINKS} />
            </Box>
            <Box sx={socialCellSx}>
              <Box
                sx={{
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <FooterSocials whatsappNumber={whatsappNumber} />
                <FooterPayments />
              </Box>
            </Box>
            {allCategoryLinks.length > 0 && (
              <Box sx={categoryCellSx}>
                <FooterLinks title="Catégories" links={allCategoryLinks} />
              </Box>
            )}
          </Box>
          <FooterBottomBar />
        </Container>
      </Box>
    </footer>
  );
}

export default Footer;
