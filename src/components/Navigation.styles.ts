import type { SxProps, Theme } from '@mui/material/styles';
import { FONT_FRAUNCES, FONT_INTER } from '@/theme';
import { tokens } from '@/theme/tokens';

const dividerColor = tokens.colors.border.light;

export const mobileDrawerRootSx: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  bgcolor: tokens.colors.surfaces.default,
};

export const mobileDrawerHeaderSx: SxProps<Theme> = {
  height: '56px',
  minHeight: '56px',
  px: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid ' + dividerColor,
  flexShrink: 0,
};

export const mobileDrawerBrandSx: SxProps<Theme> = {
  '& [role="img"]': {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '12px',
  },
};

export const mobileDrawerSearchSx: SxProps<Theme> = {
  px: '16px',
  py: '8px',
  borderBottom: '1px solid ' + dividerColor,
  flexShrink: 0,
};

export const mobileDrawerScrollSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
};

export const mobileDrawerPrimaryLinkSx: SxProps<Theme> = {
  minHeight: '48px',
  px: '16px',
  py: '10px',
  borderRadius: '10px',
  bgcolor: 'transparent',
  color: tokens.colors.text.primary,
  transition: 'background-color 0.15s ease',
  '&:active': {
    bgcolor: tokens.colors.surfaces.alt,
  },
  '@media (hover: hover)': {
    '&:hover': {
      bgcolor: tokens.colors.surfaces.alt,
    },
  },
  '&:focus-visible': {
    outline: '2px solid ' + tokens.colors.status.focus,
    outlineOffset: '2px',
  },
  '&[aria-current="page"]': {
    color: tokens.colors.text.primary,
    textDecoration: 'underline',
    textDecorationColor: tokens.colors.text.primary,
    textDecorationThickness: '2px',
    textUnderlineOffset: '6px',
  },
  '& .MuiListItemText-primary': {
    fontFamily: FONT_FRAUNCES,
    fontSize: 'clamp(1.125rem, 5vw, 1.25rem)',
    fontWeight: 500,
    lineHeight: 1.2,
    color: 'inherit',
  },
};

export const mobileDrawerSecondaryLinkSx: SxProps<Theme> = {
  minHeight: '44px',
  px: '16px',
  py: '8px',
  gap: '12px',
  borderRadius: '10px',
  color: tokens.colors.text.secondary,
  '& .MuiListItemIcon-root': {
    minWidth: '32px',
    color: tokens.colors.text.secondary,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
  },
  '& .MuiListItemText-primary': {
    fontFamily: FONT_INTER,
    fontSize: '15px',
    fontWeight: 500,
    color: tokens.colors.text.secondary,
  },
};

export const mobileDrawerDividerSx: SxProps<Theme> = {
  mx: '16px',
  my: '4px',
  borderColor: dividerColor,
};

export const mobileDrawerFooterSx: SxProps<Theme> = {
  borderTop: '1px solid ' + dividerColor,
  px: '16px',
  py: '12px',
  flexShrink: 0,
};

export const mobileDrawerLoginButtonSx: SxProps<Theme> = {
  width: '100%',
  minHeight: '44px',
  height: '44px',
  px: '16px',
  py: 0,
  fontSize: '15px',
  fontWeight: 700,
  textTransform: 'none',
};

export const mobileDrawerRegisterLinkSx: SxProps<Theme> = {
  width: '100%',
  minHeight: '20px',
  py: 0,
  fontSize: '13px',
  fontWeight: 500,
  lineHeight: 1.5,
  textTransform: 'none',
  color: 'primary.main',
  justifyContent: 'center',
  textAlign: 'center',
};

export const mobileDrawerAccountNameSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '15px',
  fontWeight: 600,
};

export const mobileDrawerAccountLinkSx: SxProps<Theme> = {
  minHeight: '44px',
  px: '16px',
  fontSize: '15px',
  fontWeight: 600,
  textTransform: 'none',
};
