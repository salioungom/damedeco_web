import React, { useCallback, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { styled as muiStyled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Stack,
  Chip,
  Tooltip,
  useTheme as useMuiTheme,
  Skeleton,
} from '@mui/material';
import {
  ShoppingCart,
  Visibility,
  Favorite,
  FavoriteBorder,
  ImageOutlined,
} from '@mui/icons-material';
import { Product } from '../types/product';
import { getImageUrl } from '@/lib/imageUtils';
import { formatFcfa } from '@/lib/format';
import { sweepHoverSx } from './ui/sweepHover';
import {
  homeProductActionsSx,
  homeProductCardSx,
  homeProductCategorySx,
  homeProductContentSx,
  homeProductCurrentPriceSx,
  homeProductDiscountChipSx,
  homeProductDiscountRowSx,
  homeProductFavoriteButtonSx,
  homeProductImageZoneSx,
  homeProductLinkSx,
  homeProductMetaSx,
  homeProductNameSx,
  homeProductOriginalPriceSx,
  homeProductPlaceholderSx,
  homeProductPriceBlockSx,
  homeProductPriceRowSx,
  homeProductSavingsSx,
  homeProductSlugSx,
  homeProductWholesaleNoteSx,
  homeProductCartButtonSx,
  homeProductPreviewButtonSx,
} from './ProductCard.homeStyles';

// ─── Styled components ───────────────────────────────────────────────────────

const StyledCard = muiStyled(Card, {
  shouldForwardProp: (prop: string) => !['elevationHover', 'isMobile'].includes(prop),
})<{ elevationHover?: number; isMobile?: boolean }>(({ theme, elevationHover = 8, isMobile = false }: any) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.shorter,
    easing: theme.transitions.easing.easeInOut,
  }),
  '@media (hover: hover)': {
    '&:hover': {
      transform: isMobile ? 'none' : 'translateY(-4px)',
      boxShadow: theme.shadows[elevationHover],
    },
  },
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
    '&:hover': {
      transform: 'none',
    },
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

/**
 * IMAGE ZONE — zone améliorée
 * Ratio 4/3 (75%) qui s'adapte bien aux images produit.
 * Fond neutre légèrement teinté pour faire ressortir le produit.
 */
const ImageZone = muiStyled(Box)(({ theme }: { theme: any }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: '75%', // ratio fixe 4/3 (aspect-ratio 4/3)
  overflow: 'hidden',
  backgroundColor: theme.palette.primary.dark,
  borderBottom: 'none',
  borderRadius: '0',
  // Clip-path pour couper net sans border-radius visible
  '& img': {
    transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  '@media (hover: hover)': {
    '&:hover img': {
      transform: 'scale(1.06)',
    },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '& img': {
      transition: 'none',
      transform: 'none',
    },
    '&:hover img': {
      transform: 'none',
    },
  },
}));

/**
 * IMAGE INNER — l'image elle-même avec transition zoom au hover
 */
const ImageInner = muiStyled(Box)(() => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,               // full-bleed, aucune marge
  overflow: 'hidden',
}));

/**
 * Skeleton overlay pendant le chargement de l'image
 */
const ImageSkeleton = muiStyled(Skeleton)(() => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  transform: 'none', // annule le transform par défaut de MUI Skeleton
  borderRadius: 0,
}));

const FavoriteButton = muiStyled(IconButton)(({ theme }: { theme: any }) => ({
  position: 'absolute',
  top: 10,
  right: 10,
  zIndex: 3,
  width: 45,
  height: 45,
  backgroundColor: theme.palette.primary.main,
  border: `1px solid ${theme.palette.primary.main}`,
  boxShadow: theme.shadows[2],
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 36,
    top: 8,
    right: 8,
  },
}));

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  userType: 'retail' | 'wholesale';
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
  className?: string;
  elevation?: number;
  showActions?: boolean;
  showFavorite?: boolean;
  homeGrid?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  userType,
  isFavorite = false,
  onToggleFavorite,
  className = '',
  elevation = 2,
  showActions = true,
  showFavorite = true,
  homeGrid = false,
  ...props
}) => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isHomeGridMobile = homeGrid && isMobile;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const handleAddToCart = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onAddToCart(product); },
    [onAddToCart, product],
  );

  const handleViewDetails = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onViewDetails(product); },
    [onViewDetails, product],
  );

  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); onToggleFavorite?.(String(product.id)); },
    [onToggleFavorite, product.id],
  );

  // ── Computed values ────────────────────────────────────────────────────────

  const originalPrice = product.original_price || product.compare_price;

  const displayPrice = useMemo(
    () =>
      userType === 'wholesale' && (product.wholesale_price || product.cost_price)
        ? Number(product.wholesale_price || product.cost_price)
        : Number(product.price),
    [userType, product],
  );

  const discountPrice = isHomeGridMobile ? displayPrice : Number(product.price);
  const hasDiscount = Boolean(originalPrice && Number(originalPrice) > discountPrice);

  const discountPercentage = useMemo(
    () =>
      originalPrice && Number(originalPrice) > discountPrice
        ? Math.round(
            ((Number(originalPrice) - discountPrice) / Number(originalPrice)) * 100,
          )
        : 0,
    [originalPrice, discountPrice],
  );

  const savingsAmount = useMemo(
    () =>
      originalPrice && Number(originalPrice) > discountPrice
        ? Number(originalPrice) - discountPrice
        : 0,
    [originalPrice, discountPrice],
  );

  const fmt = (amount: number) => formatFcfa(amount);

  // ── Skeleton state ─────────────────────────────────────────────────────────

  if (!product) {
    return (
      <StyledCard elevation={elevation} isMobile={isMobile}>
        <ImageZone>
          <ImageSkeleton variant="rectangular" />
        </ImageZone>
        <CardContent>
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={20} />
        </CardContent>
      </StyledCard>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasImage = !!product.cover_image_url && !imageError;

  return (
    <StyledCard
      component="article"
      className={`product-card ${className}`}
      elevation={elevation}
      elevationHover={8}
      isMobile={isMobile}
      aria-label={`Produit: ${product.name}`}
      sx={homeGrid ? homeProductCardSx : undefined}
      {...props}
    >
      {homeGrid && (
        <Box
          component={Link}
          href={'/product/' + product.id}
          className="home-product-card-link"
          aria-label={'Voir le produit ' + product.name}
          sx={homeProductLinkSx}
        />
      )}

      <ImageZone sx={homeGrid ? homeProductImageZoneSx : undefined}>

        {/* Skeleton visible pendant le chargement */}
        {imageLoading && hasImage && (
          <ImageSkeleton
            variant="rectangular"
            animation="wave"
            sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}
          />
        )}

        <ImageInner className="product-image-inner">
          {hasImage ? (
            isHomeGridMobile ? (
              <Image
                src={getImageUrl(product.cover_image_url)}
                alt={product.name}
                fill
                sizes="(max-width: 600px) 50vw, 25vw"
                loading="lazy"
                onLoad={() => setImageLoading(false)}
                onError={() => { setImageLoading(false); setImageError(true); }}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                  opacity: imageLoading ? 0 : 1,
                }}
              />
            ) : (
              <Box
                component="img"
                src={getImageUrl(product.cover_image_url)}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoading(false)}
                onError={() => { setImageLoading(false); setImageError(true); }}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  opacity: imageLoading ? 0 : 1,
                  transition: 'opacity 0.35s ease, transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
                  display: 'block',
                  filter: 'brightness(1.04) contrast(1.03)',
                }}
              />
            )
          ) : (
            <Box
              sx={isHomeGridMobile ? homeProductPlaceholderSx : {
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F1ECE3',
                color: 'text.disabled',
              }}
            >
              <ImageOutlined sx={{ fontSize: 36 }} aria-hidden="true" />
            </Box>
          )}
        </ImageInner>

        {/* ── Bouton favori ── */}
        {onToggleFavorite && showFavorite && (
          <Tooltip
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            arrow
            placement="top"
          >
            <FavoriteButton
              onClick={handleToggleFavorite}
              size="small"
              aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              aria-pressed={isFavorite}
              sx={[
                sweepHoverSx({
                  fill: theme.palette.background.paper,
                  hoverColor: theme.palette.primary.main,
                  hoverBorderColor: theme.palette.primary.main,
                }),
                ...(homeGrid ? [homeProductFavoriteButtonSx] : []),
                {
                  '@media (hover: hover)': {
                    '&:hover .MuiSvgIcon-root': { color: theme.palette.primary.main },
                  },
                },
              ]}
            >
              {isFavorite
                ? <Favorite sx={{ fontSize: { xs: 18, sm: 22.5 }, color: 'error.main' }} />
                : <FavoriteBorder sx={{ fontSize: { xs: 18, sm: 22.5 }, color: { xs: 'primary.main', sm: 'primary.contrastText' } }} />
              }
            </FavoriteButton>
          </Tooltip>
        )}
      </ImageZone>
      {/* ── FIN IMAGE ZONE ── */}

      {/* ── TEXTE / PRIX / ACTIONS — INCHANGÉS ── */}
      <CardContent
        sx={[
          { flexGrow: 1, p: { xs: 1.5, sm: 2.5 } },
          ...(homeGrid ? [homeProductContentSx] : []),
        ]}
      >
        <Box sx={homeGrid ? homeProductMetaSx : { mb: { xs: 0.5, sm: 1 } }}>
          {product.category_name && (
            <Typography
              variant="caption"
              sx={homeGrid ? homeProductCategorySx : {
                color: 'primary.main',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.7rem',
              }}
            >
              {product.category_name}
            </Typography>
          )}
          {product.slug && (
            <Typography
              variant="caption"
              sx={homeGrid ? homeProductSlugSx : {
                color: 'text.secondary',
                ml: product.category_name ? 1 : 0,
                fontSize: '0.65rem',
                fontStyle: 'italic',
              }}
            >
              {product.slug}
            </Typography>
          )}
        </Box>

        <Typography
          gutterBottom
          variant="subtitle1"
          component="h3"
          sx={homeGrid ? homeProductNameSx : {
            fontWeight: 600,
            fontSize: { xs: '0.92rem', sm: '1.05rem' },
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: { xs: '2.4em', sm: '3em' },
            mb: { xs: 0.375, sm: 0.75 },
          }}
        >
          {product.name}
        </Typography>

        <Box sx={homeGrid ? homeProductPriceBlockSx : { mt: { xs: 0.25, sm: 'auto' } }}>
          <Box sx={homeGrid ? homeProductPriceRowSx : { display: 'flex', flexWrap: 'nowrap', alignItems: 'baseline', columnGap: 1.25, rowGap: 0, minWidth: 0 }}>
            {hasDiscount && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={homeGrid ? homeProductOriginalPriceSx : { textDecoration: 'line-through', mb: 0, fontWeight: 500, fontSize: { xs: '0.78rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}
              >
                {fmt(Number(originalPrice))}
              </Typography>
            )}
            <Typography
              variant="h6"
              component="div"
              color="primary"
              sx={homeGrid ? homeProductCurrentPriceSx : {
                fontSize: { xs: '0.95rem', sm: '1.3rem' },
                fontWeight: 600,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
                overflowWrap: 'anywhere',
                minWidth: 0,
              }}
            >
              {fmt(displayPrice)}
              {userType === 'wholesale' && (product.wholesale_price || product.cost_price) && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (gros)
                </Typography>
              )}
            </Typography>
          </Box>

          {(isHomeGridMobile || (hasDiscount && userType !== 'wholesale')) && (
            <Box
              sx={homeGrid ? homeProductDiscountRowSx : {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 1,
                rowGap: 0.5,
                flexWrap: 'wrap',
                mt: { xs: 0.375, sm: 1 },
                minWidth: 0,
              }}
            >
              {hasDiscount && (
                <Chip
                  label={`-${discountPercentage}%`}
                  size="small"
                  color="error"
                  sx={homeGrid ? homeProductDiscountChipSx : { fontWeight: 600, fontSize: '0.7rem', height: 25, flexShrink: 0 }}
                />
              )}
              {hasDiscount && (
                <Typography
                  variant="body2"
                  sx={homeGrid ? homeProductSavingsSx : { fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap', color: '#067647' }}
                >
                  Économisez {fmt(savingsAmount)}
                </Typography>
              )}
            </Box>
          )}

          {userType === 'wholesale' && (
            <Typography variant="caption" color="text.secondary" sx={homeGrid ? homeProductWholesaleNoteSx : { display: 'block' }}>
              {product.wholesale_price || product.cost_price
                ? 'Prix spécial pour commandes en gros'
                : 'Contactez-nous pour les prix de gros'}
            </Typography>
          )}
        </Box>
      </CardContent>

      {showActions && (
        <CardActions
          className="product-actions"
          sx={[
            {
              ...(homeGrid ? { position: 'relative', zIndex: 2 } : {}),
              p: { xs: 1.5, sm: 2.5 },
              pt: { xs: 0.5, sm: 0.5 },
              opacity: 1,
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              '& button': {
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
              },
              '@media (hover: hover)': {
                '& button:hover': { transform: 'scale(1.05)' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
                '& button': { transition: 'none' },
                '& button:hover': { transform: 'none' },
              },
            },
            ...(homeGrid ? [homeProductActionsSx] : []),
          ]}
        >
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ width: '100%' }}>
            <Tooltip title="Ajouter au panier">
              <IconButton
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                onClick={handleAddToCart}
                aria-label={`Ajouter ${product.name} au panier`}
                sx={[
                  {
                    position: 'relative',
                    ...sweepHoverSx({
                      fill: theme.palette.background.paper,
                      hoverColor: theme.palette.primary.main,
                      hoverBorderColor: theme.palette.primary.main,
                    }),
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    border: '1px solid',
                    borderColor: 'primary.main',
                    boxShadow: theme.shadows[2],
                  },
                  ...(homeGrid ? [homeProductCartButtonSx] : []),
                ]}
              >
                <ShoppingCart fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Voir les détails">
              <IconButton
                size={isMobile ? 'small' : 'medium'}
                onClick={handleViewDetails}
                aria-label={`Voir les détails de ${product.name}`}
                sx={[
                  {
                    position: 'relative',
                    ...sweepHoverSx({
                      fill: theme.palette.primary.main,
                      hoverColor: theme.palette.primary.contrastText,
                    }),
                    bgcolor: 'action.hover',
                  },
                  ...(homeGrid ? [homeProductPreviewButtonSx] : []),
                ]}
              >
                <Visibility fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardActions>
      )}
    </StyledCard>
  );
};

export default React.memo(ProductCard);