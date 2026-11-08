import { API_URL_SERVER } from '@/lib/api-url';
import HeroCategoriesList, {
  type HeroCategoryLink,
} from './HeroCategoriesList';

interface ApiCategory {
  id: string | number;
  name: string;
  slug: string;
}

function isApiCategory(value: unknown): value is ApiCategory {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    (typeof value.id === 'string' || typeof value.id === 'number') &&
    'name' in value &&
    typeof value.name === 'string' &&
    'slug' in value &&
    typeof value.slug === 'string'
  );
}

function parseCategories(payload: unknown): ApiCategory[] {
  let items: unknown[];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (
    typeof payload === 'object' &&
    payload !== null &&
    'items' in payload &&
    Array.isArray(payload.items)
  ) {
    items = payload.items;
  } else {
    throw new Error('Unexpected active categories response shape');
  }

  const categories = items.filter(isApiCategory);
  if (categories.length !== items.length) {
    throw new Error('Active categories response contains invalid entries');
  }

  return categories;
}

export default async function HeroCategories() {
  let categories: HeroCategoryLink[];

  try {
    const response = await fetch(API_URL_SERVER + '/api/v1/categories/active', {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error('Active categories request failed with status ' + response.status);
    }

    categories = parseCategories(await response.json()).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      href: '/shop?category=' + encodeURIComponent(String(category.id)),
    }));
  } catch (error) {
    console.error('Error loading hero categories:', error);
    return null;
  }

  if (categories.length === 0) return null;

  return (
    <HeroCategoriesList
      categories={categories}
      hasMore={categories.length > 8}
    />
  );
}
