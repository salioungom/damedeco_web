'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  Divider,
  Tabs,
  Tab,
  Stack,
  IconButton,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Skeleton,
  Alert,
  alpha,
} from '@mui/material';
import {
  ShoppingCart,
  Remove as Minus,
  Add as Plus,
  ChevronLeft,
  ChevronRight,
  LocalShipping as Truck,
  Cached as RefreshCw,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Star as StarIcon,
  NavigateNext,
  VerifiedUser,
} from '@mui/icons-material';
import { Product, ProductStatus } from '../types/product';
import { productService } from '../services/product.service';
import { ProductImage } from './ProductImage';
import ProductCard from './ProductCard';
import { PaymentIcons } from './PaymentIcons';
import { tokens } from '@/theme/tokens';
import { formatFcfa } from '@/lib/format';
import { NAVBAR_HEIGHT } from './Navigation';

const C = {
  primary: tokens.colors.brand.main,
  dark:    tokens.colors.surfaces.inverse,
  light:   tokens.colors.brand.soft,
  surface: tokens.colors.surfaces.default,
  border:  tokens.colors.border.light,
  mid:     tokens.colors.brand.main,
  muted:   tokens.colors.text.secondary,
  text:    tokens.colors.text.primary,
  paper:   tokens.colors.surfaces.paper,
  gold:    tokens.colors.accent.main,
  brandHover: tokens.colors.brand.hover,
  statusError: tokens.colors.status.error,
  statusSuccess: tokens.colors.status.success,
  accentOnLight: tokens.colors.accent.onLight,
} as const;

const formatPrice = (amount: number) => formatFcfa(amount);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ProductDetailPageProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onBack: () => void;
  userType: 'retail' | 'wholesale';
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onViewProduct: (product: Product) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const navBtnSx = {
  position: 'absolute' as const,
  top: '50%',
  transform: 'translateY(-50%)',
  bgcolor: alpha(C.paper, 0.95),
  color: C.dark,
  border: `1px solid ${C.border}`,
  boxShadow: `0 4px 16px ${alpha(C.dark, 0.1)}`,
  width: { xs: 44, sm: 50, md: 55 },
  height: { xs: 44, sm: 50, md: 55 },
  zIndex: 2,
  '&:hover': { bgcolor: C.paper, transform: 'translateY(-50%) scale(1.05)' },
};

export function ProductDetailPage({
  product,
  onAddToCart,
  onBack: _onBack,
  userType,
  favorites,
  onToggleFavorite,
  onViewProduct,
}: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [galleryImages, setGalleryImages] = useState<{ image_url: string }[]>([]);

  const price = userType === 'wholesale' && product.wholesale_price ? product.wholesale_price : product.price;
  const originalPrice = product.compare_price || product.original_price;

  useEffect(() => {
    let mounted = true;
    const fetchSimilar = async () => {
      try {
        setLoadingSimilar(true);
        const response = await productService.getProducts({
          category_id: product.category_id,
          limit: 5,
        });
        if (mounted) {
          if (response.error) {
            setSimilarProducts([]);
          } else {
            const items = response.data?.items || [];
            setSimilarProducts(items.filter((p) => p.id !== product.id).slice(0, 4));
          }
        }
      } catch {
        if (mounted) setSimilarProducts([]);
      } finally {
        if (mounted) setLoadingSimilar(false);
      }
    };

    if (product.category_id) fetchSimilar();
    else setLoadingSimilar(false);
    return () => { mounted = false; };
  }, [product.category_id, product.id]);

  useEffect(() => {
    let mounted = true;
    const fetchGalleryImages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/products/${product.id}/images`);
        if (response.ok) {
          const galleryData = await response.json();
          if (mounted) setGalleryImages(galleryData.images || []);
        }
      } catch {
        /* galerie optionnelle */
      }
    };
    if (product.id) fetchGalleryImages();
    return () => { mounted = false; };
  }, [product.id]);

  const galleryImageUrls = (galleryImages || []).map((img) => img.image_url).filter(Boolean);

  const getFullImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    if (cleanPath.startsWith('/media/')) return `${API_BASE_URL}${cleanPath}`;
    return `${API_BASE_URL}/media${cleanPath}`;
  };

  const allImages = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    const push = (raw?: string) => {
      const full = getFullImageUrl(raw || '');
      if (full && !seen.has(full)) {
        seen.add(full);
        list.push(full);
      }
    };
    push(product.cover_image_url);
    galleryImageUrls.forEach(push);
    return list;
  }, [product.cover_image_url, galleryImageUrls]);

  const displayImage = allImages[selectedImage] || '/placeholder-image.jpg';
  const productIdStr = String(product.id);
  const isFavorite = favorites.includes(productIdStr);
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;
  const reviewCount = product.review_count ?? 0;

  // ── DISPONIBILITÉ COMMERCIALE ─────────────────────────────────────────────
  // Le stock ne pilote PLUS l'UX d'achat (gestion du stock différée) :
  // un produit à 0 exemplaire reste sélectionnable, commandable et
  // ajoutable au panier. Seul le statut commercial décide de l'achat.
  //
  // `status` absent ⇒ fail open (on n'interdit pas la vente) pour ne pas
  // bloquer un produit dont le statut serait mal sérialisé par l'API.
  const isActive = !product.status || product.status === ProductStatus.ACTIVE;
  const canBuy = isActive;

  // Information non bloquante uniquement : à 0 on n'affiche rien, sinon on
  // afficherait « Plus que 0 exemplaire en stock », qui est un non-sens.
  const isLowStock =
    product.inventory_quantity > 0 && product.inventory_quantity <= 5;

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const trustPoints = [
    { icon: VerifiedUser, text: 'Import direct depuis la Chine — qualité garantie' },
    { icon: Truck, text: 'Livraison express Dakar & tout le Sénégal' },
    { icon: RefreshCw, text: 'Retour possible sous 7 jours' },
  ];

  const Thumbnail = ({ src, index }: { src: string; index: number }) => (
    <Box
      component="button"
      type="button"
      onClick={() => setSelectedImage(index)}
      aria-label={`Image ${index + 1}`}
      sx={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: '15px',
        overflow: 'hidden',
        border: selectedImage === index ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
        bgcolor: C.paper,
        p: 0,
        cursor: 'pointer',
        opacity: selectedImage === index ? 1 : 0.75,
        transition: 'all 0.2s ease',
        boxShadow: selectedImage === index ? `0 4px 16px ${alpha(C.primary, 0.2)}` : 'none',
        '&:hover': { opacity: 1, borderColor: C.primary },
      }}
    >
      <ProductImage
        src={src}
        alt={`${product.name} ${index + 1}`}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
      />
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: C.surface, pb: { xs: 5, sm: 6, md: 8, lg: 10 } }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 2.5, md: 3, lg: 4 }, pt: { xs: `calc(${NAVBAR_HEIGHT.xs}px + 20px)`, sm: 2.5, md: 3, lg: 4 } }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: C.muted }} />}
          sx={{ mb: { xs: 2, sm: 2.5, md: 3, lg: 4 }, '& .MuiBreadcrumbs-li': { fontSize: { xs: 14, sm: 15, md: 16.25 } } }}
        >
          <Link href="/" style={{ textDecoration: 'none', color: C.muted, fontWeight: 500 }}>Accueil</Link>
          <Link href="/shop" style={{ textDecoration: 'none', color: C.muted, fontWeight: 500 }}>Boutique</Link>
          {product.category_name && (
            <Link
              href={`/shop?category=${product.category_id}`}
              style={{ textDecoration: 'none', color: C.muted, fontWeight: 500 }}
            >
              {product.category_name}
            </Link>
          )}
          <Typography sx={{ color: C.dark, fontWeight: 600, fontSize: { xs: 14, sm: 15, md: 16.25 } }} noWrap>
            {product.name}
          </Typography>
        </Breadcrumbs>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.15fr) minmax(340px, 0.85fr)' },
            gap: { xs: 3, sm: 4, lg: 5 },
            alignItems: 'start',
          }}
        >
          {/* Galerie */}
          <Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: allImages.length > 1 ? '72px 1fr' : '1fr',
                },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {allImages.length > 1 && (
                <Stack
                  spacing={{ xs: 0.75, sm: 1 }}
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    maxHeight: { md: 650, lg: 700 },
                    overflowY: 'auto',
                    pr: 0.5,
                  }}
                >
                  {allImages.map((img, index) => (
                    <Thumbnail key={img} src={img} index={index} />
                  ))}
                </Stack>
              )}

              <Paper
                elevation={0}
                sx={{
                  position: 'relative',
                  borderRadius: { xs: '20px', sm: '22px', md: '25px' },
                  overflow: 'hidden',
                  bgcolor: C.paper,
                  border: `1px solid ${C.border}`,
                  aspectRatio: { xs: '1', sm: '4/5', md: '1' },
                  maxHeight: { md: 650, lg: 700 },
                  boxShadow: `0 16px 48px ${alpha(C.dark, 0.08)}`,
                }}
              >
                <ProductImage
                  src={displayImage}
                  alt={product.name}
                  priority
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />

                {allImages.length > 1 && (
                  <>
                    <IconButton onClick={handlePrevImage} sx={{ ...navBtnSx, left: 14 }} size="small">
                      <ChevronLeft />
                    </IconButton>
                    <IconButton onClick={handleNextImage} sx={{ ...navBtnSx, right: 14 }} size="small">
                      <ChevronRight />
                    </IconButton>
                    <Chip
                      label={`${selectedImage + 1} / ${allImages.length}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: { xs: 12, sm: 14, md: 16 },
                        right: { xs: 12, sm: 14, md: 16 },
                        bgcolor: alpha(C.dark, 0.75),
                        color: C.paper,
                        fontWeight: 700,
                        fontSize: { xs: 13, sm: 14, md: 15 },
                        backdropFilter: 'blur(8px)',
                      }}
                    />
                  </>
                )}

                </Paper>
            </Box>

            {allImages.length > 1 && (
              <Box
                sx={{
                  display: { xs: 'grid', md: 'none' },
                  gridTemplateColumns: `repeat(${Math.min(allImages.length, 5)}, 1fr)`,
                  gap: { xs: 0.75, sm: 1 },
                  mt: { xs: 1.5, sm: 2 },
                }}
              >
                {allImages.map((img, index) => (
                  <Thumbnail key={`m-${img}`} src={img} index={index} />
                ))}
              </Box>
            )}
          </Box>

          {/* Panneau achat */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 3.5 },
              borderRadius: { xs: '20px', sm: '22px', md: '25px' },
              border: `1px solid ${C.border}`,
              bgcolor: C.paper,
              position: { lg: 'sticky' },
              top: { lg: 96 },
              boxShadow: `0 12px 40px ${alpha(C.dark, 0.06)}`,
            }}
          >
            <Stack direction="row" gap={{ xs: 0.75, sm: 1 }} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: { xs: 1.5, sm: 2 } }}>
              {(product.popular || product.is_featured) && (
                <Chip
                  label="Populaire"
                  size="small"
                  sx={{ bgcolor: alpha(C.gold, 0.15), color: C.accentOnLight, fontWeight: 700, fontSize: { xs: 11.5, sm: 12.5, md: 13.75 } }}
                />
              )}
              {product.is_new && (
                <Chip label="Nouveau" size="small" sx={{ bgcolor: C.light, color: C.primary, fontWeight: 700, fontSize: { xs: 11.5, sm: 12.5, md: 13.75 } }} />
              )}
              {product.pieces != null && product.pieces > 0 && (
                <Chip
                  label={`${product.pieces} pièce${product.pieces > 1 ? 's' : ''}`}
                  size="small"
                  sx={{ bgcolor: C.surface, color: C.muted, fontWeight: 600, fontSize: { xs: 11.5, sm: 12.5, md: 13.75 } }}
                />
              )}
              {product.category_name && (
                <Chip
                  label={product.category_name}
                  size="small"
                  component={Link}
                  href={`/shop?category=${product.category_id}`}
                  clickable
                  sx={{ bgcolor: C.surface, color: C.primary, fontWeight: 600, fontSize: { xs: 11.5, sm: 12.5, md: 13.75 } }}
                />
              )}
              <Box sx={{ flex: 1 }} />
              <IconButton
                onClick={() => onToggleFavorite(productIdStr)}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                sx={{
                  border: `1px solid ${C.primary}`,
                  borderRadius: '50%',
                  width: { xs: 36, sm: 45 },
                  height: { xs: 36, sm: 45 },
                  color: isFavorite ? C.statusError : C.paper,
                  bgcolor: C.primary,
                  boxShadow: `0 2px 8px ${alpha(C.primary, 0.25)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: C.brandHover,
                    boxShadow: `0 4px 12px ${alpha(C.brandHover, 0.35)}`,
                    transform: 'scale(1.1)',
                  },
                }}
              >
                {isFavorite ? <FavoriteIcon sx={{ fontSize: { xs: 17, sm: 22.5 } }} /> : <FavoriteBorderIcon sx={{ fontSize: { xs: 17, sm: 22.5 } }} />}
              </IconButton>
            </Stack>

            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem', lg: '1.75rem' },
                fontWeight: 800,
                color: C.dark,
                letterSpacing: '-0.03em',
                lineHeight: { xs: 1.25, md: 1.2 },
                mb: { xs: 1.5, sm: 1.75, md: 2 },
              }}
            >
              {product.name}
            </Typography>

            {product.average_rating && Number(product.average_rating) > 0 && (
              <Stack direction="row" spacing={{ xs: 0.5, sm: 0.75 }} sx={{ alignItems: 'center', mb: { xs: 1.5, sm: 2 } }}>
                <StarIcon sx={{ fontSize: { xs: 18, sm: 20, md: 22.5 }, color: C.gold }} />
                <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 16, md: 17.5 }, color: C.dark }}>
                  {Number(product.average_rating).toFixed(1)}
                </Typography>
                {reviewCount > 0 && (
                  <Typography sx={{ fontSize: { xs: 14, sm: 15, md: 16.25 }, color: C.muted }}>({reviewCount} avis)</Typography>
                )}
              </Stack>
            )}

            <Box sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
              <Stack direction="row" spacing={{ xs: 1, sm: 1.25, md: 1.5 }} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: { xs: '1.5rem', sm: '1.65rem', md: '1.75rem', lg: '2rem' }, fontWeight: 800, color: C.dark, letterSpacing: '-0.02em' }}>
                  {formatPrice(price)}
                </Typography>
                {originalPrice && originalPrice > price && (
                  <Typography sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: C.muted, textDecoration: 'line-through' }}>
                    {formatPrice(originalPrice)}
                  </Typography>
                )}
              </Stack>

              {discountPercent != null && userType !== 'wholesale' && (
                <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: { xs: 1, sm: 1.25 } }}>
                  <Chip
                    label={`-${discountPercent}%`}
                    size="small"
                    sx={{ bgcolor: alpha(C.statusError, 0.08), color: C.statusError, fontWeight: 800, fontSize: { xs: 13, sm: 14, md: 15 } }}
                  />
                  <Typography sx={{ fontSize: { xs: 14, sm: 15, md: 16.25 }, color: C.statusSuccess, fontWeight: 600 }}>
                    Économisez {formatPrice(originalPrice! - price)}
                  </Typography>
                </Stack>
              )}

              {userType === 'wholesale' && (
                <Chip
                  label="Prix grossiste appliqué"
                  size="small"
                  sx={{ mt: { xs: 1, sm: 1.25 }, bgcolor: C.light, color: C.primary, fontWeight: 700, fontSize: { xs: 12, sm: 13, md: 14 } }}
                />
              )}
            </Box>

            {(product.short_description || product.description) && (
              <Typography sx={{ fontSize: { xs: 15, sm: 16, md: 17.5 }, color: C.text, lineHeight: { xs: 1.6, sm: 1.7, md: 1.75 }, mb: { xs: 2, sm: 2.5, md: 3 } }}>
                {product.short_description || product.description}
              </Typography>
            )}

            <Divider sx={{ borderColor: C.border, mb: { xs: 2, sm: 2.5, md: 3 } }} />

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography sx={{ fontSize: { xs: 15, sm: 16, md: 17.5 }, fontWeight: 700, color: C.dark }}>Quantité</Typography>
              <Stack direction="row" spacing={{ xs: 0.25, sm: 0.5 }} sx={{ alignItems: 'center' }}>
                <IconButton
                  aria-label="Diminuer la quantité"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={!canBuy || quantity <= 1}
                  size="small"
                  sx={{ border: `1px solid ${C.border}`, borderRadius: { xs: '10px', sm: '11px', md: '12.5px' }, width: { xs: 38, sm: 42, md: 45 }, height: { xs: 38, sm: 42, md: 45 } }}
                >
                  <Minus fontSize="small" sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />
                </IconButton>
                <Typography sx={{ minWidth: { xs: 45, sm: 50, md: 55 }, textAlign: 'center', fontWeight: 800, fontSize: { xs: 17, sm: 18.5, md: 20 } }}>
                  {quantity}
                </Typography>
                <IconButton
                  aria-label="Augmenter la quantité"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!canBuy}
                  size="small"
                  sx={{ border: `1px solid ${C.border}`, borderRadius: { xs: '10px', sm: '11px', md: '12.5px' }, width: { xs: 38, sm: 42, md: 45 }, height: { xs: 38, sm: 42, md: 45 } }}
                >
                  <Plus fontSize="small" sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />
                </IconButton>
              </Stack>
            </Stack>

            {!canBuy ? (
              <Alert severity="warning" variant="outlined" sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
                Produit indisponible à la vente.
              </Alert>
            ) : isLowStock ? (
              <Alert severity="info" variant="outlined" sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
                {`Plus que ${product.inventory_quantity} ${product.inventory_quantity > 1 ? 'exemplaires' : 'exemplaire'} en stock.`}
              </Alert>
            ) : null}

            <Stack spacing={{ xs: 1, sm: 1.25, md: 1.5 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<ShoppingCart sx={{ fontSize: { xs: 18, sm: 20, md: 22 } }} />}
                onClick={() => onAddToCart(product, quantity)}
                disabled={!canBuy}
                sx={{
                  py: { xs: 1.25, sm: 1.4, md: 1.5 },
                  borderRadius: { xs: '12px', sm: '13px', md: '15px' },
                  fontWeight: 800,
                  fontSize: { xs: 15.5, sm: 17, md: 18.75 },
                  textTransform: 'none',
                  bgcolor: C.primary,
                  boxShadow: `0 8px 24px ${alpha(C.primary, 0.35)}`,
                  '&:hover': { bgcolor: C.dark },
                }}
              >
                {canBuy ? 'Ajouter au panier' : 'Indisponible'}
              </Button>
            </Stack>

            <Stack spacing={{ xs: 1, sm: 1.5, md: 1.75 }}>
              {trustPoints.map(({ icon: Icon, text }) => (
                <Stack key={text} direction="row" spacing={{ xs: 0.75, sm: 1.25, md: 1.5 }} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: { xs: 34, sm: 42, md: 45 },
                      height: { xs: 34, sm: 42, md: 45 },
                      borderRadius: { xs: '9px', sm: '11px', md: '12.5px' },
                      bgcolor: C.light,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: { xs: 17, sm: 20, md: 22.5 }, color: C.primary }} />
                  </Box>
                  <Typography sx={{ fontSize: { xs: 13.5, sm: 15, md: 16.25 }, color: C.text, lineHeight: { xs: 1.35, sm: 1.45, md: 1.5 }, pt: { xs: 0.25, sm: 0.35, md: 0.5 } }}>{text}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Box>

        {/* Détails */}
        <Paper
          elevation={0}
          sx={{
            mt: { xs: 4, sm: 5, md: 7 },
            borderRadius: { xs: '20px', sm: '22px', md: '25px' },
            border: `1px solid ${C.border}`,
            bgcolor: C.paper,
            overflow: 'hidden',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_: React.SyntheticEvent, v: number) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: { xs: 1, sm: 1.5, md: 2 },
              borderBottom: `1px solid ${C.border}`,
              minHeight: { xs: 55, sm: 60, md: 65 },
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: { xs: 14, sm: 15.5, md: 17.5 },
                textTransform: 'none',
                color: C.muted,
                minHeight: { xs: 55, sm: 60, md: 65 },
                '&.Mui-selected': { color: C.primary },
              },
              '& .MuiTabs-indicator': { height: { xs: 3, sm: 3.5, md: 3.75 }, borderRadius: '3.75px 3.75px 0 0', bgcolor: C.primary },
            }}
          >
            <Tab label="Description" />
            <Tab label="Livraison" />
            <Tab label="Paiement" />
          </Tabs>

          <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
            <CustomTabPanel value={tabValue} index={0}>
              <Typography sx={{ fontSize: { xs: 15, sm: 16.5, md: 18.75 }, color: C.text, lineHeight: { xs: 1.6, sm: 1.7, md: 1.8 }, mb: { xs: 2, sm: 2.5, md: 3 } }}>
                {product.description || product.short_description || 'Description à venir.'}
              </Typography>
              <Typography sx={{ fontSize: { xs: 15.5, sm: 16.5, md: 17.5 }, fontWeight: 800, color: C.dark, mb: { xs: 1, sm: 1.25, md: 1.5 } }}>Caractéristiques</Typography>
              <Box component="ul" sx={{ pl: { xs: 2, sm: 2.25, md: 2.5 }, m: 0, '& li': { mb: { xs: 0.75, sm: 1 } } }}>
                <Typography component="li" sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: C.text }}>Importé directement de Chine</Typography>
                <Typography component="li" sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: C.text }}>Qualité premium contrôlée</Typography>
                {product.pieces != null && product.pieces > 0 && (
                  <Typography component="li" sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: C.text }}>
                    Ensemble de {product.pieces} pièce{product.pieces > 1 ? 's' : ''}
                  </Typography>
                )}
                {product.sku && (
                  <Typography component="li" sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: C.text }}>Réf. {product.sku}</Typography>
                )}
              </Box>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={1}>
              <Stack spacing={{ xs: 2, sm: 2.25, md: 2.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: C.dark, mb: { xs: 0.35, sm: 0.4, md: 0.5 }, fontSize: { xs: 14.5, sm: 15.5, md: 17.5 } }}>Dakar & banlieue</Typography>
                  <Typography sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: C.text }}>Livraison express sous 24–48h ouvrées.</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: C.dark, mb: { xs: 0.35, sm: 0.4, md: 0.5 }, fontSize: { xs: 14.5, sm: 15.5, md: 17.5 } }}>Reste du Sénégal</Typography>
                  <Typography sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: C.text }}>Expédition sous 3–5 jours ouvrés avec suivi.</Typography>
                </Box>
              </Stack>
            </CustomTabPanel>

            <CustomTabPanel value={tabValue} index={2}>
              <Typography sx={{ fontSize: { xs: 14.5, sm: 16, md: 17.5 }, color: C.text, mb: { xs: 1.5, sm: 1.75, md: 2 } }}>
                Paiement sécurisé — Wave, Orange Money ou paiement à la livraison.
              </Typography>
              <PaymentIcons size="md" showLabels />
            </CustomTabPanel>
          </Box>
        </Paper>

        {/* Similaires */}
        <Box sx={{ mt: { xs: 5, sm: 6, md: 7, lg: 9 } }}>
          <Box sx={{ mb: { xs: 3, sm: 3.5, md: 4 } }}>
            <Typography sx={{ fontSize: { xs: 12, sm: 12.5, md: 13.75 }, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.primary, mb: { xs: 0.75, sm: 1 } }}>
              Vous aimerez aussi
            </Typography>
            <Typography component="h2" sx={{ fontSize: { xs: '1.35rem', sm: '1.45rem', md: '1.5rem', lg: '1.85rem' }, fontWeight: 800, color: C.dark, letterSpacing: '-0.03em' }}>
              Produits similaires
            </Typography>
          </Box>

          {loadingSimilar ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2.25, md: 2.5 } }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" height={{ xs: 350, sm: 400, md: 450 }} sx={{ borderRadius: { xs: '15px', sm: '16px', md: '17.5px' } }} />
              ))}
            </Box>
          ) : similarProducts.length > 0 ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: { xs: 1.5, sm: 2.25, md: 2.5 } }}>
              {similarProducts.map((similarProduct) => (
                <ProductCard
                  key={similarProduct.id}
                  product={similarProduct}
                  onAddToCart={(p) => onAddToCart(p, 1)}
                  onViewDetails={onViewProduct}
                  userType={userType}
                  isFavorite={favorites.includes(String(similarProduct.id))}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </Box>
          ) : null}
        </Box>
      </Container>
    </Box>
  );
}
