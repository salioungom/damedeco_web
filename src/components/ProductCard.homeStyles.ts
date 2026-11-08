import type { SxProps, Theme } from '@mui/material/styles';
import { FONT_INTER } from '@/theme';
import { tokens } from '@/theme/tokens';

export const homeProductCardSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    height: '100%',
    borderRadius: '14px',
    border: '1px solid ' + tokens.colors.border.light,
    bgcolor: theme.palette.background.paper,
    boxShadow: 'none',
  },
});

export const homeProductLinkSx: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  borderRadius: 'inherit',
  '&:focus-visible': {
    outline: '2px solid ' + tokens.colors.status.focus,
    outlineOffset: '-2px',
  },
};

export const homeProductImageZoneSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    paddingTop: 0,
    aspectRatio: '4 / 5',
    bgcolor: theme.palette.action.hover,
  },
});

/** Fond neutre + icône centrée quand l'image est absente ou en échec. */
export const homeProductPlaceholderSx: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#F1ECE3',
  color: tokens.colors.text.disabled,
};

export const homeProductContentSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minWidth: 0,
    p: '10px 12px 0',
  },
});

export const homeProductMetaSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '6px',
    rowGap: '2px',
    minWidth: 0,
    mb: '6px',
  },
});

export const homeProductCategorySx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    color: theme.palette.text.secondary,
    fontSize: '10px',
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
});

export const homeProductSlugSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    color: theme.palette.text.secondary,
    fontSize: '10px',
    fontStyle: 'italic',
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  },
});

export const homeProductNameSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'block',
    minHeight: '1.35em',
    mb: '6px',
    overflow: 'visible',
    overflowWrap: 'anywhere',
    fontFamily: FONT_INTER,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.35,
    WebkitLineClamp: 'unset',
    WebkitBoxOrient: 'unset',
  },
});

/** Bloc prix : tout le bloc est poussé en bas de la carte. */
export const homeProductPriceBlockSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    mt: 'auto',
    minWidth: 0,
  },
});

/** Prix empilé en colonne : ligne 1 ancien prix, ligne 2 prix actuel. */
export const homeProductPriceRowSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    columnGap: '0px',
    rowGap: '2px',
    minWidth: 0,
  },
});

/** Ancien prix : barré bien visible, 12px, gris. */
export const homeProductOriginalPriceSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    mb: 0,
    fontSize: '12px',
    fontWeight: 500,
    color: '#7A8190',
    textDecoration: 'line-through',
    whiteSpace: 'nowrap',
  },
});

/** Prix actuel : 15px, 700, bleu de la charte (via color="primary"). */
export const homeProductCurrentPriceSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    minWidth: 0,
    fontFamily: FONT_INTER,
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
  },
});

/**
 * Pastille −X % + « Économisez X FCFA » sur une ligne (sinon la ligne passe
 * sous la pastille). minHeight fixe : avec ou sans réduction, les prix
 * restent alignés entre les cartes d'une même rangée.
 */
export const homeProductDiscountRowSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '6px',
    rowGap: '6px',
    minHeight: '20px',
    mt: '6px',
    minWidth: 0,
  },
});

export const homeProductDiscountChipSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    height: 'auto',
    minHeight: '20px',
    px: '8px',
    py: '2px',
    borderRadius: '999px',
    bgcolor: theme.palette.error.main,
    color: theme.palette.common.white,
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: 1.2,
    '& .MuiChip-label': {
      px: 0,
    },
  },
});

export const homeProductSavingsSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.success.main,
  [theme.breakpoints.down('sm')]: {
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.3,
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
  },
});

export const homeProductWholesaleNoteSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'block',
    mt: '4px',
    fontSize: '12px',
    lineHeight: 1.3,
    whiteSpace: 'normal',
  },
});

/**
 * Rangée d'actions poussée en bas : 10px au-dessus (entre le bloc
 * « Économisez » et les actions), 14px de padding bas de carte.
 */
export const homeProductActionsSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    zIndex: 2,
    mt: 'auto',
    p: '10px 12px 14px',
    justifyContent: 'space-between',
    '& .MuiStack-root': {
      justifyContent: 'space-between',
    },
  },
});

/**
 * Bouton panier : zone tactile 44px, visuelle 36px (cercle bleu plein
 * dessiné en ::after — le ::before est réservé à l'effet sweep).
 */
export const homeProductCartButtonSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    width: '44px',
    height: '44px',
    minWidth: '44px',
    minHeight: '44px',
    borderRadius: '50%',
    bgcolor: 'transparent',
    borderColor: 'transparent',
    boxShadow: 'none',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '4px',
      left: '4px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: theme.palette.primary.main,
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.16)',
    },
    '& .MuiSvgIcon-root': {
      position: 'relative',
      zIndex: 1,
      fontSize: '18px',
      color: theme.palette.primary.contrastText,
    },
  },
});

/**
 * Bouton aperçu (œil) : même géométrie 44px tactile / 36px visuelle,
 * cercle blanc à contour discret.
 */
export const homeProductPreviewButtonSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    width: '44px',
    height: '44px',
    minWidth: '44px',
    minHeight: '44px',
    borderRadius: '50%',
    bgcolor: 'transparent',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '4px',
      left: '4px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: theme.palette.background.paper,
      border: '1px solid ' + tokens.colors.border.light,
    },
    '& .MuiSvgIcon-root': {
      position: 'relative',
      zIndex: 1,
      fontSize: '18px',
      color: theme.palette.text.secondary,
    },
  },
});

/**
 * Favori : toutes les cartes identiques — pastille ronde blanche 32px
 * en haut à droite, zone tactile 44px. Icône contour bleue, remplie
 * rouge si le produit est favori (couleur gérée dans ProductCard).
 */
export const homeProductFavoriteButtonSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    top: '4px',
    right: '4px',
    width: '44px',
    height: '44px',
    minWidth: '44px',
    minHeight: '44px',
    backgroundColor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '6px',
      right: '6px',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
    },
    '& .MuiSvgIcon-root': {
      position: 'relative',
      zIndex: 1,
      fontSize: '18px',
    },
  },
});

export const homeProductEmptyStateSx: SxProps<Theme> = {
  py: 3,
  textAlign: 'center',
};
