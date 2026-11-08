'use client';

import Link from 'next/link';
import { Box, Chip, Skeleton } from '@mui/material';
import {
  heroCategoriesNavSx,
  heroCategoryChipSx,
  heroCategorySkeletonSx,
  heroMoreChipSx,
} from './heroStyles';

export interface HeroCategoryLink {
  id: string | number;
  name: string;
  slug: string;
  href: string;
}

interface HeroCategoriesListProps {
  categories: HeroCategoryLink[];
  hasMore: boolean;
}

export default function HeroCategoriesList({
  categories,
  hasMore,
}: HeroCategoriesListProps) {
  return (
    <Box component="nav" aria-label="Catégories" sx={heroCategoriesNavSx}>
      {categories.map((category, index) => (
        <Chip
          key={category.id}
          component={Link}
          href={category.href}
          label={category.name}
          variant="outlined"
          sx={heroCategoryChipSx(index)}
        />
      ))}
      {hasMore && (
        <Chip
          component={Link}
          href="/shop"
          label="Plus +"
          variant="outlined"
          sx={heroMoreChipSx}
        />
      )}
    </Box>
  );
}

export function HeroCategoriesSkeleton() {
  return (
    <Box component="nav" aria-label="Catégories" sx={heroCategoriesNavSx}>
      {[0, 1, 2, 3].map((item) => (
        <Skeleton
          key={item}
          variant="rounded"
          width={96}
          sx={heroCategorySkeletonSx}
        />
      ))}
    </Box>
  );
}
