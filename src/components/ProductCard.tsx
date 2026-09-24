import React, { useCallback, useState, useMemo } from 'react';
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
  Info as InfoIcon,
} from '@mui/icons-material';
import { Product } from '../types/product';
import { getImageUrl } from '@/lib/imageUtils';
import { formatFcfa } from '@/lib/format';

// ─── Styled components ───────────────────────────────────────────────────────

const StyledCard = muiStyled(Card, {
  shouldForwardProp: (prop: string) => !['elevationHover', 'isMobile'].includes(prop),
})(({ theme, elevationHover = 8, isMobile = false }: any) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.shorter,
    easing: theme.transitions.easing.easeInOut,
  }),
  '&:hover': {
    transform: isMobile ? 'none' : 'translateY(-4px)',
    boxShadow: theme.shadows[elevationHover],
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
  paddingTop: '74%',  // mobile : image plus compacte
  [theme.breakpoints.up('sm')]: {
    paddingTop: '100%', // sm et + : ratio 1:1 confortable
  },
  overflow: 'hidden',
  backgroundColor: theme.palette.grey[900],
  borderBottom: 'none',
  borderRadius: '0',
  // Clip-path pour couper net sans border-radius visible
  '& img': {
    transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  '&:hover img': {
    transform: 'scale(1.06)',
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
  transition: 'background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
    transform: 'translateY(-1px)',
  },
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
  ...props
}) => {
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
      handleViewDetails(e);
    },
    [handleViewDetails],
  );

  // ── Computed values ────────────────────────────────────────────────────────

  const originalPrice = product.original_price || product.compare_price;

  const discountPercentage = useMemo(
    () =>
      originalPrice && Number(originalPrice) > Number(product.price)
        ? Math.round(
            ((Number(originalPrice) - Number(product.price)) / Number(originalPrice)) * 100,
          )
        : 0,
    [originalPrice, product.price],
  );

  const displayPrice = useMemo(
    () =>
      userType === 'wholesale' && (product.wholesale_price || product.cost_price)
        ? Number(product.wholesale_price || product.cost_price)
        : Number(product.price),
    [userType, product],
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
      className={`product-card ${className}`}
      elevation={elevation}
      elevationHover={8}
      isMobile={isMobile}
      onClick={handleCardClick}
      sx={{ cursor: 'pointer' }}
      aria-label={`Produit: ${product.name}`}
      {...props}
    >
      {/* ── IMAGE ZONE (seule partie modifiée) ── */}
      <ImageZone>

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
                objectFit: 'cover',           // full-bleed — couvre toute la zone
                objectPosition: 'center top', // cadrage haut-centré (UI screenshots)
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.35s ease, transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
                display: 'block',
                filter: 'brightness(1.04) contrast(1.03)', // micro-boost netteté/contraste
              }}
            />
          ) : (
            /* Fallback élégant quand pas d'image */
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                color: 'text.disabled',
              }}
            >
              <InfoIcon sx={{ fontSize: 50, opacity: 0.4 }} />
              <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem' }}>
                Image non disponible
              </Typography>
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
            >
              {isFavorite
                ? <Favorite sx={{ fontSize: { xs: 18, sm: 22.5 }, color: 'error.main' }} />
                : <FavoriteBorder sx={{ fontSize: { xs: 18, sm: 22.5 }, color: 'primary.contrastText' }} />
              }
            </FavoriteButton>
          </Tooltip>
        )}
      </ImageZone>
      {/* ── FIN IMAGE ZONE ── */}

      {/* ── TEXTE / PRIX / ACTIONS — INCHANGÉS ── */}
      <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2.5 } }}>
        <Box sx={{ mb: { xs: 0.5, sm: 1 } }}>
          {product.category_name && (
            <Typography
              variant="caption"
              sx={{
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
              sx={{
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
          sx={{
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

        <Box sx={{ mt: { xs: 0.25, sm: 'auto' } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 1.25, rowGap: 0, minWidth: 0 }}>
            {originalPrice && Number(originalPrice) > Number(product.price) && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'line-through', mb: 0, fontWeight: 500, fontSize: { xs: '0.78rem', sm: '0.875rem' } }}
              >
                {fmt(Number(originalPrice))}
              </Typography>
            )}
            <Typography
              variant="h6"
              component="div"
              color="primary"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.3rem' },
                fontWeight: 'bold',
                lineHeight: 1.2,
                whiteSpace: 'normal',
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

          {originalPrice && Number(originalPrice) > Number(product.price) && userType !== 'wholesale' && (
            <Box sx={{ mt: { xs: 0.375, sm: 1 } }}>
              <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
                <Chip
                  label={`-${discountPercentage}%`}
                  size="small"
                  sx={{
                    bgcolor: 'error.main',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 25,
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'success.main', lineHeight: 1.3 }}>
                  Économisez {fmt(Number(originalPrice) - Number(product.price))}
                </Typography>
              </Stack>
            </Box>
          )}

          {userType === 'wholesale' && (
            <Typography variant="caption" color="text.secondary" display="block">
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
          sx={{
            p: { xs: 1.5, sm: 2.5 },
            pt: { xs: 0.5, sm: 0.5 },
            opacity: 1,
            transition: 'all 0.3s ease-in-out',
            '& button': { transition: 'all 0.2s ease-in-out' },
            '& button:hover': { transform: 'scale(1.05)' },
          }}
        >
          <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ width: '100%' }}>
            <Tooltip title="Ajouter au panier">
              <IconButton
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                onClick={handleAddToCart}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  border: '1px solid',
                  borderColor: 'primary.main',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <ShoppingCart fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Voir les détails">
              <IconButton
                size={isMobile ? 'small' : 'medium'}
                onClick={handleViewDetails}
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
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