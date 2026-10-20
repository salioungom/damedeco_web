'use client';

/**
 * Wrapper client de la page d'accueil.
 *
 * La page (`src/app/page.tsx`) est un Server Component : elle récupère les
 * données côté serveur et les passe ici. Ce composant ne fait que le câblage
 * « client » (store Zustand + navigation) et transmet ces données à
 * `HomePage`, qui n'a plus aucun `useEffect` de chargement.
 */

import { HomePage } from '@/components/HomePage';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/lib/types';
import type { ApiError } from '@/lib/error-handler';

interface HomePageClientProps {
  categories: Category[];
  popularProducts: Product[];
  error: ApiError | null;
}

export function HomePageClient({ categories, popularProducts, error }: HomePageClientProps) {
  const addToCart = useStore((s) => s.addToCart);
  const userType = useStore((s) => s.userType);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const router = useRouter();

  return (
    <HomePage
      onAddToCart={addToCart}
      onViewProduct={(product) => router.push(`/product/${product.id}`)}
      onViewCategory={(categoryId) => router.push(`/shop?category=${categoryId}`)}
      userType={userType}
      favorites={favorites}
      onToggleFavorite={toggleFavorite}
      categories={categories}
      popularProducts={popularProducts}
      error={error}
    />
  );
}
