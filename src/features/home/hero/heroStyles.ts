import type { SxProps, Theme } from '@mui/material/styles';
import { BRAND_BLUE, FONT_FRAUNCES } from '@/theme';
import { tokens } from '@/theme/tokens';
import { sweepHoverSx } from '@/components/ui/sweepHover';

const heroColors = {
  background: tokens.colors.surfaces.default,
  title: '#1B2433',
  text: '#2A3344',
  proofIcon: '#8A6A2E',
  divider: '#E0D8C9',
  light: tokens.colors.brand.soft,
};

export const heroSectionSx: SxProps<Theme> = (theme) => ({
  bgcolor: heroColors.background,
  minHeight: { xs: 'auto', sm: 'calc(100svh - 68px)', md: 'calc(100svh - 74px)' },
  [theme.breakpoints.up('lg')]: {
    overflowX: 'clip',
  },
});

export const heroContainerSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: '1600px',
  mx: 'auto',
  px: { xs: 2.5, sm: 3.2, md: 4.8, lg: 4.8, xl: 6.4 },
  pt: 6,
  pb: 6,
  minHeight: { xs: 'auto', sm: 'calc(100svh - 68px)', md: 'calc(100svh - 74px)' },
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

export const heroGridSx: SxProps<Theme> = {
  alignItems: { xs: 'stretch', lg: 'center' },
  flex: 1,
  width: '100%',
};

export const heroTextGridSx: SxProps<Theme> = {
  order: { xs: 1, lg: 1 },
  alignSelf: 'center',
};

export const heroContentSx: SxProps<Theme> = {
  maxWidth: { xs: '100%', sm: 600, md: 725 },
};

export const heroTitleSx: SxProps<Theme> = {
  fontFamily: FONT_FRAUNCES,
  fontWeight: 500,
  fontSize: 'clamp(2.5rem, 4vw, 4.5rem)',
  lineHeight: 1.08,
  letterSpacing: '-0.01em',
  color: heroColors.title,
  maxWidth: '16ch',
  mb: 2.5,
  textWrap: 'balance',
};

export const heroSubtitleSx: SxProps<Theme> = {
  fontSize: '16px',
  color: heroColors.text,
  lineHeight: 1.6,
  mb: 4,
  maxWidth: { xs: '100%', sm: 520, md: 580 },
};

export const heroButtonsSx: SxProps<Theme> = {
  mb: 2.5,
  flexWrap: { xs: 'wrap', sm: 'nowrap' },
};

export const heroPrimaryButtonSx: SxProps<Theme> = (theme) => ({
  width: { xs: '100%', sm: 'auto' },
  bgcolor: BRAND_BLUE,
  borderColor: BRAND_BLUE,
  color: theme.palette.common.white,
});

export const heroSecondaryButtonSx: SxProps<Theme> = {
  width: { xs: '100%', sm: 'auto' },
};

export const heroProofsSx: SxProps<Theme> = {
  display: { xs: 'grid', lg: 'flex' },
  gridTemplateColumns: { xs: '20px 1fr' },
  columnGap: { xs: '10px', lg: '8px' },
  rowGap: { xs: '12px', lg: '8px' },
  alignItems: 'center',
  borderTop: '1px solid ' + heroColors.divider,
  paddingTop: { xs: '16px', lg: '20px' },
};

export const heroProofItemSx: SxProps<Theme> = {
  display: { xs: 'contents', lg: 'flex' },
  alignItems: 'center',
  gap: { lg: '8px' },
};

export const heroProofIconSx: SxProps<Theme> = {
  fontSize: { xs: '18px', lg: '16px' },
  color: heroColors.proofIcon,
  flexShrink: 0,
};

export const heroProofTextSx: SxProps<Theme> = {
  fontSize: '14px',
  color: heroColors.text,
  fontWeight: 500,
  lineHeight: 1.4,
  whiteSpace: { xs: 'normal', lg: 'nowrap' },
};

export const heroImageGridSx: SxProps<Theme> = {
  order: { xs: 2, lg: 2 },
  alignSelf: 'stretch',
  position: 'relative',
  minHeight: {
    xs: 'auto',
    sm: 'auto',
    md: 440,
    lg: 'clamp(520px, 44vw, 700px)',
  },
};

export const heroImageColumnSx: SxProps<Theme> = {
  width: '100%',
};

export const heroImageContainerSx: SxProps<Theme> = {
  position: 'relative',
  height: {
    xs: 'auto',
    sm: 'auto',
    md: 440,
    lg: 'clamp(520px, 44vw, 700px)',
  },
  minHeight: {
    xs: 'auto',
    sm: 'auto',
    md: 440,
    lg: 'clamp(520px, 44vw, 700px)',
  },
  mt: { xs: 3, lg: 0 },
};

export const heroImageFrameSx: SxProps<Theme> = {
  position: { xs: 'relative', lg: 'absolute' },
  top: { lg: 0 },
  bottom: { lg: 0 },
  left: { lg: 0 },
  right: { lg: 'calc(85.7142857% - 50vw)' },
  width: { xs: '100%', lg: 'auto' },
  height: { xs: 'auto', sm: 'auto', md: 440, lg: 'auto' },
  aspectRatio: { xs: '4 / 3', sm: '4 / 3', md: 'auto', lg: 'auto' },
  mr: { xs: 0, sm: '-32px', md: '-32px', lg: 0 },
  overflow: 'hidden',
  borderRadius: { xs: '0 0 0 40px', lg: '0 0 0 120px' },
  bgcolor: heroColors.light,
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: { xs: 'center 30%', lg: 'center 20%' },
  },
};

export const heroImageOverlaySx: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0))',
  pointerEvents: 'none',
};

export const heroDeliveryBadgeSx: SxProps<Theme> = (theme) => ({
  position: 'absolute',
  top: { xs: 'auto', md: 'auto', lg: 24 },
  bottom: { xs: 12, lg: 'auto' },
  right: { xs: 12, lg: 24 },
  bgcolor: BRAND_BLUE,
  color: 'common.white',
  borderRadius: '14px',
  padding: { xs: '8px 10px', lg: '10px 16px' },
  border: '1px solid ' + BRAND_BLUE,
  boxShadow: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: { xs: '8px', lg: '10px' },
  zIndex: 2,
  width: 'fit-content',
  maxWidth: '200px',
  [theme.breakpoints.up('lg')]: {
    position: 'absolute',
    top: 24,
    right: 24,
    bottom: 'auto',
    left: 'auto',
    transform: 'none',
    zIndex: 3,
    borderRadius: '10px',
  },
});

export const heroDeliveryIconSx: SxProps<Theme> = {
  fontSize: { xs: '18px', lg: '20px' },
  color: 'common.white',
  flexShrink: 0,
};

export const heroDeliveryLabelSx: SxProps<Theme> = (theme) => ({
  display: { xs: 'none', md: 'block' },
  fontSize: '12px',
  color: theme.palette.common.white,
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
});

export const heroDeliveryLocationSx: SxProps<Theme> = (theme) => ({
  fontSize: { xs: '13px', lg: '15px' },
  fontWeight: 600,
  color: theme.palette.common.white,
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
});

export const heroSelectionCardSx: SxProps<Theme> = (theme) => ({
  position: { xs: 'relative', sm: 'relative', md: 'absolute' },
  bottom: { md: 16, lg: 24 },
  left: 'auto',
  right: {
    md: 16,
    lg: 'calc(-24px - max(0px, (100vw - 1600px) / 2))',
    xl: 'calc(-40px - max(0px, (100vw - 1600px) / 2))',
  },
  mt: { xs: 2, sm: 2, md: 0 },
  width: { xs: '100%', md: 360, lg: 420 },
  maxWidth: { xs: '100%', md: 360, lg: 420 },
  bgcolor: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: { xs: '12px 14px', sm: '14px 18px' },
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
  display: 'flex',
  alignItems: 'center',
  gap: { xs: 1.25, sm: 1.75 },
  textDecoration: 'none',
  zIndex: 2,
  transition: 'transform 0.3s ease',
  '@keyframes heroSelectionFloat': {
    '0%, 100%': { translate: '0 0' },
    '50%': { translate: '0 -6px' },
  },
  animation: 'heroSelectionFloat 3.2s ease-in-out infinite',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
  '@media (hover: hover)': {
    '&:hover': {
      transform: 'translateY(-2px)',
      '& .arrow-icon': {
        transform: 'translateX(4px)',
      },
    },
  },
  '@supports not (backdrop-filter: blur(10px))': {
    bgcolor: theme.palette.background.paper,
  },
  '&:focus-visible': {
    outline: '2px solid ' + theme.palette.primary.main,
    outlineOffset: '2px',
  },
});

export const heroSelectionThumbnailSx: SxProps<Theme> = (theme) => ({
  width: { xs: 64, sm: 76 },
  height: { xs: 64, sm: 76 },
  borderRadius: '12px',
  bgcolor: theme.palette.primary.main + '1A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  overflow: 'hidden',
});

export const heroSelectionImageSx: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
  display: 'block',
};

export const heroSelectionPlaceholderSx: SxProps<Theme> = (theme) => ({
  fontSize: 28,
  color: theme.palette.primary.main,
});

export const heroSelectionContentSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
};

export const heroSelectionEyebrowSx: SxProps<Theme> = (theme) => ({
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: theme.palette.golden.main,
  mb: 0.5,
});

export const heroSelectionProductNameSx: SxProps<Theme> = (theme) => ({
  fontSize: { xs: '15px', sm: '16px' },
  fontWeight: 600,
  color: theme.palette.text.primary,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const heroSelectionPriceRowSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'baseline',
  flexWrap: 'wrap',
  columnGap: 1,
  rowGap: 0.25,
  mt: 0.25,
};

export const heroSelectionPriceSx: SxProps<Theme> = (theme) => ({
  fontSize: { xs: '14px', sm: '15px' },
  fontWeight: 700,
  color: theme.palette.primary.main,
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
});

export const heroSelectionOriginalPriceSx: SxProps<Theme> = (theme) => ({
  fontSize: { xs: '12px', sm: '13px' },
  color: theme.palette.text.disabled,
  textDecoration: 'line-through',
  fontWeight: 500,
  whiteSpace: 'nowrap',
});

export const heroSelectionDiscountChipSx: SxProps<Theme> = {
  height: 20,
  fontSize: '11px',
  fontWeight: 700,
  '& .MuiChip-label': { px: 0.75 },
};

export const heroSelectionSavingsSx: SxProps<Theme> = {
  fontSize: { xs: '12px', sm: '12.5px' },
  fontWeight: 600,
  color: tokens.colors.status.success,
  lineHeight: 1.3,
  mt: 0.25,
};

export const heroSelectionFallbackTitleSx: SxProps<Theme> = (theme) => ({
  fontSize: '17px',
  fontWeight: 600,
  color: theme.palette.text.primary,
  lineHeight: 1.3,
});

export const heroSelectionFallbackTextSx: SxProps<Theme> = (theme) => ({
  fontSize: '14px',
  color: theme.palette.text.secondary,
});

export const heroSelectionArrowSx: SxProps<Theme> = (theme) => ({
  fontSize: 20,
  color: theme.palette.primary.main,
  flexShrink: 0,
  transition: 'transform 0.3s ease',
});

export const heroCategoriesGridSx: SxProps<Theme> = {
  order: { xs: 3, lg: 3 },
  ml: { xs: -2.5, lg: 0 },
  width: { xs: 'calc(100% + 40px)', lg: 'auto' },
};

export const heroCategoriesNavSx: SxProps<Theme> = {
  mt: { xs: 2, lg: '20px' },
  display: 'flex',
  gap: { xs: 1.5, lg: '10px' },
  alignItems: 'center',
  flexWrap: { xs: 'nowrap', lg: 'wrap' },
  overflowX: { xs: 'auto', lg: 'visible' },
  scrollSnapType: { xs: 'x mandatory', lg: 'none' },
  pl: { xs: '20px', lg: '24px' },
  pr: { xs: '20px', lg: 0 },
  '::-webkit-scrollbar': {
    display: 'none',
  },
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
};

export const heroCategoryChipSx = (index: number): SxProps<Theme> => (theme) => ({
  height: '36px',
  borderRadius: '999px',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid ' + theme.palette.divider,
  bgcolor: 'transparent',
  color: theme.palette.text.primary,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  scrollSnapAlign: 'start',
  position: 'relative',
  flexShrink: 0,
  display: { xs: 'inline-flex', lg: index < 8 ? 'inline-flex' : 'none' },
  ...sweepHoverSx({
    fill: theme.palette.primary.main,
    hoverColor: 'white',
    hoverBorderColor: theme.palette.primary.main,
  }),
  '&.Mui-focusVisible': {
    outline: '2px solid ' + theme.palette.primary.main,
    outlineOffset: '2px',
  },
});

export const heroMoreChipSx: SxProps<Theme> = (theme) => ({
  height: '36px',
  borderRadius: '999px',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid ' + theme.palette.divider,
  bgcolor: 'transparent',
  color: theme.palette.text.primary,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  scrollSnapAlign: 'start',
  position: 'relative',
  flexShrink: 0,
  display: { xs: 'none', lg: 'inline-flex' },
  ...sweepHoverSx({
    fill: theme.palette.primary.main,
    hoverColor: 'white',
    hoverBorderColor: theme.palette.primary.main,
  }),
  '&.Mui-focusVisible': {
    outline: '2px solid ' + theme.palette.primary.main,
    outlineOffset: '2px',
  },
});

export const heroCategorySkeletonSx: SxProps<Theme> = {
  height: 36,
  borderRadius: '999px',
  flexShrink: 0,
};
