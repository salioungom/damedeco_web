import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowForward,
  Inventory2Outlined,
  LocalShippingOutlined,
} from '@mui/icons-material';
import { Box, Chip, Typography } from '@mui/material';
import type { Product } from '@/lib/types';
import { formatFcfa } from '@/lib/format';
import { getImageUrl } from '@/lib/imageUtils';
import { tokens } from '@/theme/tokens';
import styles from './HeroSection.module.css';
import {
  heroDeliveryBadgeSx,
  heroDeliveryIconSx,
  heroDeliveryLabelSx,
  heroDeliveryLocationSx,
  heroImageContainerSx,
  heroImageFrameSx,
  heroImageOverlaySx,
  heroSelectionArrowSx,
  heroSelectionCardSx,
  heroSelectionContentSx,
  heroSelectionDiscountChipSx,
  heroSelectionEyebrowSx,
  heroSelectionFallbackTextSx,
  heroSelectionFallbackTitleSx,
  heroSelectionImageSx,
  heroSelectionOriginalPriceSx,
  heroSelectionPlaceholderSx,
  heroSelectionPriceRowSx,
  heroSelectionPriceSx,
  heroSelectionProductNameSx,
  heroSelectionSavingsSx,
  heroSelectionThumbnailSx,
} from './heroStyles';

interface HeroImageProps {
  featuredProduct: Product | null;
  featuredDiscount: number | null;
  image: string;
  imageAlt: string;
}

function DeliveryBadge() {
  return (
    <Box data-hero="badge" sx={heroDeliveryBadgeSx}>
      <LocalShippingOutlined
        sx={heroDeliveryIconSx}
        aria-hidden="true"
      />
      <Box>
        <Typography sx={heroDeliveryLabelSx}>Livraison express</Typography>
        <Typography sx={heroDeliveryLocationSx}>Dakar &amp; banlieue</Typography>
      </Box>
    </Box>
  );
}

function SelectionCard({
  featuredProduct,
  featuredDiscount,
}: Pick<HeroImageProps, 'featuredProduct' | 'featuredDiscount'>) {
  const hasFeaturedProduct = featuredProduct !== null;
  const originalPrice = featuredProduct
    ? Number(featuredProduct.original_price ?? featuredProduct.compare_price ?? 0)
    : 0;
  const currentPrice = featuredProduct ? Number(featuredProduct.price) : 0;
  const hasDiscount = originalPrice > currentPrice;
  const savingsAmount = hasDiscount ? originalPrice - currentPrice : 0;
  const discountPercent = hasDiscount
    ? Math.round((savingsAmount / originalPrice) * 100)
    : featuredDiscount;
  const href = featuredProduct ? `/product/${featuredProduct.id}` : '/shop';

  return (
    <Box
      component={Link}
      href={href}
      data-hero="card"
      sx={heroSelectionCardSx}
    >
      <Box sx={heroSelectionThumbnailSx}>
        {hasFeaturedProduct && featuredProduct.cover_image_url ? (
          <Box
            component="img"
            src={getImageUrl(featuredProduct.cover_image_url)}
            alt={featuredProduct.name}
            loading="lazy"
            decoding="async"
            sx={heroSelectionImageSx}
          />
        ) : (
          <Inventory2Outlined
            sx={heroSelectionPlaceholderSx}
            aria-hidden="true"
          />
        )}
      </Box>
      <Box sx={heroSelectionContentSx}>
        <Typography sx={heroSelectionEyebrowSx}>
          SÉLECTION DU MOMENT
        </Typography>
        {hasFeaturedProduct ? (
          <>
            <Typography sx={heroSelectionProductNameSx}>
              {featuredProduct.name}
            </Typography>
            <Box sx={heroSelectionPriceRowSx}>
              <Typography sx={heroSelectionPriceSx}>
                {formatFcfa(currentPrice)}
              </Typography>
              {hasDiscount && (
                <Typography sx={heroSelectionOriginalPriceSx}>
                  {formatFcfa(originalPrice)}
                </Typography>
              )}
              {hasDiscount && discountPercent != null && (
                <Chip
                  label={'-' + discountPercent + '%'}
                  size="small"
                  color="error"
                  sx={heroSelectionDiscountChipSx}
                />
              )}
            </Box>
            {hasDiscount && (
              <Typography sx={heroSelectionSavingsSx}>
                Économisez {formatFcfa(savingsAmount)}
              </Typography>
            )}
          </>
        ) : (
          <>
            <Typography sx={heroSelectionFallbackTitleSx}>
              Notre sélection arrive prochainement
            </Typography>
            <Typography sx={heroSelectionFallbackTextSx}>
              Parcourez la boutique dès maintenant.
            </Typography>
          </>
        )}
      </Box>
      <ArrowForward
        className="arrow-icon"
        sx={heroSelectionArrowSx}
        aria-hidden="true"
      />
    </Box>
  );
}

export default function HeroImage({
  featuredProduct,
  featuredDiscount,
  image,
  imageAlt,
}: HeroImageProps) {
  return (
    <Box sx={heroImageContainerSx}>
      <Box
        data-hero="image"
        className={styles.entranceItem}
        sx={heroImageFrameSx}
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1200px) 60vw, 100vw"
        />
        <Box sx={heroImageOverlaySx} />
        <DeliveryBadge />
      </Box>
      <SelectionCard
        featuredProduct={featuredProduct}
        featuredDiscount={featuredDiscount}
      />
    </Box>
  );
}
