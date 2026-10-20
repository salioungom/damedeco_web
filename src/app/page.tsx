/**
 * Page d'accueil — Server Component.
 *
 * Les données (catégories actives + produits populaires) sont récupérées
 * côté serveur : le HTML initial contient déjà le contenu réel, et le
 * premier rendu côté client ne doit plus déclencher un aller-retour API
 * (3 à 5 s d'affichage statique avant l'hydratation des données).
 *
 * Les animations GSAP du hero démarrent donc avec les données déjà
 * présentes (voir `src/features/home/hero/HeroSection.tsx`).
 */

import { HomePageClient } from '@/components/HomePageClient';
import { homeService } from '@/services/home.service';
import { productService } from '@/services/product.service';
import { Product, Category } from '@/lib/types';
import type { ApiError } from '@/lib/error-handler';

// ISR : la page est servie depuis le cache et regénérée au plus tard toutes
// les 60 s. Le contenu affiché reste identique (mêmes données, même rendu).
export const revalidate = 60;

interface HomeData {
  categories: Category[];
  popularProducts: Product[];
  error: ApiError | null;
}

async function loadHomeData(): Promise<HomeData> {
  try {
    const [categoriesResult, productsResult] = await Promise.all([
      homeService.getActiveCategories(),
      productService.getProducts({ limit: 8 }),
    ]);

    const categoryMap = new Map<number, string>();
    let categories: Category[] = [];
    let error: ApiError | null = null;

    if (categoriesResult.error) {
      error = categoriesResult.error;
    } else {
      categories = categoriesResult.data || [];
      categories.forEach((cat: Category) => {
        categoryMap.set(Number(cat.id), cat.name);
      });
    }

    let popularProducts: Product[] = [];
    if (productsResult.error) {
      if (!error) error = productsResult.error;
    } else {
      const items = productsResult.data?.items || [];
      popularProducts = items.map((product: Product) => ({
        ...product,
        category_name: categoryMap.get(product.category_id) || undefined,
      }));
    }

    return { categories, popularProducts, error };
  } catch (err) {
    // Échec réseau/serveur : on rend une page cohérente (état vide + message
    // d'erreur) au lieu de laisser remonter une exception non capturée.
    console.error('Error loading home data:', err);
    return {
      categories: [],
      popularProducts: [],
      error: {
        message: 'Erreur lors du chargement des données',
        isNetworkError: false,
        isTimeout: false,
        isServerError: false,
        isClientError: false,
      },
    };
  }
}

export default async function Page() {
  const { categories, popularProducts, error } = await loadHomeData();

  return (
    <HomePageClient
      categories={categories}
      popularProducts={popularProducts}
      error={error}
    />
  );
}
