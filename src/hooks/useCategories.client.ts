import { categoryService, type Category } from '@/services/category.service';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';
import { useState, useEffect } from 'react';

/** Client hook : utilisation côté composants */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const result = await getCategoriesServer();
      setCategories(result.categories);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      }
    }
    fetchCategories();
  }, []);

  return { categories, loading, error };
}

/** Server function interne au hook */
async function getCategoriesServer() {
  try {
    const result = await categoryService.getActiveCategories();
    
    if (result.error) {
      return { categories: [], error: result.error };
    }
    
    return { categories: result.data || [], error: null };
  } catch (err) {
    const apiError = ApiErrorHandler.classifyError(err);
    return { categories: [], error: apiError };
  }
}