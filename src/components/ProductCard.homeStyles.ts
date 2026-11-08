import type { SxProps, Theme } from '@mui/material/styles';
import { FONT_INTER } from '@/theme';
import { tokens } from '@/theme/tokens';

/**
 * Styles des cartes produit « home » (sections « Les dernières nouveautés »
 * et « Produits populaires »).
 *
 * Toutes les règles de ce fichier sont confinées à `theme.breakpoints.down('sm')`
 * (largeur < 600 px), sauf mention contraire : desktop et tablette restent
 * strictement inchangés.
 */

/** Sous 360 px, « Économisez … » passe à 10.5 px avant d'être autorisé à la ligne. */
const SAVINGS_SHRINK_QUERY = '@media (max-width: 359px)';
const SAVINGS_WRAP_QUERY = '@media (max-width: 319px)';

export const homeProductCardSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    height: '100%',
    minWidth: 0,
    borderRadius: '14px',
    border: '1px solid ' + tokens.colors.border.light,
    bgcolor: theme.palette.background.paper,
    boxShadow: 'none',
  },
});

/** Lien de carte en overlay : couvre toute la carte sans imbriquer les boutons. */
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

/** Zone image : carré 1/1 sur mobile, image plein cadre. */
export const homeProductImageZoneSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    paddingTop: 0,
    aspectRatio: '1 / 1',
    minHeight: 0,
    bgcolor: theme.palette.action.hover,
    '& img': {
      objectFit: 'cover',
    },
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

/**
 * Contenu sous l'image : colonne compacte (gap 4 px), padding 10/10/12.
 * `flexGrow` + bloc prix `marginTop: auto` garantissent des cartes alignées.
 */
export const homeProductContentSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: '4px',
    minWidth: 0,
    p: '10px 10px 12px',
    // Sans CardActions sur mobile, CardContent est le dernier enfant :
    // on neutralise le padding bas par défaut de MUI (24 px).
    '&.MuiCardContent-root:last-child': {
      paddingBottom: '12px',
    },
  },
});

/** Ligne 1 : catégorie + slug sur la même ligne, retour à la ligne autorisé. */
export const homeProductMetaSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '4px',
    rowGap: '2px',
    minWidth: 0,
    mb: 0,
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
    ml: 0,
    fontSize: '10px',
    fontStyle: 'italic',
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  },
});

/** Ligne 2 : nom affiché en entier, une seule ligne de réserve, pas de vide. */
export const homeProductNameSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'block',
    minHeight: '1.25em',
    mb: 0,
    overflow: 'visible',
    overflowWrap: 'anywhere',
    fontFamily: FONT_INTER,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.25,
    WebkitLineClamp: 'unset',
    WebkitBoxOrient: 'unset',
    // `gutterBottom` applique un margin bas : neutralisé pour un gap régulier.
    '&.MuiTypography-gutterBottom': {
      marginBottom: 0,
    },
  },
});

/** Bloc prix (lignes 3 à 5) : poussé en bas de la carte. */
export const homeProductPriceBlockSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    mt: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: 0,
  },
});

/**
 * Ancienne rangée de prix (ancien prix + prix actuel). Conservée pour la
 * structure desktop/tablette ; ses règles mobiles ne s'appliquent plus,
 * le mobile utilisant `homeProductOldPriceRowSx` et
 * `homeProductCurrentPriceRowSx`.
 */
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

/** Ligne 3 : ancien prix barré + pastille de réduction sur la même ligne. */
export const homeProductOldPriceRowSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',
    columnGap: '6px',
    rowGap: 0,
    minWidth: 0,
  },
});

/** Ancien prix : barré, 12 px, gris #7A8190. */
export const homeProductOriginalPriceSx: SxProps<Theme> = (theme) => ({
  textDecoration: 'line-through',
  [theme.breakpoints.down('sm')]: {
    mb: 0,
    flexShrink: 0,
    fontSize: '12px',
    fontWeight: 500,
    color: '#7A8190',
    whiteSpace: 'nowrap',
  },
});

/** Ligne 4 : prix actuel à gauche, panier à droite. */
export const homeProductCurrentPriceRowSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: '4px',
    rowGap: 0,
    minWidth: 0,
  },
});

/**
 * Prix actuel : 16 px / 700 / couleur primaire — Inter sur tous les écrans
 * (h6 est serif dans le thème).
 */
export const homeProductCurrentPriceSx: SxProps<Theme> = (theme) => ({
  fontFamily: FONT_INTER,
  [theme.breakpoints.down('sm')]: {
    minWidth: 0,
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: 1.2,
    color: theme.palette.primary.main,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
});

/** Pastille −X % : rouge, 11 px. */
export const homeProductDiscountChipSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    flexShrink: 0,
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

/**
 * Ancienne rangée « pastille + Économisez ». Conservée pour la structure
 * desktop/tablette ; le mobile affiche ces informations sur les lignes 3 et 5.
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

/**
 * Ligne 5 : « Économisez X FCFA », vert, une seule ligne. À 11 px tant que la
 * carte le permet, sinon 10.5 px, puis retour à la ligne en dernier recours.
 */
export const homeProductSavingsSx: SxProps<Theme> = (theme) => ({
  color: theme.palette.success.main,
  [theme.breakpoints.down('sm')]: {
    mb: 0,
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    minWidth: 0,
    [SAVINGS_SHRINK_QUERY]: {
      fontSize: '10.5px',
    },
    [SAVINGS_WRAP_QUERY]: {
      whiteSpace: 'normal',
    },
  },
});

/** Montant + « FCFA » restent insécables même quand la ligne revient à la ligne. */
export const homeProductMoneySx: SxProps<Theme> = {
  whiteSpace: 'nowrap',
};

export const homeProductWholesaleNoteSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    display: 'block',
    mt: '0px',
    mb: 0,
    fontSize: '11px',
    lineHeight: 1.3,
    whiteSpace: 'normal',
  },
});

/**
 * Rangée d'actions (desktop/tablette uniquement : sur mobile home, le panier
 * vit sur la ligne du prix et l'aperçu sur l'image).
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
 * Panier mobile : cercle bleu plein 36 px, zone tactile 44 px (débordement
 * invisible de 4 px), icône 18 px. Placé sur la ligne du prix.
 */
export const homeProductCartButtonSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    zIndex: 3,
    flexShrink: 0,
    width: '36px',
    height: '36px',
    minWidth: '36px',
    minHeight: '36px',
    borderRadius: '50%',
    bgcolor: 'transparent',
    color: theme.palette.primary.contrastText,
    border: 'none',
    boxShadow: 'none',
    overflow: 'visible',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '36px',
      height: '36px',
      zIndex: 0,
      borderRadius: '50%',
      backgroundColor: theme.palette.primary.main,
      transform: 'none',
      transformOrigin: 'left center',
    },
    // Zone tactile 44 px, sans élargir la boîte dans le flux.
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: '-4px',
      borderRadius: '50%',
      backgroundColor: 'transparent',
    },
    '& .MuiSvgIcon-root': {
      position: 'relative',
      zIndex: 1,
      fontSize: '18px',
      color: theme.palette.primary.contrastText,
    },
    '@media (hover: hover)': {
      '&:hover': {
        bgcolor: 'transparent',
      },
      '&:hover::before': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&::before': {
        transition: 'none',
      },
    },
  },
});

/**
 * Aperçu (œil) sur l'image : pastille blanche 32 px en bas à droite
 * (8 px des bords), zone tactile 44 px, icône contour 18 px.
 */
export const homeProductPreviewOnImageSx: SxProps<Theme> = (theme) => ({
  [theme.breakpoints.down('sm')]: {
    position: 'absolute',
    zIndex: 3,
    bottom: '2px',
    right: '2px',
    width: '44px',
    height: '44px',
    minWidth: '44px',
    minHeight: '44px',
    borderRadius: '50%',
    bgcolor: 'transparent',
    border: 'none',
    boxShadow: 'none',
    '&::before': {
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
      color: theme.palette.text.primary,
    },
    '@media (hover: hover)': {
      '&:hover': {
        bgcolor: 'transparent',
      },
      '&:hover::before': {
        backgroundColor: theme.palette.common.white,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
  },
});

/**
 * Aperçu (œil) dans la rangée d'actions : même géométrie 44 px tactile /
 * 36 px visuelle, cercle blanc à contour discret.
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
 * Favori : toutes les cartes identiques — pastille ronde blanche 32 px
 * en haut à droite, zone tactile 44 px. Icône contour bleue, remplie
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
