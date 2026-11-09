import type { SxProps, Theme } from '@mui/material';
import { tokens } from '@/theme/tokens';

export type FooterLinkSx = Exclude<
  SxProps<Theme>,
  readonly unknown[] | ((theme: Theme) => unknown)
>;

const colors = {
  background: tokens.colors.surfaces.inverseFooter,
  text: tokens.colors.text.onFooter,
  textMuted: tokens.colors.text.onFooterMuted,
  accent: tokens.colors.accent.onFooter,
  accentMain: tokens.colors.accent.main,
  border: tokens.colors.border.onFooter,
  borderSocial: tokens.colors.border.onFooterSocial,
  white: tokens.colors.white,
  brandMark: tokens.colors.brand.mark,
};

export const footerRootSx: SxProps<Theme> = {
  width: '100%',
  bgcolor: colors.background,
  color: colors.text,
  py: { xs: 6, md: 8, lg: 9 },
};

export const footerGridSx: SxProps<Theme> = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(6, minmax(0, 1fr))',
    md: 'repeat(6, minmax(0, 1fr))',
    lg: 'repeat(12, minmax(0, 1fr))',
  },
  columnGap: { xs: 2, sm: 3, md: 3, lg: 3 },
  rowGap: { xs: 4, md: 5 },
  alignItems: 'start',
};

export const brandCellSx: SxProps<Theme> = {
  gridColumn: { xs: 'span 2', sm: 'span 6', md: 'span 2', lg: 'span 3' },
  minWidth: 0,
};

export const contactCellSx: SxProps<Theme> = {
  gridColumn: { xs: 'span 2', sm: 'span 2', md: 'span 2', lg: 'span 3' },
  minWidth: 0,
};

export const navigationCellSx: SxProps<Theme> = {
  gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 1', lg: 'span 2' },
  minWidth: 0,
};

export const accountCellSx: SxProps<Theme> = {
  gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 1', lg: 'span 2' },
  minWidth: 0,
};

export const socialCellSx: SxProps<Theme> = {
  gridColumn: { xs: 'span 2', sm: 'span 3', md: 'span 3', lg: 'span 2' },
  minWidth: 0,
};

export const categoryCellSx: SxProps<Theme> = {
  gridColumn: { xs: 'span 2', sm: 'span 3', md: 'span 3', lg: 'span 3' },
  minWidth: 0,
};

export const sectionHeadingSx: SxProps<Theme> = {
  m: 0,
  mb: 2,
  color: colors.accent,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.12em',
  lineHeight: 1.5,
  textTransform: 'uppercase',
};

export const brandStackSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  mb: 2,
};

export const brandMarkSx: SxProps<Theme> = {
  width: 48,
  height: 48,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  bgcolor: colors.white,
  color: colors.brandMark,
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.04em',
};

export const brandNameSx: SxProps<Theme> = {
  m: 0,
  color: colors.white,
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.25,
};

export const brandTaglineSx: SxProps<Theme> = {
  m: 0,
  mt: 0.5,
  color: colors.accent,
  fontSize: 12,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

export const brandDescriptionSx: SxProps<Theme> = {
  maxWidth: '36ch',
  m: 0,
  color: colors.text,
  fontSize: 15,
  lineHeight: 1.65,
};

export const contactListSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  m: 0,
  p: 0,
  listStyle: 'none',
};

export const contactAddressSx: SxProps<Theme> = {
  fontStyle: 'normal',
};

export const contactItemSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  minWidth: 0,
  minHeight: 44,
  color: colors.text,
  fontSize: 15,
  lineHeight: 1.5,
};

export const contactIconSx: SxProps<Theme> = {
  flexShrink: 0,
  color: colors.accent,
  fontSize: 18,
};

export const contactTextSx: SxProps<Theme> = {
  minWidth: 0,
  color: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
};

export const contactLinkSx: FooterLinkSx = {
  ...contactTextSx,
  display: 'flex',
  alignItems: 'center',
  minHeight: 44,
  textDecoration: 'none',
  overflowWrap: 'anywhere',
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: colors.accentMain,
    outlineOffset: 3,
    borderRadius: 2,
  },
  '@media (hover: hover)': {
    '&:hover': {
      color: colors.accent,
      textDecoration: 'underline',
      textUnderlineOffset: 3,
    },
  },
  transition: 'color 150ms ease',
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
};

export const linkListSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  m: 0,
  p: 0,
  listStyle: 'none',
};

export const linkItemSx: FooterLinkSx = {
  display: 'flex',
  alignItems: 'center',
  minHeight: 44,
  py: 0.5,
  color: colors.text,
  fontSize: 15,
  lineHeight: 1.5,
  textDecoration: 'none',
  overflowWrap: 'anywhere',
  transition: 'color 150ms ease',
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: colors.accentMain,
    outlineOffset: 3,
    borderRadius: 2,
  },
  '@media (hover: hover)': {
    '&:hover': {
      color: colors.accent,
      textDecoration: 'underline',
      textUnderlineOffset: 3,
    },
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
};

export const socialLinksSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1.5,
};

export const socialLinkSx: FooterLinkSx = {
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  flexShrink: 0,
  border: '1px solid',
  borderColor: colors.borderSocial,
  borderRadius: '50%',
  color: colors.text,
  transition: 'color 150ms ease, border-color 150ms ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    borderRadius: 'inherit',
    bgcolor: colors.accentMain,
    transform: 'scaleX(0)',
    transformOrigin: 'left center',
    transition: 'transform 180ms ease',
  },
  '& svg': {
    position: 'relative',
    zIndex: 1,
    width: 20,
    height: 20,
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: colors.accentMain,
    outlineOffset: 3,
    color: colors.white,
    borderColor: colors.accentMain,
    '&::before': {
      transform: 'scaleX(1)',
    },
  },
  '@media (hover: hover)': {
    '&:hover': {
      color: colors.white,
      borderColor: colors.accentMain,
      '&::before': {
        transform: 'scaleX(1)',
      },
    },
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&::before': {
      transition: 'none',
    },
  },
};

export const paymentBadgesSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 1,
  m: 0,
  p: 0,
  listStyle: 'none',
};

export const paymentBadgeSx: SxProps<Theme> = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 40,
  p: '4px',
  boxSizing: 'border-box',
  border: '1px solid',
  borderColor: colors.border,
  borderRadius: 1,
  bgcolor: colors.white,
  color: colors.background,
  '& img': {
    display: 'block',
    width: 'auto',
    height: 28,
    maxWidth: 36,
    objectFit: 'contain',
  },
  '& svg': {
    fontSize: 22,
    color: colors.background,
  },
};

export const bottomBarSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  alignItems: { xs: 'flex-start', md: 'center' },
  justifyContent: 'space-between',
  gap: 2,
  mt: { xs: 4, md: 6 },
  pt: 3,
  pb: { xs: 12, md: 3 },
  borderTop: '1px solid',
  borderColor: colors.border,
};

export const copyrightSx: SxProps<Theme> = {
  flexBasis: { xs: '100%', md: 'auto' },
  m: 0,
  color: colors.textMuted,
  fontSize: 13,
  lineHeight: 1.5,
};

export const legalLinksSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 2.5,
};

export const legalLinkSx: FooterLinkSx = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 40,
  color: colors.textMuted,
  fontSize: 13,
  lineHeight: 1.5,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  transition: 'color 150ms ease',
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: colors.accentMain,
    outlineOffset: 3,
    borderRadius: 2,
  },
  '@media (hover: hover)': {
    '&:hover': {
      color: colors.text,
      textDecoration: 'underline',
      textUnderlineOffset: 3,
    },
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
};

export const backToTopSx: SxProps<Theme> = {
  position: 'relative',
  isolation: 'isolate',
  overflow: 'hidden',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.75,
  minHeight: 44,
  flexShrink: 0,
  px: 2,
  border: '1px solid',
  borderColor: colors.white,
  borderRadius: 999,
  bgcolor: colors.white,
  color: colors.brandMark,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.5,
  whiteSpace: 'nowrap',
  transition:
    'color 180ms ease, border-color 180ms ease, transform 150ms ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    borderRadius: 'inherit',
    bgcolor: colors.accent,
    transform: 'scaleX(0)',
    transformOrigin: 'left center',
    transition: 'transform 180ms ease',
  },
  '& svg': {
    position: 'relative',
    zIndex: 1,
    fontSize: 20,
    transition: 'transform 150ms ease',
  },
  '& span': {
    position: 'relative',
    zIndex: 1,
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: colors.accentMain,
    outlineOffset: 3,
    color: colors.background,
    borderColor: colors.accent,
    '&::before': {
      transform: 'scaleX(1)',
    },
  },
  '@media (hover: hover)': {
    '&:hover': {
      borderColor: colors.accent,
      color: colors.background,
      transform: 'translateY(-2px)',
      '&::before': {
        transform: 'scaleX(1)',
      },
      '& svg': {
        transform: 'translateY(-2px)',
      },
    },
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&::before': {
      transition: 'none',
    },
    '& svg': {
      transition: 'none',
    },
  },
};

export const backToTopCompactSx: SxProps<Theme> = {
  ...backToTopSx,
  width: 40,
  height: 40,
  minHeight: 40,
  boxSizing: 'border-box',
  p: 0,
  borderRadius: '50%',
  '& svg': {
    position: 'relative',
    zIndex: 1,
    fontSize: 20,
    transition: 'transform 150ms ease',
  },
};

export const backToTopMobileSx: SxProps<Theme> = {
  display: { xs: 'block', md: 'none' },
};

export const backToTopDesktopSx: SxProps<Theme> = {
  display: { xs: 'none', md: 'block' },
};
