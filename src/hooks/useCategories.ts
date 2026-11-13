import { categoryService, type Category } from '@/services/category.service';
import { ApiError, ApiErrorHandler } from '@/lib/error-handler';

/** Server function : récupère les categories côté serveur */
export async function getCategories() {
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