'use client';
import { createTheme, alpha } from '@mui/material/styles';
import { Inter, Poppins, Fraunces } from 'next/font/google';
import { tokens } from '@/theme/tokens';

declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      light: string;
      main: string;
      dark: string;
      contrastText: string;
    };
    golden: {
      light: string;
      main: string;
      dark: string;
      contrastText: string;
    };
    laiton: {
      light: string;
      main: string;
      dark: string;
      contrastText: string;
    };
  }
  interface PaletteOptions {
    custom?: {
      light?: string;
      main: string;
      dark?: string;
      contrastText?: string;
    };
    golden?: {
      light?: string;
      main: string;
      dark?: string;
      contrastText?: string;
    };
    laiton?: {
      light?: string;
      main: string;
      dark?: string;
      contrastText?: string;
    };
  }
}

const inter = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

const fraunces = Fraunces({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const FONT_INTER = inter.style.fontFamily;
export const FONT_POPPINS = poppins.style.fontFamily;
export const FONT_FRAUNCES = fraunces.style.fontFamily;

export const BRAND_BLUE = tokens.colors.brand;

const { colors, fontSize } = tokens;
const focusRing = `2px solid ${alpha(colors.brand, 0.4)}`;

const theme = createTheme({
  spacing: 10,
  typography: {
    fontFamily: [inter.style.fontFamily, fraunces.style.fontFamily, poppins.style.fontFamily, 'sans-serif'].join(','),
    h1: {
      fontFamily: FONT_FRAUNCES,
      fontSize: fontSize.xxl,
      fontWeight: 600,
      lineHeight: 1.08,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: FONT_FRAUNCES,
      fontSize: fontSize.xl,
      fontWeight: 600,
      lineHeight: 1.12,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: FONT_FRAUNCES,
      fontSize: fontSize.xl,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: FONT_FRAUNCES,
      fontSize: fontSize.lg,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h5: {
      fontFamily: FONT_FRAUNCES,
      fontSize: fontSize.md,
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h6: {
      fontFamily: FONT_FRAUNCES,
      fontSize: fontSize.md,
      fontWeight: 600,
      lineHeight: 1.3,
    },
    subtitle1: {
      fontSize: fontSize.md,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: fontSize.sm,
      fontWeight: 500,
    },
    body1: {
      fontSize: fontSize.md,
      lineHeight: 1.7,
    },
    body2: {
      fontSize: fontSize.sm,
      lineHeight: 1.6,
    },
    caption: {
      fontSize: fontSize.xs,
      lineHeight: 1.5,
    },
    button: {
      fontSize: 15,
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: colors.brand,
      light: '#2E64A8',
      dark: colors.brandDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    success: {
      main: colors.success,
      light: '#44946A',
      dark: '#176039',
      contrastText: '#ffffff',
    },
    error: {
      main: colors.error,
      light: '#C94F45',
      dark: '#8F1D14',
      contrastText: '#ffffff',
    },
    warning: {
      main: colors.warning,
      light: '#A9862F',
      dark: '#6C5216',
      contrastText: '#ffffff',
    },
    info: {
      main: colors.brand,
      light: '#2E64A8',
      dark: colors.brandDark,
    },
    text: {
      primary: colors.ink,
      secondary: colors.inkMuted,
      disabled: colors.disabled,
    },
    background: {
      default: '#f8fafc',
      paper: colors.white,
    },
    divider: colors.border,
    custom: {
      main: colors.brand,
      light: '#2E64A8',
      dark: colors.brandDark,
      contrastText: '#ffffff',
    },
    golden: {
      main: '#C6A75E',
      light: '#D4B76E',
      dark: '#B8965E',
      contrastText: '#ffffff',
    },
    laiton: {
      main: colors.laiton,
      light: '#C99B5F',
      dark: '#96703A',
      contrastText: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          scrollBehavior: 'smooth',
        },
        a: {
          textDecoration: 'none',
          color: 'inherit',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          padding: '13px 24px',
          '&.Mui-focusVisible': {
            outline: focusRing,
            outlineOffset: '2px',
          },
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: fontSize.sm,
        },
        sizeLarge: {
          padding: '15px 32px',
          fontSize: fontSize.md,
        },
        containedPrimary: {
          background: colors.brand,
          '&:hover': {
            background: colors.brandDark,
          },
          '&:active': {
            background: colors.brandDark,
          },
          '&.Mui-disabled': {
            background: colors.sand,
            color: colors.disabled,
          },
        },
        outlinedPrimary: {
          borderColor: colors.brand,
          color: colors.brand,
          '&:hover': {
            borderColor: colors.brandDark,
            background: alpha(colors.brand, 0.06),
          },
        },
        outlined: {
          borderColor: colors.border,
          color: colors.ink,
          '&:hover': {
            borderColor: colors.brand,
            background: alpha(colors.brand, 0.05),
          },
        },
        textPrimary: {
          color: colors.brand,
          '&:hover': {
            background: alpha(colors.brand, 0.08),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: `1px solid ${colors.border}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.border,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.error,
          },
          '&.Mui-focused': {
            outline: focusRing,
            outlineOffset: '2px',
            borderRadius: 8,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.brand,
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: colors.border,
        },
        input: {
          fontSize: '1rem',
          padding: '13px 14px',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'always',
      },
      styleOverrides: {
        root: {
          color: colors.brand,
          textUnderlineOffset: '3px',
          '&.Mui-focusVisible': {
            outline: focusRing,
            outlineOffset: '2px',
            borderRadius: 4,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: 600,
          padding: '0 7px',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1800,
    },
  },
});

theme.components = {
  ...theme.components,
  MuiCssBaseline: {
    styleOverrides: {
      '::-webkit-scrollbar': {
        width: '10px',
        height: '10px',
      },
      '::-webkit-scrollbar-track': {
        background: colors.ivory,
      },
      '::-webkit-scrollbar-thumb': {
        background: colors.border,
        borderRadius: '5px',
        '&:hover': {
          background: colors.disabled,
        },
      },
    },
  },
};

export default theme;