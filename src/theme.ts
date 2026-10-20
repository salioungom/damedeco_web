'use client';
import { createTheme, alpha } from '@mui/material/styles';
import { Inter, Poppins } from 'next/font/google';
import { tokens } from '@/theme/tokens';

declare module '@mui/material/styles' {
  interface TypeBackground {
    cream: string;
  }
  interface Palette {
    accent: {
      main: string;
      onDark: string;
      onLight: string;
    };
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
    accent?: {
      main?: string;
      onDark?: string;
      onLight?: string;
    };
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
});

const poppins = Poppins({
  weight: ['700'],
  subsets: ['latin'],
  display: 'swap',
});

export const FONT_INTER = inter.style.fontFamily;
export const FONT_POPPINS = poppins.style.fontFamily;
export const FONT_FRAUNCES = FONT_POPPINS;

export const BRAND_BLUE = tokens.colors.brand.main;

const { colors, fontSize } = tokens;
const focusRing = `2px solid ${tokens.colors.brand.main}`;

const theme = createTheme({
  spacing: 10,
  typography: {
    fontFamily: [inter.style.fontFamily, 'sans-serif'].join(','),
    h1: {
      fontFamily: FONT_POPPINS,
      fontSize: fontSize.xxl,
      fontWeight: 600,
      lineHeight: 1.08,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: FONT_POPPINS,
      fontSize: fontSize.xl,
      fontWeight: 600,
      lineHeight: 1.12,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontFamily: FONT_POPPINS,
      fontSize: fontSize.xl,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontFamily: FONT_POPPINS,
      fontSize: fontSize.lg,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h5: {
      fontFamily: FONT_POPPINS,
      fontSize: fontSize.md,
      fontWeight: 600,
      lineHeight: 1.25,
    },
    h6: {
      fontFamily: FONT_POPPINS,
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
      main: colors.brand.main,
      light: colors.brand.soft,
      dark: colors.brandDark,
      contrastText: colors.white,
    },
    secondary: {
      main: colors.accent.onLight,
      light: colors.accent.onDark,
      dark: colors.accent.onLight,
      contrastText: colors.white,
    },
    success: {
      main: colors.success,
      light: colors.status.successLight,
      dark: colors.status.successDark,
      contrastText: colors.white,
    },
    error: {
      main: colors.error,
      light: colors.status.errorLight,
      dark: colors.status.errorDark,
      contrastText: colors.white,
    },
    warning: {
      main: colors.warning,
      light: colors.status.warningLight,
      dark: colors.status.warningDark,
      contrastText: colors.white,
    },
    info: {
      main: colors.brand.main,
      light: colors.brand.soft,
      dark: colors.brandDark,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      disabled: colors.text.disabled,
    },
    background: {
      default: colors.surfaces.default,
      paper: colors.surfaces.paper,
      cream: colors.surfaces.alt,
    },
    divider: colors.border.light,
    accent: {
      main: colors.accent.main,
      onDark: colors.accent.onDark,
      onLight: colors.accent.onLight,
    },
    custom: {
      main: colors.brand.main,
      light: colors.brand.soft,
      dark: colors.brandDark,
      contrastText: colors.white,
    },
    golden: {
      main: colors.accent.main,
      light: colors.accent.onDark,
      dark: colors.accent.onLight,
      contrastText: colors.white,
    },
    laiton: {
      main: colors.accent.main,
      light: colors.accent.onDark,
      dark: colors.accent.onLight,
      contrastText: colors.text.primary,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          scrollBehavior: 'smooth',
          backgroundColor: colors.surfaces.default,
          color: colors.text.primary,
        },
        ':root': {
          '--theme-primary-main': colors.brand.main,
          '--theme-primary-dark': colors.brandDark,
          '--theme-primary-light': colors.brand.soft,
          '--theme-secondary-main': colors.accent.onLight,
          '--theme-secondary-light': colors.accent.onDark,
          '--theme-background-cream': colors.surfaces.alt,
          '--theme-background-default': colors.surfaces.default,
          '--theme-border-light': colors.border.light,
          '--theme-text-primary': colors.text.primary,
          '--theme-text-secondary': colors.text.secondary,
          '--theme-on-inverse-muted': colors.text.onInverseMuted,
          '--theme-on-inverse-light': '#e8eff5',
          '--theme-white': colors.white,
          '--theme-white-10': 'rgba(255, 255, 255, 0.1)',
          '--theme-white-12': 'rgba(255, 255, 255, 0.12)',
          '--theme-white-14': 'rgba(255, 255, 255, 0.14)',
          '--theme-white-15': 'rgba(255, 255, 255, 0.15)',
          '--theme-white-18': 'rgba(255, 255, 255, 0.18)',
          '--theme-white-20': 'rgba(255, 255, 255, 0.2)',
          '--theme-white-25': 'rgba(255, 255, 255, 0.25)',
          '--theme-white-30': 'rgba(255, 255, 255, 0.3)',
          '--theme-white-50': 'rgba(255, 255, 255, 0.5)',
          '--theme-white-70': 'rgba(255, 255, 255, 0.7)',
          '--theme-white-82': 'rgba(255, 255, 255, 0.82)',
          '--theme-white-06': 'rgba(255, 255, 255, 0.06)',
          '--theme-white-08': 'rgba(255, 255, 255, 0.08)',
          '--theme-white-09': 'rgba(255, 255, 255, 0.9)',
          '--theme-black-10': 'rgba(0, 0, 0, 0.1)',
          '--theme-black-25': 'rgba(0, 0, 0, 0.25)',
          '--theme-black-30': 'rgba(0, 0, 0, 0.3)',
          '--theme-black-40': 'rgba(0, 0, 0, 0.4)',
          '--theme-black-80': 'rgba(0, 0, 0, 0.8)',
          '--theme-black-05': 'rgba(0, 0, 0, 0.05)',
          '--theme-black-50': 'rgba(0, 0, 0, 0.5)',
          '--theme-black-70': 'rgba(0, 0, 0, 0.7)',
          '--theme-neutral-placeholder': '#f3f4f6',
          '--theme-neutral-placeholder-line': '#d1d5db',
          '--theme-neutral-placeholder-border': '#e5e7eb',
          '--theme-error-light': colors.status.errorLight,
          '--theme-error-main': colors.error,
          '--theme-black-04': 'rgba(0, 0, 0, 0.04)',
          '--theme-black-08': 'rgba(0, 0, 0, 0.08)',
          '--theme-black-15': 'rgba(0, 0, 0, 0.15)',
          '--theme-black-20': 'rgba(0, 0, 0, 0.2)',
          '--theme-whatsapp': '#128C7E',
          '--theme-whatsapp-dark': '#075E54',
          '--theme-gold-soft': 'rgba(224, 184, 114, 0.45)',
          '--theme-card-hover-bg': '#1e3a6e',
          '--theme-card-border': colors.border.light,
          '--theme-icon-fallback-bg': '#f3f4f6',
          '--theme-icon-fallback-line': '#d1d5db',
          '--theme-icon-fallback-stroke': '#9ca3af',
          '--theme-icon-fallback-ink': '#6b7280',
        },
        ':focus-visible': {
          outline: focusRing,
          outlineOffset: '2px',
        },
        '::-webkit-scrollbar': {
          width: '10px',
          height: '10px',
        },
        '::-webkit-scrollbar-track': {
          background: colors.ivory,
        },
        '::-webkit-scrollbar-thumb': {
          background: colors.border.light,
          borderRadius: '5px',
          '&:hover': { background: colors.disabled },
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            scrollBehavior: 'auto !important',
            transitionDuration: '0.01ms !important',
          },
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
          borderRadius: 10,
          fontWeight: 600,
          padding: '13px 24px',
          transition: 'transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
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
        outlined: {
          boxShadow: 'none',
          borderColor: colors.border.light,
          color: colors.ink,
          '&:hover': {
            borderColor: colors.brand.main,
            background: alpha(colors.brand.main, 0.05),
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: { color: 'inherit' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          border: `1px solid ${colors.border.light}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
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
            borderColor: colors.border.light,
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
            borderColor: colors.brand.main,
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: colors.border.light,
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
          color: 'inherit',
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

export default theme;
